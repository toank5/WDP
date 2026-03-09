# Real-World Walkthrough: Complete Order Lifecycle with Inventory Management

## Scenario: Customer Orders 2 Black Medium Sunglasses

### Background Data
```
Product: Designer Sunglasses - Black Medium
SKU: VT-001-BLK-M
Current Inventory:
  - Physical Stock (onHand): 50 units
  - Reserved Stock: 10 units (for other orders)
  - Available Stock: 40 units (can sell)
  
Other Orders' Reserved Stock: 10 units
- Order 1: 3 units (CONFIRMED - awaiting shipment)
- Order 2: 4 units (CONFIRMED - awaiting shipment)
- Order 3: 3 units (CONFIRMED - awaiting shipment)
```

---

## Timeline: Step-by-Step Walkthrough

### ⏰ 10:00 AM - Customer Adds to Cart
**Action**: Customer browses website and adds 2 units to shopping cart

**Database State**:
```
Inventory: { sku: "VT-001-BLK-M", onHand: 50, reserved: 10, available: 40 }
NO CHANGES - Cart is just local storage, no database impact
```

**UI**: Cart shows "2 × Designer Sunglasses - Black Medium"

---

### ⏰ 10:05 AM - Checkout Initiates
**Action**: Customer clicks "Proceed to Checkout"

**API Call**:
```bash
POST /orders/checkout
Authorization: Bearer <JWT_TOKEN>
Body: {
  items: [
    {
      productId: "507f-...",
      variantSku: "VT-001-BLK-M",
      quantity: 2,
      priceAtOrder: 100000
    }
  ],
  shippingAddress: { ... },
  payment: { method: "VNPAY" }
}
```

**Backend Processing**:
```typescript
// OrderService.checkout()
1. Validate cart items exist and have stock
   ✅ available (40) >= requested (2)
   
2. Calculate totals
   - subtotal: 200,000 VND
   - shipping: 30,000 VND
   - tax (10%): 23,000 VND
   - total: 253,000 VND
   
3. Create order
   - status: PENDING
   - NO stock reservation yet
   
4. Generate VNPAY payment URL
   - includes orderId, amount, return URL
```

**Order Created**:
```json
{
  "_id": "ORDER-001",
  "orderNumber": "ORD-1704067500123",
  "orderStatus": "PENDING",
  "items": [
    {
      "variantSku": "VT-001-BLK-M",
      "quantity": 2,
      "priceAtOrder": 100000,
      "isPreorder": false
    }
  ],
  "totalAmount": 253000,
  "payment": {
    "method": "VNPAY",
    "amount": 253000,
    "paidAt": null
  }
}
```

**Database State**:
```
Inventory: { sku: "VT-001-BLK-M", onHand: 50, reserved: 10, available: 40 }
NO CHANGES - Payment not confirmed yet
```

**UI Response**:
```json
{
  "order": { ... },
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
}
```

**Frontend**: Redirects customer to VNPAY payment page

---

### ⏰ 10:10 AM - Customer Completes Payment
**Action**: Customer enters card details on VNPAY website and completes payment

**VNPAY Processing**:
- Validates card
- Deducts money from customer's account
- Records transaction: SUCCESS (response code = 00)
- Prepares IPN callback notification

**UI**: Shows "Processing Payment..." spinner

---

### ⏰ 10:10:30 AM - ⭐ VNPAY IPN CALLBACK (CRITICAL MOMENT)
**VNPAY sends to your backend**:
```bash
GET /orders/vnpay-callback?
  orderId=ORDER-001&
  vnp_ResponseCode=00&
  vnp_TransactionNo=TX-12345678&
  vnp_Amount=25300000&
  vnp_SecureHash=abc123...
```

**Backend: OrderController.handleVNPayCallback()**:
```typescript
1. Verify callback signature with VNPAY secret key
   ✅ Signature matches - authentic callback
   
2. Extract orderId from query parameters
   orderId = "ORDER-001"
```

