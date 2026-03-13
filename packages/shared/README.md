# @eyewear/shared

Shared types, enums, constants, and utilities for the Eyewear full-stack application.

## Purpose

This package provides a **single source of truth** for common types and values used across both frontend and backend codebases. It eliminates duplicate definitions and ensures consistency between the frontend (React/Vite) and backend (NestJS/Node.js).

**⚠️ IMPORTANT:** If you need a type or enum used in both FE and BE, put it in `@eyewear/shared`. Do NOT re-create it separately in each app!

## Installation

```bash
# From the root of the monorepo
cd packages/shared
npm install
```

## Building

```bash
npm run build
```

This will generate three outputs:
- `dist/cjs/` - CommonJS format (for Node.js backend)
- `dist/esm/` - ES Modules format (for modern bundlers)
- `dist/types/` - TypeScript declaration files

## Usage

### In Backend (NestJS/Node.js)

```typescript
import { ORDER_STATUS, USER_ROLES, User, formatCurrency } from '@eyewear/shared';

// Use enums (SCREAMING_CASE naming)
if (order.orderStatus === ORDER_STATUS.DELIVERED) {
  // ...
}

// Use types
function createUser(userData: User): void {
  // ...
}

// Use utilities
const price = formatCurrency(150000, 'VND'); // "150.000 ₫"
```

### In Frontend (React/Vite)

The shared package exports enums in SCREAMING_CASE (e.g., `ORDER_STATUS`) for consistency with the backend. For frontend convenience, aliases are available:

```typescript
// Option 1: Use SCREAMING_CASE (recommended for consistency)
import { ORDER_STATUS, USER_ROLES } from '@eyewear/shared';

// Option 2: Use the backward-compatible @/lib/enums wrapper
import { OrderStatus, UserRole } from '@/lib/enums';

// Option 3: Import both and use alias for frontend code
import { ORDER_STATUS, USER_ROLES as UserRole } from '@eyewear/shared';
```

## Package Structure

```
src/
├── enums/           # Enum definitions (SCREAMING_CASE naming)
│   ├── order.enums.ts      # ORDER_STATUS, ORDER_TYPES, etc.
│   ├── user.enums.ts       # USER_ROLES, ADDRESS_TYPES
│   ├── product.enums.ts    # PRODUCT_CATEGORIES, FRAME_TYPE, etc.
│   ├── return.enums.ts     # RETURN_STATUS, RETURN_REASON, etc.
│   ├── policy.enums.ts     # POLICY_TYPES
│   └── inventory.enums.ts  # MOVEMENT_TYPE, ADJUSTMENT_REASON, etc.
├── models/          # TypeScript interfaces and types
│   ├── order.models.ts
│   ├── return.models.ts
│   ├── user.models.ts
│   ├── product.models.ts
│   ├── cart.models.ts
│   ├── policy.models.ts
│   └── common.models.ts
├── constants/       # Constants (labels, mappings, config)
│   ├── order.constants.ts   # ORDER_STATUS_LABELS, etc.
│   ├── user.constants.ts    # USER_ROLE_LABELS, etc.
│   ├── return.constants.ts  # RETURN_STATUS_LABELS, etc.
│   └── shipping.constants.ts
└── utils/           # Utility functions
    ├── date.utils.ts        # formatDate, formatDateTime, etc.
    ├── format.utils.ts      # formatCurrency, formatPhoneNumber
    ├── validation.utils.ts  # validateEmail, validatePhone, etc.
    └── type-guards.utils.ts # isOrderStatus, isUserRole, etc.
```

## Adding New Shared Types

### When to add to @eyewear/shared

**Add to shared package when:**
- The type/enum is used in **both** frontend and backend
- The type/enum appears in API contracts (DTOs, responses)
- You need to ensure validation rules match between FE and BE
- Multiple components across FE and BE use the same definition

**DO NOT add when:**
- The type is only used in one place
- The type contains framework-specific code (React hooks, NestJS decorators)
- The value is configuration for a specific app

### Step-by-step guide

1. **Create a new enum** in `src/enums/` if you're defining a set of related values
   ```typescript
   // src/enums/my-feature.enums.ts
   export enum MY_FEATURE_STATUS {
     PENDING = 'PENDING',
     ACTIVE = 'ACTIVE',
     INACTIVE = 'INACTIVE',
   }
   ```

2. **Create a new model** in `src/models/` if you're defining interfaces/types
   ```typescript
   // src/models/my-feature.models.ts
   export interface MyFeature {
     id: string;
     status: MY_FEATURE_STATUS;
     name: string;
   }
   ```

3. **Create constants** in `src/constants/` for labels, mappings, or configuration
   ```typescript
   // src/constants/my-feature.constants.ts
   import { MY_FEATURE_STATUS } from '../enums/my-feature.enums';

   export const MY_FEATURE_STATUS_LABELS: Record<MY_FEATURE_STATUS, string> = {
     [MY_FEATURE_STATUS.PENDING]: 'Pending',
     [MY_FEATURE_STATUS.ACTIVE]: 'Active',
     [MY_FEATURE_STATUS.INACTIVE]: 'Inactive',
   };
   ```

