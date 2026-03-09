# VNPAY Payment Integration - Inventory Reservation on Successful Payment

## Overview
This document details how the VNPAY Instant Payment Notification (IPN) handler integrates with the inventory reservation system to lock stock items when customer payment is confirmed.

## Payment Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│  CUSTOMER CHECKOUT                                      │
│  POST /orders/checkout                                  │
│  Return: { orderId, paymentUrl }                        │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  VNPAY PAYMENT PAGE                                     │
│  Customer enters card details                           │
│  VNPAY processes payment                                │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
         ┌──────────────────────────────┐
         │ Payment Success (code=00)    │
         │ Payment Failure (code≠00)    │
         └──────────┬───────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  VNPAY SENDS IPN CALLBACK                               │
│  GET /orders/vnpay-callback                             │
│  Parameters: orderId, vnp_ResponseCode, vnp_TxnRef... │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Verify Signature     │  ← VNPayService
              │ Verify Amount        │
              │ Verify Response Code │
              └──────────┬───────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼ (Code=00)                ▼ (Code≠00)
    SUCCESS                         FAILURE
         │                               │
         ▼                               ▼
  Reserve Stock ⭐             Mark as RETURNED
  Create Movements             No Reservation
  Status=CONFIRMED            Status=RETURNED
```

## VNPAY IPN Callback Handler

### Endpoint
```
GET /orders/vnpay-callback?orderId=...&vnp_ResponseCode=00&vnp_TxnRef=...
Authorization: None (public endpoint for VNPAY callback)
```

### Order Service: handleVNPayCallback()
**File**: `wdp-be/src/services/order.service.ts`

```typescript
/**
 * Handle VNPay payment callback (IPN)
 * Called by VNPAY when payment processing is complete
 */
async handleVNPayCallback(
  orderId: string,
  callback: VNPayCallbackParamsDto,
): Promise<VNPayVerificationResultDto> {
  const order = await this.orderModel.findById(orderId);
  if (!order) {
    throw new NotFoundException('Order not found');
  }

  // Step 1: Verify the callback signature and parameters
  const result = await this.vnpayService.verifyCallback(callback);

  // Step 2: Update order based on payment result
  if (result.success) {
    // ✅ PAYMENT SUCCESSFUL (vnp_ResponseCode === '00')
    
    // Record payment confirmation
    order.payment.paidAt = new Date();
    order.payment.transactionId =
      result.transactionId || callback.vnp_TransactionNo;
    
    // Update order status
    order.orderStatus = ORDER_STATUS.CONFIRMED;

    // 🔑 KEY STEP: Reserve stock for the order items
    await this.reserveStock(order.items, order._id.toString());

    // Add to order history
    order.history.push({
      status: ORDER_STATUS.CONFIRMED,
      timestamp: new Date(),
      note: 'Payment successful via VNPay',
    });
  } else {
    // ❌ PAYMENT FAILED
    
    // Update order status
    order.orderStatus = ORDER_STATUS.RETURNED;

    // Add to order history
    order.history.push({
      status: ORDER_STATUS.RETURNED,
      timestamp: new Date(),
      note: `Payment failed: ${result.message}`,
    });
    
    // NOTE: No stock reservation for failed payments
  }

  // Step 3: Persist changes
  await order.save();

  return result;
}
```

### Order Service: reserveStock()
**File**: `wdp-be/src/services/order.service.ts`

```typescript
/**
 * Reserve stock for order items on successful payment
 * Skips reservation for pre-order items (they don't have stock yet)
 * 
 * Called from: handleVNPayCallback() when payment is successful
 * 
 * @param orderItems Array of order items to reserve
 * @param orderId Order ID for tracking and audit trail
 */
private async reserveStock(
  orderItems: OrderItem[],
  orderId: string,
): Promise<void> {
  for (const item of orderItems) {
    // 1. Skip items without SKU
    if (!item.variantSku) {
      continue;
    }

    // 2. IMPORTANT: Skip pre-order items
    // Pre-orders have no physical stock yet
    if (item.isPreorder) {
      // Pre-orders will be handled separately when stock arrives
      continue;
    }

    // 3. Reserve the specific quantity from this order item
    // Pass the exact quantity needed, not "all available"
    await this.inventoryService.reserveStock(
      item.variantSku,        // Which SKU to reserve
      orderId,                // Which order this is for
      item.quantity,          // How many units to reserve ⭐ REQUIRED!
    );
  }
}
```

### Inventory Service: reserveStock()
**File**: `wdp-be/src/services/inventory.service.ts`

```typescript
/**
 * Reserve stock for an order on successful payment
 * Locks items so they cannot be sold to other customers
 * 
 * Stock State During Reservation:
 * - onHand (stockQuantity): Unchanged - items still in warehouse
 * - reserved (reservedQuantity): Increased - locked to this order
 * - available (availableQuantity): Decreased - cannot sell to others
 * 
 * Transaction:
 * Input: (sku, orderId, quantity)
 * Output: Updated Inventory + InventoryMovement record
 * 
 * @param sku Variant SKU to reserve
 * @param orderId Order ID (for audit trail)
 * @param quantity Quantity to reserve (from order item)
 */
