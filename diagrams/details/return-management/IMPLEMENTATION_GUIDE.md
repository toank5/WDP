# Return Management - Implementation Guide

## Overview
The Return Management feature handles customer return requests, including warehouse verification, sales inspection, refund processing via VNPAY, and exchange order creation.

## Feature Scope
### Operations
| Operation | Description | Endpoint |
|-----------|-------------|----------|
| **Request Return** | Customer submits return request | `POST /returns` |
| **View Returns** | List user returns with pagination | `GET /returns` |
| **View Return Details** | Get specific return details | `GET /returns/:id` |
| **Staff Verify** | Warehouse staff verifies received items | `PATCH /returns/:id/staff-verify` |
| **Process Refund** | Sales staff approves/rejects return | `PATCH /returns/:id/process-refund` |
| **Cancel Return** | Customer cancels return request | `PATCH /returns/:id/cancel` |

## Database Schema
### Key Entities

**ReturnRequest** - Located at `wdp-be/src/return/entities/return-request.entity.ts`
| Property | Type | Description |
|----------|------|-------------|
| `id` | string (UUID) | Primary key |
| `returnNumber` | string | Human-readable return number |
| `orderId` | string (UUID) | Foreign key to Order |
| `userId` | string (UUID) | Foreign key to User |
| `status` | ReturnStatus | SUBMITTED, AWAITING_ITEMS, IN_REVIEW, APPROVED, COMPLETED, REJECTED, CANCELED |
| `returnType` | ReturnType | REFUND, EXCHANGE |
| `items` | ReturnItem[] | Items being returned |
| `requestedRefundAmount` | number | Initial refund amount |
| `approvedRefundAmount` | number | Final approved amount |
| `reason` | string | Return reason |
| `itemCondition` | ItemCondition | Warehouse assessment |
| `warehouseNotes` | string | Warehouse verification notes |
| `salesNotes` | string | Sales decision notes |
| `shippingLabel` | string | Generated shipping label URL |
| `refundTxnId` | string | VNPAY refund transaction ID |
| `exchangeOrderId` | string (UUID) | Exchange order ID (if applicable) |
| `submittedAt` | Date | Submission timestamp |
| `verifiedAt` | Date | Warehouse verification timestamp |
| `approvedAt` | Date | Sales approval timestamp |
| `completedAt` | Date | Completion timestamp |

**Relationships:**
- `orderId` → Order.id (Many-to-One)
- `userId` → User.id (Many-to-One)
- `items` → ReturnItem[] (One-to-Many)

**ReturnItem** - Located at `wdp-be/src/return/entities/return-item.entity.ts`
| Property | Type | Description |
|----------|------|-------------|
| `id` | string (UUID) | Primary key |
| `returnId` | string (UUID) | Foreign key to ReturnRequest |
| `orderItemId` | string (UUID) | Foreign key to OrderItem |
| `productVariantId` | string (UUID) | Foreign key to ProductVariant |
| `productName` | string | Product name snapshot |
| `quantity` | number | Return quantity |
| `reason` | string | Item-specific reason |
| `condition` | string | Customer-reported condition |
| `photos` | string[] | Photo URLs |
| `isReceived` | boolean | Warehouse received confirmation |

**Policy** - Located at `wdp-be/src/policy/entities/policy.entity.ts`
| Property | Type | Description |
|----------|------|-------------|
| `id` | string (UUID) | Primary key |
| `type` | PolicyType | RETURN, REFUND, WARRANTY, SHIPPING |
| `title` | string | Policy title |
| `summary` | string | Brief summary |
| `bodyPlainText` | string | Full policy text |
| `config` | PolicyConfig | Policy configuration (days, fees, etc.) |
| `version` | number | Policy version |
| `isActive` | boolean | Active status |

## DTOs
### CreateReturnDto
Located at `wdp-be/src/return/dto/create-return.dto.ts`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `orderId` | string | Yes | Original order ID |
| `returnType` | ReturnType | Yes | REFUND or EXCHANGE |
| `items` | CreateReturnItemDto[] | Yes | Items to return |
| `reason` | string | Yes | Return reason |
| `photos` | string[] | No | Supporting photos |