4. **Export from `index.ts`** to make it available to consumers
   ```typescript
   // src/index.ts
   export * from './enums/my-feature.enums';
   export * from './models/my-feature.models';
   export * from './constants/my-feature.constants';
   ```

5. **Build the package** after making changes
   ```bash
   npm run build
   ```

## Naming Conventions

### Enums
- Use **SCREAMING_CASE** for enum names and values (backend convention)
- Example: `ORDER_STATUS`, `USER_ROLES`, `PAYMENT_METHOD`
- This aligns with backend naming and API responses

### Types/Interfaces
- Use **PascalCase** for type/interface names
- Example: `User`, `Order`, `ReturnRequest`

### Constants
- Use **SCREAMING_CASE** for constant names
- For label mappings: `<ENUM_NAME>_LABELS`
- For color mappings: `<ENUM_NAME>_COLORS`

### Utility Functions
- Use **camelCase** for function names
- Example: `formatCurrency`, `formatDate`, `isValidStatusTransition`

## Migration Guide

### Old enum locations (DEPRECATED)

The following files have been moved to `@eyewear/shared`:

**Backend (removed):**
- `src/commons/enums/order.enum.ts` → Use `ORDER_STATUS` from `@eyewear/shared`
- `src/commons/enums/role.enum.ts` → Use `USER_ROLES` from `@eyewear/shared`
- `src/commons/enums/product.enum.ts` → Use `PRODUCT_CATEGORIES` from `@eyewear/shared`
- `src/commons/enums/preorder.enum.ts` → Use `PREORDER_STATUS` from `@eyewear/shared`
- `src/commons/enums/address.enum.ts` → Use `ADDRESS_TYPES` from `@eyewear/shared`
- `src/commons/enums/policy.enum.ts` → Use `POLICY_TYPES` from `@eyewear/shared`

**Frontend (now re-exports from shared):**
- `src/lib/enums.ts` → Still works, but now re-exports from `@eyewear/shared`
- For new code, import directly from `@eyewear/shared` using SCREAMING_CASE

## Development

### Watch mode

```bash
npm run watch
```

### Clean build artifacts

```bash
npm run clean
```

### Verify exports

To verify all exports are working correctly:

```typescript
// In a backend file
import {
  ORDER_STATUS,
  USER_ROLES,
  PRODUCT_CATEGORIES,
  POLICY_TYPES,
  formatCurrency
} from '@eyewear/shared';

// In a frontend file
import {
  ORDER_STATUS,
  USER_ROLES as UserRole,
  formatCurrency
} from '@eyewear/shared';
```

## Available Exports

### Enums
- `ORDER_STATUS`, `ORDER_TYPES`, `PREORDER_STATUS`, `PRESCRIPTION_STATUS`
- `PAYMENT_METHOD`, `PAYMENT_STATUS`, `SHIPPING_METHOD`, `SHIPPING_CARRIER`
- `USER_ROLES`, `ADDRESS_TYPES`
- `PRODUCT_CATEGORIES`, `FRAME_TYPE`, `FRAME_SHAPE`, `FRAME_MATERIAL`, `LENS_TYPE`
- `RETURN_STATUS`, `RETURN_REASON`, `RETURN_ITEM_CONDITION`, `RETURN_TYPE`
- `POLICY_TYPES`
- `MOVEMENT_TYPE`, `ADJUSTMENT_REASON`

### Models
- `User`, `Address`, `CartItem`
- `Order`, `OrderItem`, `OrderPayment`
- `Product`, `ProductVariant`
- `ReturnRequest`, `ReturnItem`
- `ReturnPolicy`, `ExchangePolicy`

### Utilities
- `formatCurrency(value, currency)` - Format currency with symbol
- `formatDate(date, format)` - Format dates consistently
- `formatPhoneNumber(phone)` - Format phone numbers
- `validateEmail(email)` - Email validation
- `isValidStatusTransition(from, to)` - Check valid status transitions

## Publishing

Before publishing, the package will automatically:
1. Clean the `dist/` folder
2. Build all three formats (CJS, ESM, types)
3. Verify the output is correct

```bash
npm run prepublishOnly
```

## Troubleshooting

### Import errors after adding new exports

If you get import errors after adding new exports:

1. Make sure you exported from `src/index.ts`
2. Rebuild the package: `npm run build`
3. Restart your dev server (both FE and BE)

### Type mismatches between FE and BE

If you see type mismatches:

1. Check that both are importing from `@eyewear/shared`
2. Make sure you've rebuilt the shared package after changes
3. Clear node_modules and reinstall if needed

## License

MIT