**Backend: OrderService.handleVNPayCallback()**:
```typescript
1. Find order by ID
   order = { orderNumber: "ORD-1704067500123", ... }
   
2. Verify callback with VNPayService
   result = { success: true, transactionId: "TX-12345678" }
   
3. Since success == true:
   a) Record payment confirmation
      - order.payment.paidAt = 2024-01-02T10:10:30Z
      - order.payment.transactionId = "TX-12345678"
      
   b) Update order status
      - order.orderStatus = "CONFIRMED"
      
   c) 🔑 RESERVE STOCK (Key Action!)
      - Call this.reserveStock(order.items, order._id)
      
   d) Add history entry
      - { status: "CONFIRMED", note: "Payment successful via VNPay" }
      
   e) Save order to database
```

**Backend: OrderService.reserveStock()**:
```typescript
for each item in order.items:
  - item.variantSku = "VT-001-BLK-M"
  - item.quantity = 2
  - item.isPreorder = false (not a pre-order)
  
  // Check if pre-order
  if (item.isPreorder) {
    continue;  // Skip - would have no stock to reserve
  }
  
  // Reserve stock for this specific order
  await inventoryService.reserveStock(
    "VT-001-BLK-M",  // SKU
    "ORDER-001",    // Order ID
    2               // Exact quantity from order
  );
```

**Backend: InventoryService.reserveStock()**:
```typescript
1. Load current inventory
   current = { onHand: 50, reserved: 10, available: 40 }
   
2. Validate quantity parameter
   quantity = 2
   if (!quantity || quantity <= 0) throw error
   ✅ Valid
   
3. CORE VALIDATION:
   Check: available >= quantity
   40 >= 2 ?
   ✅ YES - Sufficient stock to reserve
   
4. Perform Reservation
   newReserved = 10 + 2 = 12
   newAvailable = 40 - 2 = 38
   
   inventory.reservedQuantity = 12
   inventory.availableQuantity = 38
   // NOTE: onHand stays at 50 (items still in warehouse)
   
5. Save to database
   
6. Create InventoryMovement record (audit trail)
   {
     sku: "VT-001-BLK-M",
     movementType: "RESERVATION",
     quantity: 2,
     stockBefore: 50,
     stockAfter: 50,
     reason: "Reserved for order ORD-1704067500123 (Payment confirmed)",
     orderId: ObjectId("ORDER-001"),
     note: "Reservation: 2 units locked. Reserved: 10→12, Available: 40→38",
     createdAt: 2024-01-02T10:10:30Z
   }
```

**Database State After Reservation**:
```
Inventory Record:
{
  sku: "VT-001-BLK-M",
  stockQuantity: 50,        ← UNCHANGED
  reservedQuantity: 12,     ← +2 (from 10)
  availableQuantity: 38     ← -2 (from 40)
}

InventoryMovement Record Created:
{
  movementType: "RESERVATION",
  quantity: 2,
  orderId: ObjectId("ORDER-001")
}

Order Record Updated:
{
  _id: "ORDER-001",
  orderStatus: "CONFIRMED",
  payment: {
    paidAt: "2024-01-02T10:10:30Z",
    transactionId: "TX-12345678"
  },
  history: [
    { status: "CONFIRMED", note: "Payment successful via VNPay" }
  ]
}
```

**Result**:
```
📊 Inventory Impact:
Before:  onHand=50, reserved=10,  available=40
After:   onHand=50, reserved=12,  available=38

✅ Stock locked for this customer's order
✅ No other customer can buy these 2 units
✅ Items still in warehouse (onHand unchanged)
✅ Audit trail created for compliance
```

**⚠️ Why This Matters**:
```
If another customer tries to order 39 units during this time:
- Available stock is now 38 (down from 40)
- Trying to reserve 39 units
- ❌ BLOCKED - Error: "Insufficient available stock"

Without this reservation:
- Available would still be 40
- ✅ Could accept 39 units
- 🔴 Result: OVERSELLING (only 50 units but 2+39=41 promised!)
```

---