async reserveStock(
  sku: string,
  orderId: string,
  quantity?: number,
): Promise<Inventory> {
  // Step 1: Retrieve current inventory state
  const inventory = await this.inventoryModel.findOne({ sku });

  if (!inventory) {
    throw new NotFoundException(`Inventory not found for SKU: ${sku}`);
  }

  // Step 2: Validate quantity parameter
  if (!quantity || quantity <= 0) {
    throw new BadRequestException(
      `Invalid quantity for stock reservation. SKU: ${sku}, Quantity: ${quantity}`,
    );
  }

  // Step 3: Core Validation - Check available stock
  // Available Quantity = onHand - reserved
  // Requirement: available >= quantity_to_reserve
  if (quantity > inventory.availableQuantity) {
    throw new BadRequestException(
      `Insufficient available stock for SKU ${sku}. ` +
      `OnHand: ${inventory.stockQuantity}, ` +
      `Already Reserved: ${inventory.reservedQuantity}, ` +
      `Available: ${inventory.availableQuantity}, ` +
      `Needed: ${quantity}`,
    );
  }

  // Step 4: Perform the Reservation
  // Decrement availableQuantity, increment reservedQuantity
  // DO NOT touch stockQuantity - items still in warehouse!
  const previousReserved = inventory.reservedQuantity;
  const previousAvailable = inventory.availableQuantity;

  inventory.reservedQuantity += quantity;     // Lock these items
  inventory.availableQuantity -= quantity;    // Remove from sellable pool
  // Note: stockQuantity remains UNCHANGED

  // Persist changes
  await inventory.save();

  // Step 5: Create Audit Trail (InventoryMovement Record)
  await this.movementModel.create({
    sku,
    movementType: MovementType.RESERVATION,
    quantity: quantity, // Positive number for reservation action
    stockBefore: inventory.stockQuantity, // Unchanged
    stockAfter: inventory.stockQuantity,  // Unchanged
    reason: `Reserved for order ${orderId} (Payment confirmed)`,
    orderId: new Types.ObjectId(orderId),
    note: `Reservation: ${quantity} units locked. ` +
          `Reserved: ${previousReserved}→${inventory.reservedQuantity}, ` +
          `Available: ${previousAvailable}→${inventory.availableQuantity}`,
  });

  return inventory;
}
```

---

## Request/Response Flow Example

### Step 1: Checkout Initiation
```
Request:
POST /orders/checkout
Authorization: Bearer <JWT>
Body: {
  "items": [
    { "productId": "...", "variantSku": "VT-001-BLK-M", "quantity": 2, "priceAtOrder": 100000 }
  ],
  "shippingAddress": {...},
  "payment": { "method": "VNPAY" }
}

Response (201 Created):
{
  "statusCode": 201,
  "message": "Order created successfully",
  "data": {
    "order": {
      "_id": "507f1f77bcf86cd799439011",
      "orderNumber": "ORD-1649200000-1234",
      "orderStatus": "PENDING",
      "payment": { "method": "VNPAY", "amount": 202000 },
      "items": [...]
    },
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
  }
}

⚠️ At this point: NO stock reservation yet (payment not confirmed)
```

### Step 2: Customer Completes Payment on VNPAY
```
Customer action:
1. Redirected to paymentUrl
2. Enters card details on VNPAY server
3. VNPAY processes payment
4. Payment successful (response code = 00)
5. Customer redirected to return URL with query params
```

### Step 3: VNPAY Sends IPN Callback
```
VNPAY Server initiates:
GET http://your-backend.com/orders/vnpay-callback
  ?orderId=507f1f77bcf86cd799439011
  &vnp_ResponseCode=00
  &vnp_TransactionNo=12345678
  &vnp_TxnRef=TX-1649200000-1234
  &vnp_Amount=20200000  (cents)
  &vnp_SecureHash=abcdef...

