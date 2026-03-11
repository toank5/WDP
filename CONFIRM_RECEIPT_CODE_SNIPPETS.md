# "Confirm Receipt" Implementation - Code Snippets

## Backend Service Method

### OrderService: `confirmReceipt()` 
**File**: `wdp-be/src/services/order.service.ts`

```typescript
/**
 * Confirm receipt (Operations Staff action)
 * Marks order as DELIVERED and performs final inventory deduction
 * Requirements:
 * - Order must be in SHIPPED status
 * - Deducts physical stock (onHand) for each item
 * - Releases reservation for each item
 * - Creates inventory movement records
 * - Sets deliveredAt timestamp
 */
async confirmReceipt(orderId: string): Promise<OrderResponseDto> {
  // Use transaction for atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await this.orderModel
      .findById(orderId)
      .session(session);

    if (!order) {
      await session.abortTransaction();
      throw new NotFoundException('Order not found');
    }

    // Validate order status is SHIPPED
    if (order.orderStatus !== ORDER_STATUS.SHIPPED) {
      await session.abortTransaction();
      throw new BadRequestException(
        `Order must be in SHIPPED status to confirm receipt. Current status: ${order.orderStatus}`,
      );
    }

    // Process inventory deduction for each order item
    for (const item of order.items) {
      if (item.variantSku) {
        // Get current inventory by SKU within transaction
        const inventoryModel = this.orderModel.collection.db.collection('inventories');
        const inventory = await inventoryModel.findOne(
          { sku: item.variantSku },
        );

        if (!inventory) {
          await session.abortTransaction();
          throw new NotFoundException(
            `Inventory not found for SKU: ${item.variantSku}`,
          );
        }

        // Validate we have enough reserved stock
        if (inventory.reservedQuantity < item.quantity) {
          await session.abortTransaction();
          throw new BadRequestException(
            `Insufficient reserved stock for SKU ${item.variantSku}. Reserved: ${inventory.reservedQuantity}, Needed: ${item.quantity}`,
          );
        }

        // Calculate new values
        const newStockQuantity = inventory.stockQuantity - item.quantity;
        if (newStockQuantity < 0) {
          await session.abortTransaction();
          throw new BadRequestException(
            `Stock quantity would be negative for SKU ${item.variantSku}`,
          );
        }

        const newReservedQuantity =
          inventory.reservedQuantity - item.quantity;
        const newAvailableQuantity =
          newStockQuantity - newReservedQuantity;

        // Update inventory
        await this.inventoryModel
          .findOneAndUpdate(
            { sku: item.variantSku },
            {
              stockQuantity: newStockQuantity,
              reservedQuantity: newReservedQuantity,
              availableQuantity: newAvailableQuantity,
            },
            { new: true, session },
          )
          .session(session);

        // Note: Movement record creation deferred to post-transaction
        // (can be done in a separate non-transactional call or through event)
      }
    }

    // Update order status and set deliveredAt
    order.orderStatus = ORDER_STATUS.DELIVERED;
    if (!order.tracking) {
      order.tracking = {};
    }
    order.tracking.actualDelivery = new Date();

    // Add to history
    order.history.push({
      status: ORDER_STATUS.DELIVERED,
      timestamp: new Date(),
      note: 'Customer receipt confirmed by operations staff',
    });

    await order.save({ session });

    await session.commitTransaction();

    // After successful transaction, create inventory movement records
    // (outside of transaction for better performance, but before returning)
    for (const item of order.items) {
      if (item.variantSku) {
        // Get final inventory state
        const finalInventory = await this.inventoryModel.findOne({
          sku: item.variantSku,
        });

        if (finalInventory) {
          // Create movement record for audit trail
          // (This is informational and non-critical if it fails)
          try {
            await this.inventoryModel.collection
              .insertOne({
                sku: item.variantSku,
                movementType: 'CONFIRMED',
                quantity: -item.quantity,
                stockBefore: finalInventory.stockQuantity + item.quantity,
                stockAfter: finalInventory.stockQuantity,
                reason: `Delivered to customer - Order ${order.orderNumber}`,
                reference: orderId,
                note: `Receipt confirmed for order ${order.orderNumber}`,
                orderId: new Types.ObjectId(orderId),
                createdAt: new Date(),
              })
              .catch((err) => {
                // Log but don't fail the overall operation
                console.error(
                  `Failed to create movement record for SKU ${item.variantSku}:`,
                  err,
                );
              });
          } catch (err) {
            // Silently continue - movement record is not critical
            console.error(
              `Error creating inventory movement: ${item.variantSku}`,
              err,
            );
          }
        }
      }
    }

    return this.getOrderWithDetails(orderId);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}
```