### CreateReturnItemDto
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `orderItemId` | string | Yes | Original order item ID |
| `quantity` | number | Yes | Return quantity |
| `reason` | string | Yes | Item-specific reason |
| `photos` | string[] | No | Item photos |

### VerifyDto
Located at `wdp-be/src/return/dto/verify.dto.ts`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `itemsReceived` | boolean | Yes | All items received |
| `conditionNotes` | string | No | Condition assessment |
| `photos` | string[] | No | Verification photos |

### ProcessRefundDto
Located at `wdp-be/src/return/dto/process-refund.dto.ts`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `decision` | 'APPROVE' \| 'REJECT' | Yes | Sales decision |
| `refundAmount` | number | Conditional | Approved amount (if APPROVE) |
| `reason` | string | Conditional | Rejection reason (if REJECT) |

### ReturnResponseDto
Located at `wdp-be/src/return/dto/return-response.dto.ts`
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Return ID |
| `returnNumber` | string | Return number |
| `status` | ReturnStatus | Current status |
| `returnType` | ReturnType | REFUND or EXCHANGE |
| `requestedRefundAmount` | number | Initial amount |
| `shippingLabel` | string | Shipping label URL |
| `submittedAt` | Date | Submission date |

## API Endpoints
### POST /returns
**Description**: Customer submits return request

**Request**:
```json
{
  "orderId": "uuid",
  "returnType": "REFUND",
  "items": [
    {
      "orderItemId": "uuid",
      "quantity": 1,
      "reason": "Doesn't fit well",
      "photos": ["url1", "url2"]
    }
  ],
  "reason": "Product doesn't fit as expected"
}
```

**Response** (201 CREATED):
```json
{
  "returnNumber": "RET-2024-03-27-5678",
  "status": "SUBMITTED",
  "shippingLabel": "https://shipping.label/...",
  "returnAddress": {
    "name": "WDP Warehouse",
    "address": "123 Warehouse St",
    "city": "Ho Chi Minh",
    "phone": "0123456789"
  }
}
```

### GET /returns
**Description**: List user returns with pagination

**Query Parameters**: `page`, `limit`, `status`

**Response** (200 OK):
```json
{
  "data": [...],
  "total": 5,
  "page": 1,
  "limit": 10
}
```

### GET /returns/:id
**Description**: Get return details

**Response** (200 OK):
```json
{
  "id": "uuid",
  "returnNumber": "RET-2024-03-27-5678",
  "status": "IN_REVIEW",
  "returnType": "REFUND",
  "items": [...],
  "requestedRefundAmount": 1500000,
  "itemCondition": "GOOD",
  "warehouseNotes": "Items in good condition"
}
```

### PATCH /returns/:id/staff-verify
**Description**: Warehouse staff verifies received items (WAREHOUSE only)

**Request**:
```json
{
  "itemsReceived": true,
  "conditionNotes": "Items appear new with tags attached",
  "photos": ["url1", "url2"]
}
```

**Response** (200 OK):
```json
{
  "returnNumber": "RET-2024-03-27-5678",
  "status": "IN_REVIEW",
  "message": "Return verified and sent to sales for review"
}
```

### PATCH /returns/:id/process-refund
**Description**: Sales staff processes refund decision (SALES only)

**Request** (Approve):
```json
{
  "decision": "APPROVE",
  "refundAmount": 1500000
}
```

**Request** (Reject):
```json
{
  "decision": "REJECT",
  "reason": "Items show signs of wear beyond normal try-on"
}
```

**Response** (200 OK):
```json
{
  "returnNumber": "RET-2024-03-27-5678",
  "status": "COMPLETED",
  "refundTxnId": "VNPAY-REFUND-456"
}
```

## Implementation Requirements
### 1. Controller Implementation
Located at `wdp-be/src/return/return.controller.ts`

**Required Methods:**
- `create()` - Validate JWT, validate order eligibility, create return
- `findAll()` - Support pagination and status filtering
- `findOne()` - Validate ownership
- `staffVerify()` - RBAC for WAREHOUSE role, update status to IN_REVIEW
- `processRefund()` - RBAC for SALES role, approve/reject return
- `cancel()` - Validate cancellable status (SUBMITTED or AWAITING_ITEMS)

