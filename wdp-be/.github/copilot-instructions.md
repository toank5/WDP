# Copilot Instructions for WDP Backend

## Project Overview

  - `npm run start:debug` or `npm run test:debug`
  - API docs available at `/api` (see `main.ts` for setup).
  - JWT-based, using `@nestjs/jwt` and `AuthService`.
## Project-Specific Notes
# Copilot Instructions: Eyeglasses E-Commerce App



## Technical Specifications

- **Stack:** TypeScript, Node.js, NestJS, MongoDB (Mongoose)
- **Models:** Products, Variants, Users, Orders, Inventory, Cart, OrderHistory
- **Indexes & Validation:** Use Mongoose schema validation and indexes for all models
- **Authentication:** JWT middleware, extract user roles for access control
- **Catalog APIs:** Filtering/search for frames, lenses, services; variant support
- **Order Workflow:** Customer → Sales → Operations → Delivery; support prescription and pre-order logic
- **Dashboards:** Staff dashboards for pending orders, prescription validation
- **Manager CRUD:** Products, pricing, policies
- **Order Status:** Real-time updates via history array in Order model
- **Advanced Features:** Virtual try-on, face measurement (API stubs/models/integration points)

## Implementation Guidelines

- Use DTOs for all API request/response payloads
- Centralize validation in `src/commons/validations/`
- Use enums from `src/commons/enums/` for roles, product types, order status, etc.
- Use `CustomApiResponse` for all API responses; global `ResponseInterceptor` wraps responses
- File uploads: use `FileUtils` for storage/naming conventions
- Use middleware for logging and authentication
- API documentation: Swagger at `/api`
- Environment config via `.env` and `@nestjs/config`

## References
- Schemas: [`src/commons/schemas/`](wdp-be/src/commons/schemas/)
- Validations: [`src/commons/validations/`](wdp-be/src/commons/validations/)
- Enums: [`src/commons/enums/`](wdp-be/src/commons/enums/)
- Utilities: [`src/commons/utils/`](wdp-be/src/commons/utils/)
- DTOs: [`src/commons/dtos/`](wdp-be/src/commons/dtos/)

---
## References
- Utilities: [`src/commons/utils/`](wdp-be/src/commons/utils/)
- Validations: [`src/commons/validations/`](wdp-be/src/commons/validations/)
- Schemas: [`src/commons/schemas/`](wdp-be/src/commons/schemas/)
- DTOs: [`src/commons/dtos/`](wdp-be/src/commons/dtos/)
- Enums: [`src/commons/enums/`](wdp-be/src/commons/enums/)

---
## Business Requirements & Roles

**CUSTOMER:**
- Browse catalog (frames, lenses, services) with filtering/search
- View product details: style, size, color, price, 2D/3D images
- Place 3 order types: Ready stock, Pre-order, Prescription (frame + Rx lenses)
- Manage cart, checkout, payment
- Account management: orders, returns/exchanges

**SALES/SUPPORT STAFF:**
- Process incoming orders, validate prescriptions, contact customers
- Confirm orders, assign to Operations
- Handle pre-orders, complaints, returns, warranty, refunds

**OPERATIONS STAFF:**
- Package products, create shipping labels, update tracking
- Pre-order: receive stock, update inventory, ship
- Prescription: lens grinding/assembly, quality check, ship
- Real-time order status updates

**MANAGER:**
- Configure business rules (return policy, warranty, pricing)
- Product management: variants, pricing, promotions
- Staff/user management
- Revenue reporting/dashboards

**SYSTEM ADMIN:**
- System configuration and maintenance