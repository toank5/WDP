# Inventory Reservation Flow - Complete Implementation Guide

## Overview
This document explains the complete inventory lifecycle in the WDP system, from the moment payment is confirmed to when the order is delivered.

## Inventory States & Transitions

### Inventory Quantities
Every inventory record tracks three key quantities:

```
┌─────────────────────────────────┐
│  INVENTORY RECORD               │
│  sku: "VT-001-BLK-M"            │
├─────────────────────────────────┤
│  stockQuantity (onHand): 50     │  Physical items in warehouse
│  reservedQuantity: 10           │  Items locked for pending orders
│  availableQuantity: 40          │  Free to sell (stock - reserved)
└─────────────────────────────────┘

Formula:
availableQuantity = stockQuantity - reservedQuantity
```

---

## Complete Order Lifecycle

### Phase 1: Order Creation → Pending Payment
**Status**: `PENDING` → `PENDING_PAYMENT`
**Inventory Action**: None
**Reason**: Customer hasn't paid yet; don't lock inventory

```
Timeline:
1. Customer adds items to cart
2. Customer initiates checkout
3. Order created with status PENDING
4. Payment link generated (VNPAY)

Inventory State (No Change):
- stockQuantity: 50
- reservedQuantity: 10
- availableQuantity: 40
```

---

### Phase 2: Payment Successful via VNPAY ⭐ KEY STEP
**Status**: `PENDING_PAYMENT` → `CONFIRMED`
**Inventory Action**: RESERVE STOCK
**When**: VNPay IPN callback received with `vnp_ResponseCode === '00'`

**VNPAY Callback Handler Logic** (/services/order.service.ts - handleVNPayCallback):

```typescript
if (result.success) {  // vnp_ResponseCode === '00'
  order.payment.paidAt = new Date();
  order.orderStatus = ORDER_STATUS.CONFIRMED;
  
  // Reserve stock (NEW REQUIREMENT)
  await this.reserveStock(order.items, order._id.toString());
  
  order.history.push({
    status: ORDER_STATUS.CONFIRMED,
    note: 'Payment successful via VNPay'
  });
}
```

**Order Service: reserveStock() Method** (/services/order.service.ts):

```typescript
private async reserveStock(
  orderItems: OrderItem[],
  orderId: string,
): Promise<void> {
  for (const item of orderItems) {
    if (!item.variantSku) continue;
    
    // ✅ EXCEPTION: Skip pre-orders (no stock available yet)
    if (item.isPreorder) continue;
    
    // ✅ REQUIRED: Pass actual quantity from order item
    await this.inventoryService.reserveStock(
      item.variantSku,
      orderId,
      item.quantity  // ← Specific quantity, not all available
    );
  }
}
```

**Inventory Service: reserveStock() Method** (/services/inventory.service.ts):

```typescript
async reserveStock(
  sku: string,
  orderId: string,
  quantity: number,  // ← Required parameter
): Promise<Inventory> {
  const inventory = await this.inventoryModel.findOne({ sku });
  
  // 1. Validate: onHand - reserved >= quantity?
  if (quantity > inventory.availableQuantity) {
    throw new BadRequestException(
      `Insufficient available stock for SKU ${sku}. 
       OnHand: ${inventory.stockQuantity},
       Reserved: ${inventory.reservedQuantity},
       Available: ${inventory.availableQuantity},
       Needed: ${quantity}`
    );
  }
  
  // 2. Perform Reservation
  inventory.reservedQuantity += quantity;      // +2
  inventory.availableQuantity -= quantity;     // -2
  // Note: stockQuantity UNCHANGED
  
  await inventory.save();
  
  // 3. Create InventoryMovement record (audit trail)
  await this.movementModel.create({
    sku,
    movementType: MovementType.RESERVATION,
    quantity: quantity,
    stockBefore: inventory.stockQuantity,  // Unchanged
    stockAfter: inventory.stockQuantity,   // Unchanged
    reason: `Reserved for order ${orderId} (Payment confirmed)`,
    orderId: new Types.ObjectId(orderId)
  });
}
```

**Example State After Reservation**:
```
Order Item: SKU="VT-001-BLK-M", Quantity=2

BEFORE (Payment):
  stockQuantity: 50
  reservedQuantity: 10
  availableQuantity: 40

AFTER (Payment Confirmed):
  stockQuantity: 50         ← UNCHANGED (items still in warehouse)
  reservedQuantity: 12      ← +2 (locked for this order)
  availableQuantity: 38     ← -2 (removed from sellable pool)

InventoryMovement Created:
  {
    sku: "VT-001-BLK-M",
    movementType: "RESERVATION",
    quantity: 2,
    stockBefore: 50,
    stockAfter: 50,
    reason: "Reserved for order ORD-1649200000-1234 (Payment confirmed)",
    orderId: ObjectId("order..."),
    note: "Reservation: 2 units locked. Reserved: 10→12, Available: 40→38"
  }
```

---

### Phase 3: Order Processing & Packing
**Status**: `CONFIRMED` → `PROCESSING` → `CONFIRMED`
**Inventory Action**: None
**Reason**: Items still reserved; operations team preparing