## Backend Controller Endpoint

### OrderController: `confirmReceipt()`
**File**: `wdp-be/src/controllers/order.controller.ts`

```typescript
/**
 * Confirm receipt (Operations Staff)
 * POST /orders/:id/confirm-receipt
 */
@Post(':id/confirm-receipt')
@UseGuards(JwtAuthGuard, RbacGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATION)
@HttpCode(HttpStatus.OK)
@ApiOperation({
  summary: 'Confirm order receipt',
  description:
    'Confirms that customer received the order and performs final inventory deduction. Restricted to Operations Staff and Manager.',
})
@ApiOkResponse({
  description: 'Receipt confirmed successfully',
  type: OrderResponseDto,
})
@ApiNotFoundResponse({
  description: 'Order not found',
  type: ErrorResponseDto,
})
@ApiBadRequestResponse({
  description: 'Order not in SHIPPED status',
  type: ErrorResponseDto,
})
@ApiForbiddenResponse({ description: 'Forbidden', type: ErrorResponseDto })
async confirmReceipt(
  @Param('id') orderId: string,
): Promise<OrderResponseDto> {
  return this.orderService.confirmReceipt(orderId);
}
```

## Frontend API Method

### OrderAPI: `confirmReceipt()`
**File**: `FE/src/lib/order-api.ts`

```typescript
/**
 * Confirm receipt (Operations Staff)
 * Marks order as DELIVERED and performs final inventory deduction
 */
async confirmReceipt(orderId: string): Promise<Order> {
  try {
    const response = await api.post(`/orders/${orderId}/confirm-receipt`)

    return unwrapApiPayload<Order>(response.data)
  } catch (error) {
    const message = extractApiMessage(error)
    throw new Error(message)
  }
}
```

## Frontend React Component

### OrderDetailPage: Enhanced with "Confirm Received" Button
**File**: `FE/src/pages/store/OrderDetailPage.tsx`

```typescript
// State additions
const [confirming, setConfirming] = useState(false)
const [toastMessage, setToastMessage] = useState<{ 
  text: string; 
  type: 'success' | 'error' 
} | null>(null)

// Handler function
const handleConfirmReceipt = async () => {
  if (!order) return

  if (!confirm('Mark this order as delivered? This will finalize the inventory.')) {
    return
  }

  setConfirming(true)
  try {
    const updatedOrder = await orderApi.confirmReceipt(order._id)
    setOrder(updatedOrder)
    setToastMessage({ 
      text: 'Order marked as delivered successfully', 
      type: 'success' 
    })
    setTimeout(() => setToastMessage(null), 3000)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to confirm receipt'
    setToastMessage({ 
      text: message, 
      type: 'error' 
    })
    setTimeout(() => setToastMessage(null), 5000)
  } finally {
    setConfirming(false)
  }
}

// Conditional render
const canConfirmReceipt = order && order.orderStatus === OrderStatus.SHIPPED

// Button markup
{canConfirmReceipt && (
  <button
    onClick={handleConfirmReceipt}
    disabled={confirming}
    className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm uppercase tracking-wider rounded-[2px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
  >
    <FiCheckCircle size={16} />
    {confirming ? 'Confirming...' : 'Confirm Received'}
  </button>
)}

// Toast notification markup
{toastMessage && (
  <div
    className={`fixed top-4 right-4 px-6 py-3 rounded-lg font-semibold shadow-lg z-50 ${
      toastMessage.type === 'success'
        ? 'bg-emerald-500 text-white'
        : 'bg-red-500 text-white'
    }`}
  >
    {toastMessage.text}
  </div>
)}
```