### ⏰ 10:10:45 AM - Order Confirmation Page
**Frontend Receives**: Order confirmation with status = CONFIRMED

**UI Shows**:
- ✅ Order placed successfully
- ✅ Payment received (✓ Paid)
- Order status: CONFIRMED
- Order number: ORD-1704067500123
- Total: 253,000 VND

**Customer Notification**: Receives email confirming payment and order

---

### ⏰ 10:00 AM Next Day - Warehouse: Order Packing
**Action**: Warehouse staff picks items and packs order

**System Status**:
- Order status: CONFIRMED
- Inventory: onHand=50, reserved=12, available=38
- NO DATABASE CHANGES during packing

**Warehouse Actions**:
1. Scan order barcode
2. Pick 2 units of VT-001-BLK-M from shelf
3. Pack into box
4. Generate shipping label

---

### ⏰ 11:00 AM Next Day - Order Shipped
**Action**: Delivery company picks up order

**Admin Portal Action**: Staff updates order status
```bash
PATCH /orders/ORDER-001/status
{
  "status": "SHIPPED",
  "trackingNumber": "GHN123456789",
  "carrier": "Giao Hang Nhanh (GHN)",
  "estimatedDelivery": "2024-01-04T18:00:00Z"
}
```

**Backend Processing**:
```typescript
// OrderService.updateOrderStatus()
1. Load order
2. Validate transition: CONFIRMED → SHIPPED allowed ✅
3. Update order status
4. Add tracking info
5. Call confirmStock() - shifts reservation → confirmed
6. Add history entry
7. Save order
```

**Database State**:
```
Inventory: STILL NO CHANGE
{
  sku: "VT-001-BLK-M",
  onHand: 50,        ← Items still in warehouse
  reserved: 12,      ← Still locked
  available: 38      ← Still unavailable
}

Order:
{
  orderStatus: "SHIPPED",
  tracking: {
    carrier: "GHN",
    trackingNumber: "GHN123456789",
    estimatedDelivery: "2024-01-04T18:00:00Z"
  }
}
```

**UI Update**: Order status badge changes to "Shipped"

---

### ⏰ 3:00 PM - Customer Receives Order
**Action**: Delivery driver delivers package to customer's address

**Customer Reaction**: ✅ "Package received in perfect condition!"

**Warehouse Status**: ⏳ Waiting for receipt confirmation

---

### ⏰ 3:30 PM - ⭐ OPERATIONS STAFF CONFIRMS RECEIPT
**Action**: Operations staff sees notification that package was delivered

**Admin Dashboard**: Staff clicks "Confirm Received" button on order

**Frontend: OrderDetailPage.tsx**:
```typescript
handleConfirmReceipt = async () => {
  if (!order) return;
  
  // Show confirmation dialog
  if (!confirm('Mark this order as delivered? This will finalize the inventory.')) {
    return;
  }
  
  setConfirming(true);
  
  try {
    // Call backend API
    const updatedOrder = await orderApi.confirmReceipt(order._id);
    
    setOrder(updatedOrder);  // Update UI with new status
    
    // Show success notification
    setToastMessage({
      text: 'Order marked as delivered successfully',
      type: 'success'
    });
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => setToastMessage(null), 3000);
    
  } catch (err) {
    // Show error notification
    setToastMessage({
      text: err.message,
      type: 'error'
    });
    setTimeout(() => setToastMessage(null), 5000);
  } finally {
    setConfirming(false);
  }
}
```

**API Call**:
```bash
POST /orders/ORDER-001/confirm-receipt
Authorization: Bearer <JWT_TOKEN_OF_STAFF>
```

**Backend: OrderController.confirmReceipt()**:
```typescript
@Post(':id/confirm-receipt')
@Roles(UserRole.OPERATION)  // Only staff can do this!
async confirmReceipt(@Param('id') orderId: string) {
  return this.orderService.confirmReceipt(orderId);
}
```