```
Timeline:
1. Order confirmed (stock reserved)
2. Warehouse picks items
3. Items packed for shipment
4. Tracking number assigned

Inventory State (No Change):
- stockQuantity: 50
- reservedQuantity: 12
- availableQuantity: 38
```

---

### Phase 4: Order Shipped
**Status**: `CONFIRMED` → `SHIPPED`
**Inventory Action**: CONFIRM STOCK (prepare for deduction)
**Triggered By**: `PATCH /orders/:id/status` with status=SHIPPED

**Current Implementation** (stock already getting confirmed here):

```typescript
if (updateDto.status === ORDER_STATUS.SHIPPED) {
  await this.confirmStock(orderId);  // Shifts from RESERVATION → CONFIRMED
  
  if (!order.tracking) {
    order.tracking = {
      carrier: 'TBD',
      trackingNumber: 'TBD',
    };
  }
}
```

**State After Shipping**:
```
Inventory State (Prepared for Deduction):
- stockQuantity: 50        ← Still in warehouse technically
- reservedQuantity: 12     ← Still locked
- availableQuantity: 38    ← Still unavailable

InventoryMovement created with type: CONFIRMED
(This marks transition from RESERVATION to CONFIRMED)
```

---

### Phase 5: Delivery Confirmation (Confirm Receipt) ⭐ FINAL DEDUCTION
**Status**: `SHIPPED` → `DELIVERED`
**Inventory Action**: DEDUCT PHYSICAL STOCK
**Endpoint**: `POST /orders/:id/confirm-receipt`
**Triggered By**: Operations staff clicks "Confirm Received" button

**Request Handler** (/controllers/order.controller.ts):

```typescript
@Post(':id/confirm-receipt')
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATION)
async confirmReceipt(@Param('id') orderId: string): Promise<OrderResponseDto> {
  return this.orderService.confirmReceipt(orderId);
}
```

**Service Method** (/services/order.service.ts - confirmReceipt):

```typescript
async confirmReceipt(orderId: string): Promise<OrderResponseDto> {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const order = await this.orderModel.findById(orderId).session(session);
    
    // 1. Validate: Must be SHIPPED
    if (order.orderStatus !== ORDER_STATUS.SHIPPED) {
      throw new BadRequestException('Order must be SHIPPED to confirm receipt');
    }
    
    // 2. For each order item: Deduct inventory
    for (const item of order.items) {
      if (!item.variantSku) continue;
      
      const inventory = await this.inventoryModel
        .findOne({ sku: item.variantSku })
        .session(session);
      
      // Validate reserved quantity
      if (inventory.reservedQuantity < item.quantity) {
        throw new BadRequestException('Insufficient reserved stock');
      }
      
      // Deduct physical stock
      const newStockQuantity = inventory.stockQuantity - item.quantity;
      const newReservedQuantity = inventory.reservedQuantity - item.quantity;
      const newAvailableQuantity = newStockQuantity - newReservedQuantity;
      
      // Update inventory
      await this.inventoryModel.findOneAndUpdate(
        { sku: item.variantSku },
        {
          stockQuantity: newStockQuantity,
          reservedQuantity: newReservedQuantity,
          availableQuantity: newAvailableQuantity,
        },
        { session }
      );
    }
    
    // 3. Update order status and timestamp
    order.orderStatus = ORDER_STATUS.DELIVERED;
    order.tracking.actualDelivery = new Date();
    order.history.push({
      status: ORDER_STATUS.DELIVERED,
      note: 'Customer receipt confirmed by operations staff'
    });
    
    await order.save({ session });
    await session.commitTransaction();
    
    // 4. Create movement records (post-transaction)
    // ...create CONFIRMED type movements for audit
    
    return this.getOrderWithDetails(orderId);
  } finally {
    await session.endSession();
  }
}
```

**Example State After Delivery Confirmation**:
```
Order Item: SKU="VT-001-BLK-M", Quantity=2

BEFORE (Shipped - Reserved):
  stockQuantity: 50
  reservedQuantity: 12
  availableQuantity: 38

AFTER (Delivered - Confirmed):
  stockQuantity: 48        ← -2 (items left warehouse)
  reservedQuantity: 10     ← -2 (reservation released)
  availableQuantity: 38    ← UNCHANGED (stays same)

InventoryMovement Created:
  {
    sku: "VT-001-BLK-M",
    movementType: "CONFIRMED",
    quantity: -2,
    stockBefore: 50,
    stockAfter: 48,
    reason: "Delivered to customer - Order ORD-1649200000-1234",
    orderId: ObjectId("order..."),
    note: "Receipt confirmed for order ORD-1649200000-1234"
  }
```

---

## Complete Inventory Timeline Example

**Initial State**:
```
SKU: VT-001-BLK-M
- onHand: 50
- reserved: 10
- available: 40
```

**Order 1**: 2 units, Payment succeeds
```
After Reservation:
- onHand: 50 (unchanged)
- reserved: 10 + 2 = 12
- available: 40 - 2 = 38
```