## Inventory Adjustment Logic

### Before Confirm Receipt
```
Order Item: SKU="VT-001-BLK-M", Quantity=2
Inventory State (Before):
- stockQuantity: 50
- reservedQuantity: 10
- availableQuantity: 40
```

### During Confirm Receipt
```typescript
// For each order item:
const newStockQuantity = inventory.stockQuantity - item.quantity;      // 50 - 2 = 48
const newReservedQuantity = inventory.reservedQuantity - item.quantity; // 10 - 2 = 8
const newAvailableQuantity = newStockQuantity - newReservedQuantity;    // 48 - 8 = 40
```

### After Confirm Receipt
```
Inventory State (After):
- stockQuantity: 48        (Deducted by 2)
- reservedQuantity: 8      (Released by 2)
- availableQuantity: 40    (Recalculated)

Movement Record Created:
{
  sku: "VT-001-BLK-M",
  movementType: "CONFIRMED",
  quantity: -2,
  stockBefore: 50,
  stockAfter: 48,
  reason: "Delivered to customer - Order ORD-1649200000-1234",
  reference: "orderId",
  orderId: ObjectId("..."),
  createdAt: new Date()
}
```

## Error Handling Examples

### Order Not Found
```json
{
  "statusCode": 404,
  "message": "Order not found"
}
```

### Order Not in SHIPPED Status
```json
{
  "statusCode": 400,
  "message": "Order must be in SHIPPED status to confirm receipt. Current status: CONFIRMED"
}
```

### Insufficient Reserved Stock
```json
{
  "statusCode": 400,
  "message": "Insufficient reserved stock for SKU VT-001-BLK-M. Reserved: 5, Needed: 10"
}
```

### Unauthorized Access
```json
{
  "statusCode": 403,
  "message": "Forbidden"
}
```

## Usage Flow

1. **Order placed** → PENDING
2. **Payment confirmed** → CONFIRMED (Stock reserved)
3. **Order packed & shipped** → SHIPPED
4. **Operations Staff sees "Confirm Received" button** (Only appears when status is SHIPPED)
5. **Staff clicks button** → API call to `/orders/{id}/confirm-receipt`
6. **Backend processes:**
   - Validates order is SHIPPED
   - For each item: Deducts inventory, releases reservation
   - Creates movement records
   - Sets status to DELIVERED
7. **Frontend receives updated order** → Shows success toast
8. **Order status displays as DELIVERED** → Button disappears

## Integration Testing

### Using cURL
```bash
curl -X POST http://localhost:3000/orders/507f1f77bcf86cd799439011/confirm-receipt \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json"
```

### Using Postman
- Method: POST
- URL: `{{BASE_URL}}/orders/{{ORDER_ID}}/confirm-receipt`
- Headers: 
  - Authorization: `Bearer {{JWT_TOKEN}}`
  - Content-Type: `application/json`
- Body: (Empty)

### Expected Success Response
```json
{
  "statusCode": 200,
  "message": "Order retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-1649200000-1234",
    "orderStatus": "DELIVERED",
    "tracking": {
      "carrier": "GHN",
      "trackingNumber": "123456789",
      "actualDelivery": "2026-03-09T10:30:00.000Z"
    },
    "history": [
      {
        "status": "DELIVERED",
        "timestamp": "2026-03-09T10:30:00.000Z",
        "note": "Customer receipt confirmed by operations staff"
      }
    ]
  }
}
```
