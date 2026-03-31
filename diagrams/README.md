# WDP - PlantUML Diagrams

## Overview
This directory contains PlantUML diagrams for the WDP (Eyewear E-commerce Platform) project.

## Project Type
**Eyewear E-commerce Platform** with virtual try-on capabilities.

## Technology Stack
| Layer | Technology |
|-------|------------|
| **Backend** | NestJS, TypeORM/Prisma, PostgreSQL |
| **Frontend** | React, TypeScript, Zustand, Three.js |
| **Payment** | VNPAY Integration |
| **3D Rendering** | Three.js (GLB/OBJ models) |

## Diagram Structure

```
diagrams/
├── state-machine/          # Entity lifecycle state machines
│   ├── order.state.puml
│   ├── return.state.puml
│   ├── user-auth.state.puml
│   ├── product.state.puml
│   ├── inventory.state.puml
│   ├── promotion.state.puml
│   └── supplier.state.puml
├── details/                # Feature-specific diagrams
│   ├── authentication/     # Auth & User sessions
│   ├── order-management/   # Order operations
│   ├── return-management/  # Return requests
│   ├── product-management/ # Product CRUD
│   ├── cart-management/    # Shopping cart
│   ├── inventory-management/ # Stock tracking
│   ├── policy-management/  # Policy documents
│   ├── combo-management/   # Frame + Lens combos
│   ├── promotion-management/ # Discount codes
│   ├── user-management/    # User profiles
│   ├── favorite-management/ # Favorites/Wishlist
│   ├── media-management/   # 2D/3D uploads
│   ├── preorder-management/ # Preorder tracking
│   ├── supplier-management/ # Supplier info
│   └── revenue-management/ # Analytics
└── README.md               # This file
```

## Available Diagrams

### System Context Diagram

| Diagram | Description | File |
|---------|-------------|------|
| **System Context** | High-level view of EYEWEAR platform, user roles, and external systems | `system-context.puml` / `system-context.mmd` |

This diagram shows:

- **User Roles**: Customer, Sales Staff, Manager, Admin
- **Platform Components**: Web App, Mobile App, Admin/Staff/Manager Portals, Backend API, Database
- **External Systems**: VNPay, Cloudinary, Resend, Courier/Shipping Partner
- **Data Flows**: All interactions between users, platform, and external systems

### Package Diagrams

| Diagram | Description | File |
|---------|-------------|------|
| **Backend Package** | NestJS backend package structure (Controllers, Services, Schemas) | `backend-package.puml` |
| **Frontend Package** | Next.js frontend package structure (Pages, Components, State) | `frontend-package.puml` |
| **Mobile Package** | React Native mobile package structure (Screens, Navigation, Modules) | `mobile-package.puml` |
| **Combined Package** | All three platforms with shared packages and external dependencies | `combined-package.puml` / `package-diagrams.mmd` |

---

### State Machine Diagrams
| Diagram | Description | File |
|---------|-------------|------|
| **Order** | Order lifecycle from PENDING to DELIVERED/CANCELLED | `state-machine/order.state.puml` |
| **Return** | Return request from SUBMITTED to COMPLETED/REJECTED | `state-machine/return.state.puml` |
| **User Auth** | User account from REGISTERED to ACTIVE/LOCKED | `state-machine/user-auth.state.puml` |
| **Product** | Product from DRAFT to ACTIVE/DELETED | `state-machine/product.state.puml` |
| **Inventory** | Item from AVAILABLE to SOLD/DAMAGED | `state-machine/inventory.state.puml` |
| **Promotion** | Promo from DRAFT to ACTIVE/EXPIRED | `state-machine/promotion.state.puml` |
| **Supplier** | Supplier from PENDING to ACTIVE/SUSPENDED | `state-machine/supplier.state.puml` |

