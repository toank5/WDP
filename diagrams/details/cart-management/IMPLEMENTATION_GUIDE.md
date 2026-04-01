# Cart Management - Implementation Guide

## Overview
The Cart Management feature handles shopping cart operations for authenticated customers, including adding/updating/removing items, calculating totals, and merging guest carts.

## Feature Scope
### Operations
| Operation | Description | Endpoint | Access |
|-----------|-------------|----------|--------|
| **Get Cart** | Get user's cart with totals | `GET /cart` | Customer |
| **Add Item** | Add item to cart | `POST /cart/items` | Customer |
| **Update Item** | Update item quantity | `PUT /cart/items/:id` | Customer |
| **Remove Item** | Remove item from cart | `DELETE /cart/items/:id` | Customer |
| **Clear Cart** | Clear all items | `DELETE /cart` | Customer |
| **Merge Guest Cart** | Merge guest cart on login | `POST /cart/merge` | Customer |

## Database Schema
### Key Entities

**Cart** - Located at `wdp-be/src/cart/entities/cart.entity.ts`
| Property | Type | Description |
|----------|------|-------------|
| `id` | string (UUID) | Primary key |
| `userId` | string (UUID) | Foreign key to User (unique) |
| `items` | CartItem[] | Cart items |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update |

**Relationships:**
- `userId` → User.id (One-to-One)
- `items` → CartItem[] (One-to-Many)

**CartItem** - Located at `wdp-be/src/cart/entities/cart-item.entity.ts`
| Property | Type | Description |
|----------|------|-------------|
| `id` | string (UUID) | Primary key |
| `cartId` | string (UUID) | Foreign key to Cart |
| `productVariantId` | string (UUID) | Foreign key to ProductVariant |
| `quantity` | number | Item quantity |
| `createdAt` | Date | Added timestamp |
| `updatedAt` | Date | Last update |

## DTOs
### AddCartItemDto
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `variantId` | string | Yes | Valid variant ID |
| `quantity` | number | Yes | Min: 1, Max: 99 |

### UpdateCartItemDto
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `quantity` | number | Yes | Min: 0 (0 = remove) |

### CartResponseDto
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Cart ID |
| `items` | CartItemResponseDto[] | Cart items |
| `subtotal` | number | Subtotal (before discounts) |
| `itemCount` | number | Total item count |
| `appliedPromo` | PromoInfo | Applied promotion info |

### MergeCartDto
| Field | Type | Description |
|-------|------|-------------|
| `guestItems` | GuestCartItem[] | Guest cart items from local storage |

## API Endpoints
### GET /cart
**Description**: Get user's cart with product info and totals

**Response** (200 OK):
```json
{
  "id": "uuid",
  "items": [
    {
      "id": "uuid",
      "variantId": "uuid",
      "productName": "Wayfarer Classic",
      "variantName": "Black",
      "quantity": 1,
      "unitPrice": 1500000,
      "subtotal": 1500000,
      "image": "url",
      "inStock": true
    }
  ],
  "subtotal": 1500000,
  "itemCount": 1,
  "appliedPromo": null
}
```

### POST /cart/items
**Description**: Add item to cart (create if doesn't exist)

**Request**:
```json
{
  "variantId": "uuid",
  "quantity": 2
}
```

**Response** (201 CREATED):
```json
{
  "message": "Item added to cart",
  "cart": {...}
}
```

**Note**: If item already exists, quantity is increased.

### PUT /cart/items/:id
**Description**: Update item quantity

**Request**:
```json
{
  "quantity": 3
}
```

**Response** (200 OK):
```json
{
  "message": "Cart updated",
  "cart": {...}
}
```

**Note**: Quantity of 0 removes the item.

### DELETE /cart/items/:id
**Description**: Remove item from cart

**Response** (200 OK):
```json
{
  "message": "Item removed from cart"
}
```

### DELETE /cart
**Description**: Clear all cart items

**Response** (200 OK):
```json
{
  "message": "Cart cleared"
}
```

### POST /cart/merge
**Description**: Merge guest cart after login

**Request**:
```json
{
  "guestItems": [
    {"variantId": "uuid", "quantity": 1}
  ]
}
```

**Response** (200 OK):
```json
{
  "message": "Cart merged",
  "cart": {...}
}
```

## Implementation Requirements
### 1. Controller Implementation
Located at `wdp-be/src/controllers/cart.controller.ts`

**Required Methods:**
- `getCart()` - Get user's cart, create if doesn't exist
- `addItem()` - Add item or increment quantity
- `updateItem()` - Update quantity (0 = remove)
- `removeItem()` - Remove specific item
- `clearCart()` - Remove all items
- `mergeGuestCart()` - Merge guest cart on login

### 2. Service Implementation
Located at `wdp-be/src/services/cart.service.ts`

**Business Rules:**
- One cart per user (One-to-One)
- Max quantity per item: 99
- Max unique items: 50
- Validate variant exists and is in stock
- Calculate real-time totals from product service

**Merge Logic:**
```typescript
For each guest item:
  If variant exists in user cart:
    userCart.quantity += guest.quantity (cap at 99)
  Else:
    Add to user cart
```

**Totals Calculation:**
```typescript
subtotal = Σ(item.quantity × item.unitPrice)
itemCount = Σ(item.quantity)
```

**Stock Validation:**
- Check variant exists
- Check variant is active
- Check stock availability (warn if low)

### 3. Cart Persistence Strategy
| Scenario | Behavior |
|----------|----------|
| First visit | Create empty cart |
| Add item (empty cart) | Create cart with item |
| Add item (exists) | Increment quantity |
| Update to 0 | Remove item |
| Last item removed | Keep empty cart |
| User logout | Keep cart (persisted) |

### 4. Guest Cart Handling
**Storage**: Browser localStorage

**Format**:
```json
{
  "items": [
    {"variantId": "uuid", "quantity": 1}
  ],
  "updatedAt": "2024-03-27T10:00:00Z"
}
```

**Sync on Login**:
1. User logs in
2. Frontend sends guest cart to `/cart/merge`
3. Backend merges with existing cart
4. Frontend clears localStorage

### 5. Performance Considerations
- Cache product variant info (5 min TTL)
- Batch product info fetches
- Update totals asynchronously
- Debounce cart updates (500ms)

### 6. Error Handling
| Scenario | Behavior |
|----------|----------|
| Variant not found | 404 error |
| Variant out of stock | 400 error with message |
| Quantity exceeds max | 400 error, cap at 99 |
| Cart belongs to other user | 403 error |

## Diagrams
- Sequence Diagram: `diagrams/details/cart-management/sequence-cart-operations.puml`
- Class Diagram: `diagrams/details/cart-management/class-diagram.puml`

## Error Handling
| Status Code | Scenario |
|-------------|----------|
| 400 | Invalid quantity, variant out of stock |
| 401 | Missing/invalid JWT |
| 403 | Item belongs to different cart |
| 404 | Cart item not found |
| 500 | Database error |

## Frontend Integration
**Cart State Management** (Zustand):
```typescript
interface CartStore {
  items: CartItem[]
  addItem: (variantId: string, quantity: number) => void
  updateItem: (itemId: string, quantity: number) => void
  removeItem: (itemId: string) => void
  clearCart: () => void
  mergeGuestCart: (guestItems: GuestCartItem[]) => void
}
```

**Local Storage Key**: `wdp_guest_cart`
**Sync Interval**: On page load, before checkout