⚠️ VNPAY does NOT send body, uses query parameters
⚠️ Signature verification is CRITICAL for security
```

### Step 4: Backend Processes Callback
```
Order Controller: handleVNPayCallback()
GET /orders/vnpay-callback

Flow:
1. Extract orderId from query parameter
2. Call OrderService.handleVNPayCallback(orderId, callback)
   ├─ Verify callback signature (validate vnp_SecureHash)
   ├─ Check response code
   │
   ├─ IF success (code=00):
   │  ├─ Update order.payment.paidAt = now
   │  ├─ Update order.payment.transactionId
   │  ├─ Update order.orderStatus = CONFIRMED ← Order now confirmed!
   │  │
   │  └─ Call reserveStock(order.items, orderId)
   │     ├─ For each item (skip pre-orders):
   │     │  ├─ Call inventoryService.reserveStock(sku, orderId, quantity)
   │     │  │  ├─ Validate available stock >= quantity
   │     │  │  ├─ reserved += quantity
   │     │  │  ├─ available -= quantity
   │     │  │  ├─ Save changes
   │     │  │  └─ Create InventoryMovement record
   │     │
   │     └─ Add history entry: "Payment successful via VNPay"
   │
   └─ IF failure (code≠00):
      ├─ Update order.orderStatus = RETURNED
      └─ Add history entry: "Payment failed: {error_message}"

3. Save order to database
4. Return verification result to VNPAY
```

### Step 5: Inventory State After Successful Payment
```
BEFORE Payment:
┌─────────────────────────────┐
│ SKU: VT-001-BLK-M          │
│ stockQuantity: 50          │
│ reservedQuantity: 10       │
│ availableQuantity: 40      │
└─────────────────────────────┘

Order Item: quantity = 2

AFTER Payment + Reservation:
┌─────────────────────────────┐
│ SKU: VT-001-BLK-M          │
│ stockQuantity: 50 (same)   │
│ reservedQuantity: 12 (+2)  │  ← Item is now locked
│ availableQuantity: 38 (-2) │  ← Cannot sell to others
└─────────────────────────────┘

InventoryMovement Record Created:
{
  sku: "VT-001-BLK-M",
  movementType: "RESERVATION",
  quantity: 2,
  stockBefore: 50,
  stockAfter: 50,
  reason: "Reserved for order ORD-1649200000-1234 (Payment confirmed)",
  orderId: ObjectId("507f1f77bcf86cd799439011"),
  createdAt: 2026-03-09T10:00:00Z
}
```

---

## Error Scenarios

### Scenario 1: Inventory Unavailable During Reservation
```
Payment Successful BUT stock not available anymore

Flow:
1. VNPAY confirms payment (code=00)
2. OrderService.reserveStock() called
3. InventoryService.reserveStock() checks availability
4. availableQuantity < needed quantity
5. Throws BadRequestException

Result:
⚠️ Problem: Payment succeeded but stock not reserved!
⚠️ Action Required: Manual intervention

Options:
a) Refund customer (call VNPAY API)
b) Backorder - notify customer of delay
c) Cancel order and refund
d) Upgrade to manual approval workflow
```

### Scenario 2: Pre-order Item Mixed with Ready Item
```
Order has:
- Item A: VT-001-BLK-M (ready stock) - isPreorder: false
- Item B: VT-002-WHT-L (pre-order) - isPreorder: true

Payment succeeds:

reserveStock() processes:
- Item A: Reserved ✅ (quantity locked)
- Item B: Skipped ✅ (pre-order has no stock)

Result:
- Only Item A has reserved quantity
- Item B will be handled when supplier stock arrives
```

### Scenario 3: Callback Verification Fails
```
Malicious request with forged parameters

Flow:
1. Receive IPN callback with fake signature
2. VNPayService.verifyCallback() validates signature
3. Signature doesn't match secret key
4. Throws verification error

Result:
❌ Payment NOT confirmed
❌ Stock NOT reserved
❌ Order status remains PENDING_PAYMENT
✅ No fraudulent reservation
```

---

## Testing the Payment + Reservation Flow

### Pre-conditions
1. Backend running on `http://localhost:3000`
2. MongoDB with sample inventory
3. VNPAY credentials configured in `.env`
4. Test card number from VNPAY (sandbox mode)

### Test Steps