### Feature Diagrams Summary
| Feature | State Machine | Sequence | Class | Implementation |
|---------|--------------|----------|-------|----------------|
| **Authentication** | ✅ | Login, Register, Verify, Reset | ✅ | ✅ |
| **Order Management** | ✅ | Checkout, Approve, Cancel, View | ✅ | ✅ |
| **Return Management** | ✅ | Request, Verify, Refund | ✅ | ✅ |
| **Product Management** | ✅ | Create, Update, Catalog | ✅ | ✅ |
| **Cart Management** | - | Operations | ✅ | ✅ |
| **Inventory Management** | ✅ | Operations | ✅ | - |
| **Policy Management** | - | Operations | ✅ | - |
| **Combo Management** | - | Operations | ✅ | - |
| **Promotion Management** | ✅ | Operations | ✅ | - |
| **User Management** | - | Operations | ✅ | - |
| **Favorite Management** | - | Operations | ✅ | - |
| **Media Management** | - | Upload/Delete | ✅ | - |

### Authentication & Authorization
| Diagram | Description | File |
|---------|-------------|------|
| **Login** | User login with JWT | `authentication/sequence-login.puml` |
| **Register** | New user registration | `authentication/sequence-register.puml` |
| **Verify Email** | Email verification | `authentication/sequence-verify-email.puml` |
| **Password Reset** | Forgot & reset password | `authentication/sequence-password-reset.puml` |
| **Class** | Auth architecture | `authentication/class-diagram.puml` |
| **Implementation** | Complete guide | `authentication/IMPLEMENTATION_GUIDE.md` |

### Product Management
| Diagram | Description | File |
|---------|-------------|------|
| **Create** | Create product with variants | `product-management/sequence-create.puml` |
| **Update** | Update product details | `product-management/sequence-update.puml` |
| **Catalog** | Public catalog with filters | `product-management/sequence-catalog.puml` |
| **Class** | Product architecture | `product-management/class-diagram.puml` |
| **Implementation** | Complete guide | `product-management/IMPLEMENTATION_GUIDE.md` |

### Cart Management
| Diagram | Description | File |
|---------|-------------|------|
| **Operations** | Get, Add, Update, Remove, Clear | `cart-management/sequence-cart-operations.puml` |
| **Class** | Cart architecture | `cart-management/class-diagram.puml` |
| **Implementation** | Complete guide | `cart-management/IMPLEMENTATION_GUIDE.md` |

### Inventory Management
| Diagram | Description | File |
|---------|-------------|------|
| **Operations** | Adjust, Reserve, Release, Low Stock | `inventory-management/sequence-inventory-operations.puml` |
| **Class** | Inventory architecture | `inventory-management/class-diagram.puml` |

### Other Features
| Feature | Diagrams Available |
|---------|-------------------|
| **Policy** | Sequence, Class |
| **Combo** | Sequence, Class |
| **Promotion** | State machine, Sequence, Class |
| **User** | Sequence, Class |
| **Favorite** | Sequence, Class |
| **Media** | Sequence, Class |
| **Supplier** | State machine |
| **Preorder** | - |
| **Revenue** | - |

## Key Entities

### Core Entities
| Entity | States | Key Operations |
|--------|--------|----------------|
| **User** | Roles: ADMIN, MANAGER, OPERATION, SALE, CUSTOMER<br>Status: REGISTERED, UNVERIFIED, ACTIVE, SUSPENDED, LOCKED | Login, Register, Profile, Addresses |
| **Product** | Categories: FRAMES, LENSES, SERVICES<br>Status: DRAFT, ACTIVE, OUT_OF_STOCK, INACTIVE, DELETED | CRUD, Variants, Catalog |
| **Order** | PENDING → PAID → PROCESSING → SHIPPED → DELIVERED | Checkout, Approve, Cancel, View |
| **Return** | SUBMITTED → AWAITING_ITEMS → IN_REVIEW → APPROVED/REJECTED → COMPLETED | Request, Verify, Refund |
| **Cart** | - | Get, Add, Update, Remove, Clear, Merge |
| **Inventory** | AVAILABLE, RESERVED, SOLD, QUARANTINE, DAMAGED | Adjust, Reserve, Release, Confirm |
| **Policy** | Types: RETURN, REFUND, WARRANTY, SHIPPING, PRIVACY, TERMS | CRUD, Get public |
| **Promotion** | DRAFT → ACTIVE → PAUSED → EXPIRED | Create, Validate, Use |
| **Combo** | Frame + Lens bundle | Create, Get for product |
| **Favorite** | - | Toggle, Get list, Check |
| **Supplier** | PENDING → ACTIVE → INACTIVE → SUSPENDED | CRUD, Status changes |
| **Media** | Types: IMAGE_2D, MODEL_3D | Upload, Delete |

