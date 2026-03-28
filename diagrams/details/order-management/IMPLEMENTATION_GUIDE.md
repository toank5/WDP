# Order Management - Implementation Guide

## Overview
The Order Management feature handles the complete order lifecycle from checkout to delivery, including payment processing via VNPAY, inventory reservation, and order status tracking.

## Feature Scope
### Operations
| Operation | Description | Endpoint |
|-----------|-------------|----------|
| **Checkout** | Process cart items into an order with payment | `POST /orders/checkout` |
| **View Orders** | List all user orders with pagination | `GET /orders` |
| **View Order Details** | Get specific order details | `GET /orders/:id` |
| **Approve Order** | Staff approves pending order | `POST /orders/:id/approve` |
| **Cancel Order** | Customer or staff cancels order | `POST /orders/:id/cancel` |
| **Update Status** | Staff updates order status | `PATCH /orders/:id/status` |
| **VNPAY Callback** | Handle payment gateway callback | `POST /orders/:id/vnpay-callback` |

## Database Schema
### Key Entities

**Order** - Located at `wdp-be/src/order/entities/order.entity.ts`
| Property | Type | Description |
|----------|------|-------------|
| `id` | string (UUID) | Primary key |
| `orderNumber` | string | Human-readable order number |
| `customerId` | string (UUID) | Foreign key to User |
| `orderType` | OrderType | READY, PREORDER, EXCHANGE |
| `orderStatus` | OrderStatus | PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED |
| `items` | OrderItem[] | Order items |
| `totalAmount` | number | Total order amount |
| `shippingAddress` | Address | Delivery address |
| `payment` | PaymentInfo | Payment details |
| `tracking` | TrackingInfo | Shipping tracking |
| `createdAt` | Date | Order creation timestamp |
| `updatedAt` | Date | Last update timestamp |

**Relationships:**
- `customerId` → User.id (Many-to-One)
- `items` → OrderItem[] (One-to-Many)

**OrderItem** - Located at `wdp-be/src/order/entities/order-item.entity.ts`
| Property | Type | Description |
|----------|------|-------------|
| `id` | string (UUID) | Primary key |
| `orderId` | string (UUID) | Foreign key to Order |
| `productVariantId` | string (UUID) | Foreign key to ProductVariant |
| `productName` | string | Product name snapshot |
| `quantity` | number | Item quantity |
| `unitPrice` | number | Price per unit |
| `totalPrice` | number | Line item total |

**Cart** - Located at `wdp-be/src/cart/entities/cart.entity.ts`
| Property | Type | Description |
|----------|------|-------------|
| `id` | string (UUID) | Primary key |
| `userId` | string (UUID) | Foreign key to User |
| `items` | CartItem[] | Cart items |

**Inventory** - Located at `wdp-be/src/inventory/entities/inventory.entity.ts`
| Property | Type | Description |
|----------|------|-------------|
| `id` | string (UUID) | Primary key |
| `productVariantId` | string (UUID) | Foreign key to ProductVariant |
| `availableQuantity` | number | Available for sale |
| `reservedQuantity` | number | Reserved for pending orders |
| `soldQuantity` | number | Sold total |

## DTOs
### CheckoutRequestDto
Located at `wdp-be/src/order/dto/checkout-request.dto.ts`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `shippingAddress` | AddressDto | Yes | Delivery address |
| `paymentMethod` | PaymentMethod | Yes | VNPAY, CASH_ON_DELIVERY, BANK_TRANSFER |
| `note` | string | No | Customer notes |

### OrderResponseDto
Located at `wdp-be/src/order/dto/order-response.dto.ts`
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Order ID |
| `orderNumber` | string | Order number |
| `orderStatus` | OrderStatus | Current status |
| `totalAmount` | number | Total amount |
| `items` | OrderItemResponseDto[] | Order items |
| `createdAt` | Date | Creation date |

### CancelDto
Located at `wdp-be/src/order/dto/cancel.dto.ts`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | Yes | Cancellation reason |

## API Endpoints
### POST /orders/checkout
**Description**: Process cart items into an order with VNPAY payment

**Request**:
```json
{
  "shippingAddress": {
    "fullName": "John Doe",
    "phone": "0123456789",
    "address": "123 Main St",
    "city": "Ho Chi Minh",
    "district": "District 1",
    "ward": "Ward 1"
  },
  "paymentMethod": "VNPAY",
  "note": "Please deliver in the morning"
}
```

**Response** (201 CREATED):
```json
{
  "orderNumber": "ORD-2024-03-27-1234",
  "paymentUrl": "https://vnpay.vn/payment?...",
  "order": {
    "id": "uuid",
    "orderStatus": "PENDING",
    "totalAmount": 1500000
  }
}
```

### GET /orders
**Description**: List user orders with pagination