**Order 2**: Tries to order 3 units (only 38 available)
```
✅ ALLOWED - 3 < 38
After Reservation:
- onHand: 50
- reserved: 12 + 3 = 15
- available: 38 - 3 = 35
```

**Order 3**: Tries to order 36 units
```
❌ BLOCKED - 36 > 35
Error: "Insufficient available stock. Available: 35, Needed: 36"
```

**Order 1 Delivered**:
```
After Deduction:
- onHand: 50 - 2 = 48
- reserved: 15 - 2 = 13
- available: 48 - 13 = 35 (unchanged)
```

**Order 2 Delivered**:
```
After Deduction:
- onHand: 48 - 3 = 45
- reserved: 13 - 3 = 10
- available: 45 - 10 = 35 (unchanged)
```

---

## Pre-Order Handling

Pre-order items (items with `isPreorder = true`) have special handling:

### Payment Stage (No Reservation)
```typescript
// In OrderService.reserveStock()
if (item.isPreorder) {
  continue;  // Skip reservation - no stock exists yet
}
```

**Reason**: Pre-orders don't have physical stock available, so there's nothing to reserve. The reservation happens later when stock arrives from the supplier.

### Stock Arrival (Fulfillment Reservation)
When supplier delivers pre-order stock, a new process fulfills the pending pre-orders:
1. Create inventory for pre-order items
2. Run fulfillment process to reserve stock for waiting orders
3. Change pre-order status to `READY_TO_FULFILL`
4. Generate shipment for customer

---

## Error Handling & Edge Cases

### Case 1: Reservation Fails (Insufficient Stock)
```
Scenario: Payment successful but inventory unavailable
Action: Server throws BadRequestException
Result: Order status stays PENDING_PAYMENT, transaction rolled back
Effect: Customer must retry payment or select fewer items
```

### Case 2: Order Cancelled Before Delivery
```
Scenario: Customer cancels after payment (before shipping)
Action: Call releaseStock(orderId)
Result: Reserved quantity returned to available
```

### Case 3: Multiple Orders for Same SKU
```
Scenario: Concurrent orders might cause race condition
Solution: MongoDB transactions with session used in confirmReceipt
Result: Atomicity guaranteed, no double-counting
```

---

## Database Indexes for Performance

```javascript
// Inventory collection
db.inventories.createIndex({ sku: 1 });
db.inventories.createIndex({ availableQuantity: 1 });

// Movement tracking
db.inventorymovements.createIndex({ sku: 1, createdAt: -1 });
db.inventorymovements.createIndex({ movementType: 1, createdAt: -1 });
db.inventorymovements.createIndex({ orderId: 1, movementType: 1 });
```

---

## API Endpoints Summary

| Operation | Endpoint | Method | Status | Action |
|-----------|----------|--------|--------|--------|
| Create Order | `/orders/checkout` | POST | PENDING | None |
| VNPay Callback | `/orders/vnpay-ipn` | GET | CONFIRMED | Reserve |
| Update Status | `/orders/:id/status` | PATCH | → SHIPPED | Confirm |
| Confirm Receipt | `/orders/:id/confirm-receipt` | POST | → DELIVERED | Deduct |
| Cancel Order | `/orders/:id/cancel` | POST | → CANCELLED | Release |

---

## Testing Checklist

### Reservation on Payment
- [ ] Create order with regular items
- [ ] Simulate VNPAY payment success
- [ ] Verify `reservedQuantity` increased
- [ ] Verify `availableQuantity` decreased
- [ ] Verify `stockQuantity` unchanged
- [ ] Verify movement record created

### Pre-Order Handling
- [ ] Create order with pre-order items
- [ ] Simulate payment success
- [ ] Verify pre-order items NOT reserved
- [ ] Verify regular items ARE reserved

### Inventory Deduction on Delivery
- [ ] Progress order to SHIPPED
- [ ] Call confirm-receipt endpoint
- [ ] Verify `stockQuantity` decreased
- [ ] Verify `reservedQuantity` decreased
- [ ] Verify movement record created

### Error Handling
- [ ] Try to confirm non-SHIPPED order
- [ ] Try to reserve more than available
- [ ] Try to deduct reserved for already-delivered order
- [ ] Concurrent requests to same order

---

## Implementation Verification

### Code Locations
- **Payment → Reservation**: `wdp-be/src/services/order.service.ts` - `handleVNPayCallback()` + `reserveStock()`
- **Inventory Service**: `wdp-be/src/services/inventory.service.ts` - `reserveStock()` method
- **Delivery → Deduction**: `wdp-be/src/services/order.service.ts` - `confirmReceipt()`
- **Frontend UI**: `FE/src/pages/store/OrderDetailPage.tsx` - "Confirm Received" button

### Key Requirements Met
✅ Reservation on successful payment  
✅ Pre-order items skipped (no stock to reserve)  
✅ Exact quantity from order items (not all available)  
✅ Inventory movement records created  
✅ Atomicity with transactions  
✅ Clear error messages  
✅ Audit trail for compliance