**Backend: OrderService.confirmReceipt() - 🔑 FINAL INVENTORY DEDUCTION**:
```typescript
// Start transaction for atomicity
const session = await mongoose.startSession();
session.startTransaction();

try {
  // 1. Load order
  const order = await this.orderModel.findById("ORDER-001");
  
  // 2. Validate order is SHIPPED
  if (order.orderStatus !== "SHIPPED") {
    throw new BadRequestException(
      "Order must be SHIPPED to confirm receipt"
    );
  }
  
  // 3. For each order item, deduct inventory
  for (const item of order.items) {
    // item.variantSku = "VT-001-BLK-M"
    // item.quantity = 2
    
    // Load inventory
    const inventory = await this.inventoryModel.findOne({
      sku: "VT-001-BLK-M"
    });
    
    // Current state: onHand=50, reserved=12, available=38
    
    // Validate reserved quantity
    if (inventory.reservedQuantity < item.quantity) {
      throw new BadRequestException(
        "Insufficient reserved stock for SKU..."
      );
    }
    
    // 💥 CRITICAL DEDUCTION:
    const newOnHand = 50 - 2 = 48;           // Items left warehouse
    const newReserved = 12 - 2 = 10;         // Reservation released
    const newAvailable = 48 - 10 = 38;       // Auto-recalculated
    
    // Update inventory in database
    await this.inventoryModel.findOneAndUpdate(
      { sku: "VT-001-BLK-M" },
      {
        stockQuantity: 48,
        reservedQuantity: 10,
        availableQuantity: 38
      },
      { session }
    );
    
    // Create movement record for audit
    await this.inventoryModel.collection.insertOne({
      sku: "VT-001-BLK-M",
      movementType: "CONFIRMED",
      quantity: -2,
      stockBefore: 50,
      stockAfter: 48,
      reason: "Delivered to customer - Order ORD-1704067500123",
      note: "Receipt confirmed for order ORD-1704067500123"
    });
  }
  
  // 4. Update order
  order.orderStatus = "DELIVERED";
  order.tracking.actualDelivery = new Date();
  order.history.push({
    status: "DELIVERED",
    note: "Customer receipt confirmed by operations staff"
  });
  
  await order.save({ session });
  
  // 5. Commit transaction (all-or-nothing)
  await session.commitTransaction();
  
  return order;
  
} catch (error) {
  await session.abortTransaction();  // Rollback everything
  throw error;
} finally {
  await session.endSession();
}
```

**Database State After Delivery Confirmation - ⭐ FINAL**:
```
Inventory Record:
{
  sku: "VT-001-BLK-M",
  stockQuantity: 48,        ← -2 (items left warehouse!)
  reservedQuantity: 10,     ← -2 (reserved released)
  availableQuantity: 38     ← UNCHANGED (stays 38)
}

InventoryMovement Records (now 2):
1. RESERVATION: +2 (when payment succeeded)
2. CONFIRMED: -2 (when delivery confirmed)

Order Record Final:
{
  orderStatus: "DELIVERED",
  tracking: {
    actualDelivery: "2024-01-03T15:30:00Z"
  },
  history: [
    { status: "CONFIRMED", note: "Payment successful via VNPay" },
    { status: "DELIVERED", note: "Customer receipt confirmed by operations staff" }
  ]
}
```

**Frontend UI Update**:
```
Order Status Badge: Changes to "DELIVERED" (emerald green)
"Confirm Received" Button: Disappears (no longer SHIPPED)
Toast Notification: ✅ "Order marked as delivered successfully"
```

---

## Summary Table

| Phase | Time | Status | onHand | reserved | available | Action |
|-------|------|--------|--------|----------|-----------|--------|
| Order created | 10:00 | PENDING | 50 | 10 | 40 | - |
| Payment success | 10:10 | CONFIRMED | 50 | 12 | 38 | ✅ Reserved |
| Packing | Next day | CONFIRMED | 50 | 12 | 38 | - |
| Shipped | Next day | SHIPPED | 50 | 12 | 38 | - |
| Delivered | 15:30 | DELIVERED | 48 | 10 | 38 | ✅ Deducted |