```bash
# 1. Create order
curl -X POST http://localhost:3000/orders/checkout \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "507f1f77bcf86cd799439012",
        "variantSku": "VT-001-BLK-M",
        "quantity": 2,
        "priceAtOrder": 100000
      }
    ],
    "shippingAddress": {...},
    "payment": {"method": "VNPAY"}
  }'

Response: { orderId, paymentUrl }

# 2. Check initial inventory
db.inventories.findOne({ sku: "VT-001-BLK-M" })
# Should show: reservedQuantity unchanged (still 10)
# Should show: availableQuantity unchanged (still 40)

# 3. Simulate VNPAY callback (sandbox testing)
# - Use returned paymentUrl to complete test payment
# - VNPAY will send callback to your IPN endpoint
# OR manually trigger callback:

curl -X GET "http://localhost:3000/orders/vnpay-callback" \
  --data-urlencode "orderId=507f1f77bcf86cd799439011" \
  --data-urlencode "vnp_ResponseCode=00" \
  --data-urlencode "vnp_TransactionNo=123456" \
  --data-urlencode "vnp_TxnRef=TX-1649200000-1234" \
  --data-urlencode "vnp_Amount=20200000" \
  --data-urlencode "vnp_SecureHash=..." \
  -v

# 4. Check updated inventory
db.inventories.findOne({ sku: "VT-001-BLK-M" })
# Should show: reservedQuantity increased to 12
# Should show: availableQuantity decreased to 38

# 5. Check movement record
db.inventorymovements.findOne({ 
  sku: "VT-001-BLK-M",
  orderId: ObjectId("507f1f77bcf86cd799439011")
})
# Should show: movementType = "RESERVATION", quantity = 2
```

---

## Database Verification

### Query: Check Order Payment Status
```mongodb
db.orders.findOne({ orderNumber: "ORD-1649200000-1234" })
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "orderStatus": "CONFIRMED",
  "payment": {
    "method": "VNPAY",
    "paidAt": ISODate("2026-03-09T10:00:00Z"),
    "transactionId": "123456"
  },
  "history": [
    {
      "status": "PENDING",
      "note": "Order placed"
    },
    {
      "status": "CONFIRMED",
      "note": "Payment successful via VNPay",
      "timestamp": ISODate("2026-03-09T10:00:00Z")
    }
  ]
}
```

### Query: Check Inventory Reservation
```mongodb
db.inventories.findOne({ sku: "VT-001-BLK-M" })
{
  "sku": "VT-001-BLK-M",
  "stockQuantity": 50,
  "reservedQuantity": 12,  ← Increased by 2
  "availableQuantity": 38  ← Decreased by 2
}
```

### Query: Check Movement Record
```mongodb
db.inventorymovements.findOne({ 
  sku: "VT-001-BLK-M",
  movementType: "RESERVATION",
  orderId: ObjectId("507f1f77bcf86cd799439011")
})
{
  "sku": "VT-001-BLK-M",
  "movementType": "RESERVATION",
  "quantity": 2,
  "stockBefore": 50,
  "stockAfter": 50,
  "reason": "Reserved for order ORD-1649200000-1234 (Payment confirmed)",
  "orderId": ObjectId("507f1f77bcf86cd799439011"),
  "createdAt": ISODate("2026-03-09T10:00:00Z")
}
```

---

## Verification Checklist

After implementing VNPAY + Inventory Reservation:

- [ ] Checkout endpoint working (returns paymentUrl)
- [ ] VNPAY sandbox environment functional
- [ ] VNPay callback received successfully
- [ ] Signature verification working correctly
- [ ] Order status updated to CONFIRMED on success
- [ ] Order status updated to RETURNED on failure
- [ ] reserveStock() called only on success
- [ ] Pre-order items skipped in reservation
- [ ] Regular items reserved with correct quantity
- [ ] Inventory quantities updated correctly
- [ ] Movement records created for audit trail
- [ ] Error handling working for insufficient stock
- [ ] Database transactions rollback on error
- [ ] Multi-currency support working (if applicable)
- [ ] Order history properly recorded
- [ ] Frontend receives correct order status updates

---

## Related Documentation
- [Inventory Reservation Flow](./INVENTORY_RESERVATION_FLOW.md)
- [Confirm Receipt Implementation](./CONFIRM_RECEIPT_IMPLEMENTATION.md)
- [VNPAY Configuration Guide](./VNPAY_CONFIGURATION_GUIDE.md)