**Query Parameters**: `page`, `limit`, `status`

**Response** (200 OK):
```json
{
  "data": [...],
  "total": 10,
  "page": 1,
  "limit": 10
}
```

### GET /orders/:id
**Description**: Get order details

**Response** (200 OK):
```json
{
  "id": "uuid",
  "orderNumber": "ORD-2024-03-27-1234",
  "orderStatus": "PAID",
  "orderType": "READY",
  "items": [...],
  "totalAmount": 1500000,
  "shippingAddress": {...},
  "tracking": {
    "trackingNumber": "VN123456789",
    "carrier": "GHN"
  }
}
```

### POST /orders/:id/approve
**Description**: Staff approves pending order (STAFF only)

**Response** (200 OK):
```json
{
  "orderNumber": "ORD-2024-03-27-1234",
  "orderStatus": "PAID"
}
```

### POST /orders/:id/cancel
**Description**: Cancel order (customer or staff)

**Request**:
```json
{
  "reason": "No longer needed"
}
```

**Response** (200 OK):
```json
{
  "orderNumber": "ORD-2024-03-27-1234",
  "orderStatus": "CANCELLED",
  "refundTxnId": "VNPAY-REFUND-123"
}
```

## Implementation Requirements
### 1. Controller Implementation
Located at `wdp-be/src/order/order.controller.ts`

**Required Methods:**
- `checkout()` - Validate JWT, call CheckoutService
- `findAll()` - Support pagination and status filtering
- `findOne()` - Validate ownership (customer) or bypass (staff)
- `approve()` - RBAC check for STAFF roles, call OrderService
- `cancel()` - Validate cancellable status, handle refunds if paid
- `updateStatus()` - RBAC check, validate status transitions
- `handleVnpayCallback()` - Verify signature, update payment status

### 2. Service Implementation
Located at `wdp-be/src/order/order.service.ts` and `wdp-be/src/checkout/checkout.service.ts`

**CheckoutService:**
- Validate cart is not empty
- Reserve inventory (atomic operation)
- Calculate totals with any discounts
- Determine order type based on item availability
- Create order and order items in transaction
- Generate VNPAY payment URL
- Clear user cart

**OrderService:**
- Validate order ownership for customer access
- Validate status transitions (state machine)
- Handle refund logic for paid orders
- Send email notifications for status changes
- Update inventory on cancellation/completion

**InventoryService:**
- Check stock availability before reservation
- Reserve stock for pending orders
- Confirm reservation when order is paid
- Release reservation when order is cancelled
- Track all movements in inventory history

### 3. Authentication & Authorization
- **Authentication**: JwtAuthGuard on all endpoints except VNPAY callback
- **Authorization**:
  - Customer: Can only view/cancel their own orders
  - Staff (MANAGER, OPERATION, SALE): Can view all orders, approve orders
  - Admin: Full access

**Guards:**
- `JwtAuthGuard` - Validates JWT token
- `RbacGuard` - Role-based access control

**Public Decorator:**
- VNPAY callback endpoint uses `@Public()` decorator

### 4. Payment Integration (VNPAY)
- Generate payment URL with order info and signature
- Handle callback with signature verification
- Update order status based on payment response
- Support refunds through VNPAY API
- Store transaction IDs for reconciliation

### 5. Email Notifications
- Order confirmation (after checkout)
- Payment confirmation (after VNPAY callback)
- Order approval (staff action)
- Order cancellation (with reason)
- Shipping confirmation (with tracking)
- Delivery confirmation

### 6. State Transitions
| From | To | Trigger | Refund? |
|------|-----|---------|---------|
| PENDING | PAID | Payment successful | No |
| PENDING | CANCELLED | Payment failed/timeout/Cancel | No |
| PAID | CANCELLED | Cancel before processing | Yes |
| PAID | PROCESSING | Staff approves | No |
| PROCESSING | SHIPPED | Package shipped | No |
| SHIPPED | DELIVERED | Customer confirms | No |
| SHIPPED | REFUNDED | Return approved | Yes |

## Diagrams
- State Machine: `diagrams/state-machine/order.state.puml`
- Sequence Diagrams:
  - Checkout: `diagrams/details/order-management/sequence-checkout.puml`
  - Approve: `diagrams/details/order-management/sequence-approve.puml`
  - Cancel: `diagrams/details/order-management/sequence-cancel.puml`
  - View: `diagrams/details/order-management/sequence-view.puml`
- Class Diagram: `diagrams/details/order-management/class-diagram.puml`

## Error Handling
| Status Code | Scenario |
|-------------|----------|
| 400 | Cart empty, insufficient stock, invalid status transition |
| 401 | Missing or invalid JWT token |
| 403 | Accessing another customer's order |
| 404 | Order not found |
| 409 | Inventory reservation failed |
| 500 | Payment gateway error, database error |