### Enums
| Enum | Values |
|------|--------|
| `UserRole` | ADMIN, MANAGER, OPERATION, SALE, CUSTOMER |
| `UserStatus` | REGISTERED, UNVERIFIED, VERIFIED, ACTIVE, SUSPENDED, LOCKED, PASSWORD_RESET |
| `OrderStatus` | PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED |
| `OrderType` | READY, PREORDER, EXCHANGE |
| `ReturnStatus` | SUBMITTED, AWAITING_ITEMS, IN_REVIEW, APPROVED, COMPLETED, REJECTED, CANCELED |
| `ReturnType` | REFUND, EXCHANGE |
| `ProductCategory` | FRAMES, LENSES, SERVICES |
| `ProductStatus` | DRAFT, ACTIVE, OUT_OF_STOCK, INACTIVE, DELETED |
| `InventoryStatus` | AVAILABLE, RESERVED, OUT_OF_STOCK, QUARANTINE, DAMAGED, DISCONTINUED |
| `MovementType` | STOCK_IN, STOCK_OUT, RESERVATION, RELEASE, SALE, RETURN, ADJUSTMENT |
| `PromotionType` | PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING, BUY_X_GET_Y |
| `PromotionStatus` | DRAFT, ACTIVE, PAUSED, EXPIRED, CANCELLED |
| `PolicyType` | RETURN, REFUND, WARRANTY, SHIPPING, PRESCRIPTION, CANCELLATION, PRIVACY, TERMS |
| `DiscountType` | PERCENTAGE, FIXED_AMOUNT |

## Rendering PlantUML Diagrams

### Using VSCode Extension
1. Install the [PlantUML](https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml) extension
2. Open any `.puml` file
3. Press `Alt+D` to preview