### 2. Service Implementation
Located at `wdp-be/src/return/return.service.ts`

**Create Return:**
- Validate order exists and belongs to user
- Check return eligibility (delivered within 30 days)
- Check for existing active return on order
- Validate items are from original order
- Calculate initial refund amount
- Generate return number (RET-YYYY-MM-DD-XXXX)
- Generate shipping label
- Send confirmation email

**Staff Verify:**
- Validate status is AWAITING_ITEMS
- Record item condition assessment
- Update inventory based on condition:
  - GOOD condition: Add to returned inventory
  - DAMAGED condition: Quarantine for inspection
- Notify sales team for review
- Send customer notification

**Process Refund:**
- Validate status is IN_REVIEW

**If APPROVE:**
- Calculate final refund amount
- For REFUND type: Initiate VNPAY refund
- For EXCHANGE type: Create new exchange order
- Update inventory (returned items → available)
- Update status to COMPLETED
- Send approval email

**If REJECT:**
- Record rejection reason
- Initiate return shipment to customer
- Update status to REJECTED
- Send rejection email with explanation

### 3. Authentication & Authorization
- **Authentication**: JwtAuthGuard on all endpoints
- **Authorization**:
  - Customer: Can create, view, cancel own returns
  - Warehouse: Can verify returns
  - Sales: Can approve/reject returns
  - Admin: Full access

**Guards:**
- `JwtAuthGuard` - Validates JWT token
- `RbacGuard` - Role-based access control

### 4. Return Policy Validation
- **Return Window**: 30 days from delivery date
- **Item Condition**: Must be in new/like-new condition
- **Original Packaging**: Preferred but not required
- **Proof of Purchase**: Order validation required

### 5. Email Notifications
- Return confirmation (with shipping label)
- Items received notification
- Refund approved notification (with refund details)
- Refund rejected notification (with reason)
- Exchange order created notification
- Return cancelled notification

### 6. State Transitions
| From | To | Trigger | Notes |
|------|-----|---------|-------|
| SUBMITTED | AWAITING_ITEMS | Return validated | Shipping label generated |
| SUBMITTED | CANCELED | Customer cancels | Within allowed window |
| AWAITING_ITEMS | IN_REVIEW | Warehouse verifies | Items received |
| AWAITING_ITEMS | CANCELED | Customer cancels | Within allowed window |
| IN_REVIEW | APPROVED | Sales approves | Refund/exchange initiated |
| IN_REVIEW | REJECTED | Sales rejects | Items returned to customer |
| APPROVED | COMPLETED | Refund processed | Or exchange order created |
| REJECTED | [*] | Process terminated | Items returned |
| COMPLETED | [*] | Process complete | Return finished |
| CANCELED | [*] | Process terminated | By customer |

### 7. Refund Processing (VNPAY)
- Retrieve original payment transaction
- Build refund request with amount and reason
- Submit refund to VNPAY API
- Store refund transaction ID
- Handle refund failures/retries
- Reconcile with payment records

### 8. Exchange Order Creation
- Copy items from return request
- Set order type to EXCHANGE
- Link to original return request
- Apply any price differences
- Skip payment (already paid)
- Send exchange confirmation

## Diagrams
- State Machine: `diagrams/state-machine/return.state.puml`
- Sequence Diagrams:
  - Request: `diagrams/details/return-management/sequence-request.puml`
  - Verify: `diagrams/details/return-management/sequence-verify.puml`
  - Refund: `diagrams/details/return-management/sequence-refund.puml`
- Class Diagram: `diagrams/details/return-management/class-diagram.puml`

## Error Handling
| Status Code | Scenario |
|-------------|----------|
| 400 | Order not eligible, items invalid, bad status transition |
| 401 | Missing or invalid JWT token |
| 403 | Accessing another customer's return |
| 404 | Return not found |
| 409 | Active return already exists for order |
| 500 | Payment gateway error, database error |