---

## Key Insights

### 1. Three-State Inventory System
```
Available = onHand - reserved

Example:
- 50 physical units in warehouse
- 10 reserved for previous orders
- 40 available to new customers

When payment succeeds:
- 50 physical units (unchanged)
- 12 reserved for this order (+2)
- 38 available to new customers (-2)

When delivered:
- 48 physical units (-2 left warehouse)
- 10 reserved (maintained for tracking)
- 38 available (unchanged)
```

### 2. Prevents Overselling
```
Without reservation system:
- Customer 1: Orders 40 units → Available=40 ✅
- Customer 2: Orders 15 units → Available=15 (now only 25!) ❌
- Total: 55 units promised but only 50 exist! 🔴

With reservation system:
- Customer 1: Orders 40 units → Available becomes 10 ✓
- Customer 2: Tries to order 15 units → 10 < 15 ✅ BLOCKED
- Only 40 units committed ✓
```

### 3. Audit Trail for Compliance
```
Every inventory change is recorded:
- When: Exact timestamp
- What: Which operation (RESERVATION, CONFIRMED)
- Why: Which order and customer
- By: System trace for debugging

Provides complete history for:
- Account reconciliation
- Dispute resolution
- Financial audits
- Analytics
```

### 4. Pre-Order Handling
```
If order contained:
- 2 × Regular item (isPreorder=false) → Reserved ✅
- 1 × Pre-order item (isPreorder=true) → NOT reserved ✅

Result: 
- Regular items locked for customer
- Pre-order fulfilled separately when stock arrives
- No artificial inventory shortage
```

---

## What Could Go Wrong?

### Scenario A: Other customer orders while you're at checkout
```
Available stock: 40 units
You try to order: 2 units
Other customer orders: 39 units

Timeline:
1. You start checkout
2. Other customer's payment succeeds → (40-39=1 available)
3. YOU complete payment → Tries to reserve 2 units
4. ❌ ERROR: "Insufficient available stock. Available: 1, Needed: 2"
5. Your payment refunded automatically by VNPAY

You'd need to:
- Check available inventory
- Reduce order quantity OR
- Start fresh checkout
```

### Scenario B: Payment fails
```
Status remains: PENDING_PAYMENT
Inventory: onHand=50, reserved=10, available=40 (NO CHANGE)
Your payment: Refunded by VNPAY
You can: Retry payment immediately
```

### Scenario C: Delivery confirmation fails
```
Reason: System error (e.g., network timeout)
Inventory: onHand=50, reserved=12, available=38 (NO CHANGE)
Order Status: Still SHIPPED

Operations can: Retry confirmation

Because transactions are atomic:
- Either ALL changes succeeded or NONE succeeded
- No partial updates possible
- Safe to retry
```

---

## Command-Line Verification

### Check Inventory State
```mongodb
db.inventories.findOne({ sku: "VT-001-BLK-M" })
```

### Check All Movement Records
```mongodb
db.inventorymovements.find({
  sku: "VT-001-BLK-M",
  orderId: ObjectId("ORDER-001")
}).sort({ createdAt: 1 })
```

### Check Order History
```mongodb
db.orders.findOne({ orderNumber: "ORD-1704067500123" })
```

### Verify Payment Details
```mongodb
db.orders.findOne({
  _id: ObjectId("ORDER-001")
}, {
  "payment": 1,
  "orderStatus": 1,
  "history": 1
})
```

---

## Conclusion

This real-world walkthrough demonstrates how:

1. ✅ **Payment → Reservation** happens automatically and immediately
2. ✅ **Inventory stays physically unchanged** until delivery
3. ✅ **Overselling is prevented** by tracking available stock
4. ✅ **Delivery → Final Deduction** completes the order
5. ✅ **Audit trail is maintained** for every transaction
6. ✅ **Transactions ensure consistency** (all-or-nothing)

The system is designed to be **safe** (prevent overselling), **transparent** (audit trail), and **user-friendly** (clear status updates).