### Using Online Editor
1. Visit [PlantText](https://www.planttext.com/)
2. Copy and paste the `.puml` file content
3. View rendered diagram

### Using CLI
```bash
# Install PlantUML
brew install plantuml  # macOS
# or download from https://plantuml.com/download

# Generate PNG
plantuml diagrams/state-machine/order.state.puml

# Generate SVG
plantuml -tsvg diagrams/state-machine/order.state.puml
```

## Project Architecture

### Backend Module Structure
```
wdp-be/src/
├── auth/              # Authentication (login, register)
├── user/              # User management
├── product/           # Product CRUD
├── cart/              # Shopping cart
├── checkout/          # Order checkout
├── order/             # Order management
├── return/            # Return requests
├── inventory/         # Inventory tracking
├── policy/            # Policy management
├── combo/             # Frame + Lens combos
├── promotion/         # Discount codes
├── preorder/          # Preorder tracking
├── supplier/          # Supplier management
├── favorite/          # Favorites/Wishlist
├── media/             # File uploads (2D/3D)
├── revenue/           # Revenue analytics
├── payment/           # VNPAY integration
├── mail/              # Email service
├── common/            # Shared DTOs, guards, decorators
└── shared/            # Shared enums, models
```

### Frontend Component Structure
```
FE/src/
├── components/
│   ├── virtual-tryon/     # 3D glasses preview
│   ├── product/           # Product display
│   ├── staff/             # Staff operations
│   ├── returns/           # Return dialogs
│   └── ui/                # Reusable components
├── pages/
│   ├── store/             # Store pages
│   ├── dashboard/         # Customer dashboard
│   └── staff/             # Staff pages
├── store/                 # Zustand stores
├── services/              # API clients
└── lib/                   # Utilities
```

## Conventions Used

### Naming
| Type | Pattern | Examples |
|------|---------|----------|
| Controllers | `[Feature]Controller` | OrderController, ReturnController |
| Services | `[Feature]Service` | OrderService, ReturnService |
| Entities | `[Feature]` | Order, ReturnRequest, Product |
| DTOs | `[Action][Feature]Dto` | CreateReturnDto, UpdateOrderDto |
| State Diagrams | `[entity].state.puml` | order.state.puml |
| Sequence Diagrams | `sequence-[action].puml` | sequence-checkout.puml |
| Class Diagrams | `class-diagram.puml` | class-diagram.puml |

### Layer Organization
1. **Presentation Layer** - UI components, forms
2. **Controller Layer** - HTTP endpoints, request handlers
3. **Service Layer** - Business logic, orchestration
4. **Repository Layer** - Data access, persistence
5. **Entity Layer** - Database models, core objects
6. **Utility Layer** - External services, helpers

### Security
- **JWT Authentication** - All protected endpoints
- **RBAC** - Role-based access control (5 roles)
- **Guards** - JwtAuthGuard, RbacGuard
- **Public Decorator** - For endpoints like VNPAY callback

## State Machine Summary

### Order States
```
PENDING ──payment──> PAID ──approve──> PROCESSING ──ship──> SHIPPED ──deliver──> DELIVERED
   │                        │                                                              │
   └───────cancel────────────┴────────────────cancel──────────────────────────────────────┘
```

### Return States
```
SUBMITTED ──validated──> AWAITING_ITEMS ──received──> IN_REVIEW ──approve──> APPROVED ──refund──> COMPLETED
   │                                            │
   └──────────────cancel────────────────────────┴───────────reject──────────────────────────> REJECTED
```

### User Auth States
```
UNREGISTERED ──register──> REGISTERED ──email sent──> UNVERIFIED ──click link──> VERIFIED ──login──> ACTIVE
   │                                                                 │
   └─────────────────────────────────────────────┴───forgot password──> PASSWORD_RESET ──reset──> ACTIVE
```

### Product States
```
DRAFT ──publish──> ACTIVE ──stock out──> OUT_OF_STOCK ──restock──> ACTIVE
   │                     │
   └──deactivate─────> INACTIVE ──activate──> ACTIVE (if stock)
                        │
                        └──delete──> DELETED
```

### Inventory States
```
AVAILABLE ──order──> RESERVED ──paid──> SOLD
   │               │
   │               └──cancel──> AVAILABLE
   └──adjust──────> QUARANTINE ──approve──> AVAILABLE
                    └──reject──> DAMAGED ──write off──> [*]
```

### Promotion States
```
DRAFT ──publish──> ACTIVE ──pause──> PAUSED ──resume──> ACTIVE
   │               │                          │
   │               └──expire/limit──────> EXPIRED
   └──cancel──────────────────────────────────> CANCELLED
```

## Quick Reference - All Endpoints

### Authentication
| Method | Endpoint | Public? |
|--------|----------|---------|
| POST | /auth/login | ✅ |
| POST | /auth/register | ✅ |
| POST | /auth/verify-email | ✅ |
| POST | /auth/forgot-password | ✅ |
| POST | /auth/reset-password | ✅ |
| POST | /auth/refresh-token | ✅ |
| POST | /auth/logout | ❌ |

### Order Endpoints
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /orders/checkout | Customer |
| GET | /orders | Customer/Staff |
| GET | /orders/:id | Customer/Staff |
| POST | /orders/:id/approve | Staff |
| POST | /orders/:id/cancel | Customer/Staff |
| POST | /orders/:id/vnpay-callback | Public |
| PATCH | /orders/:id/status | Staff |

### Return Endpoints
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /returns | Customer |
| GET | /returns | Customer/Staff |
| GET | /returns/:id | Customer/Staff |
| PATCH | /returns/:id/staff-verify | Warehouse |
| PATCH | /returns/:id/process-refund | Sales |
| PATCH | /returns/:id/cancel | Customer |

### Product Endpoints
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /products/catalog | Public |
| GET | /products/:id | Public |
| POST | /products | Manager/Admin |
| PATCH | /products/:id | Manager/Admin |
| DELETE | /products/:id | Manager/Admin |
| PATCH | /products/:id/restore | Admin |

### Cart Endpoints
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /cart | Customer |
| POST | /cart/items | Customer |
| PUT | /cart/items/:id | Customer |
| DELETE | /cart/items/:id | Customer |
| DELETE | /cart | Customer |
| POST | /cart/merge | Customer |

### Inventory Endpoints
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /inventory/low-stock | Staff |
| POST | /inventory/adjust | Staff |
| GET | /inventory/:variantId | Staff |
| GET | /inventory/movements | Staff |

---

**Generated:** 2026-03-27
**Project:** WDP - Eyewear E-commerce Platform
**Documentation Style:** PlantUML + Markdown
**Total Features Documented:** 14
**Total Diagrams Created:** 50+
