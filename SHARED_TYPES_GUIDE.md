# Shared Types and Consistency Guide

This document explains how shared types, enums, and utilities are managed across the Eyewear full-stack project.

## Overview

The project uses a **shared package** approach to maintain consistency between the frontend (`FE/`) and backend (`wdp-be/`).

```
WDP/
├── packages/
│   └── shared/          # Single source of truth for shared types
│       ├── src/
│       │   ├── enums/   # ORDER_STATUS, USER_ROLES, RETURN_STATUS, etc.
│       │   ├── models/  # Interfaces: User, Order, Product, etc.
│       │   ├── constants/  # Labels, color mappings, etc.
│       │   └── utils/   # formatCurrency, formatDate, etc.
├── FE/                  # Frontend (React + Vite)
│   ├── src/
│   │   └── lib/
│   │       └── enums.ts # Re-exports from shared for backward compatibility
│   └── package.json     # Has "@eyewear/shared" as dependency
└── wdp-be/              # Backend (NestJS)
    └── package.json     # Has "@eyewear/shared" as dependency
```

## Golden Rule

> **If you need a type or enum used in BOTH FE and BE, put it in `@eyewear/shared`. DO NOT create it separately in both apps.**

## Using the Shared Package

### Import Examples

```typescript
// Import enums (SCREAMING_CASE naming for consistency)
import { ORDER_STATUS, USER_ROLES, RETURN_STATUS } from '@eyewear/shared';

// Import types
import { User, Order, Product, ReturnRequest } from '@eyewear/shared';

// Import utilities
import { formatCurrency, formatDate, isValidEmail } from '@eyewear/shared';

// Import constants
import { ORDER_STATUS_LABELS, USER_ROLE_LABELS } from '@eyewear/shared';
```

### Frontend Compatibility

The frontend uses PascalCase naming (e.g., `OrderStatus`), while the shared package uses SCREAMING_CASE (e.g., `ORDER_STATUS`). For backward compatibility:

```typescript
// Option 1: Import directly with SCREAMING_CASE (recommended)
import { ORDER_STATUS, USER_ROLES } from '@eyewear/shared';

// Option 2: Use the backward-compatible wrapper (maintains old naming)
import { OrderStatus, UserRole } from '@/lib/enums';

// Option 3: Use alias for frontend code
import { ORDER_STATUS, USER_ROLES as UserRole } from '@eyewear/shared';
```

## What Goes in the Shared Package

| Category | Examples | Location |
|----------|----------|----------|
| **Enums** | `ORDER_STATUS`, `USER_ROLES`, `RETURN_STATUS`, `PRODUCT_CATEGORIES` | `src/enums/` |
| **Types** | `User`, `Order`, `Product`, `Cart`, `ReturnRequest` | `src/models/` |
| **Constants** | Status labels, color mappings, shipping fees | `src/constants/` |
| **Utils** | `formatCurrency`, `formatDate`, `isValidEmail` | `src/utils/` |

## What DOES NOT Go in the Shared Package

| Category | Where to Put Instead |
|----------|---------------------|
| **Framework-specific code** | React components in FE/, NestJS decorators in BE/ |
| **Business logic** | Service files in respective app |
| **API clients** | FE/src/lib/ for frontend API calls |
| **Database schemas** | Backend-only in `wdp-be/src/commons/schemas/` |
| **State management** | Redux stores in FE/, NestJS services in BE/ |
| **UI-specific types** | Frontend-only in FE/src/types/ |
| **UI labels/colors** | Frontend-only in FE/src/lib/enums.ts (not shared) |

## Naming Conventions

### Shared Package (Source of Truth)

- **Enums**: SCREAMING_CASE (`ORDER_STATUS`, `USER_ROLES`)
- **Types**: PascalCase (`User`, `Order`, `Product`)
- **Constants**: SCREAMING_CASE (`ORDER_STATUS_LABELS`)
- **Functions**: camelCase (`formatCurrency`, `isValidEmail`)

### Frontend (Backward Compatible)

- **Enums**: PascalCase (`OrderStatus`, `UserRole`) - via `@/lib/enums.ts`
- **UI Helpers**: camelCase with labels/colors - kept in frontend only

## Migration Checklist

When you find a duplicated type/enum:

1. ✅ **Add to shared package** - Create the enum/model in `packages/shared/src/`
2. ✅ **Update exports** - Add export to `packages/shared/src/index.ts`
3. ✅ **Build shared package** - Run `npm run build` in `packages/shared/`
4. ✅ **Replace in backend** - Delete local copy, import from `@eyewear/shared`
5. ✅ **Replace in frontend** - Update to import from `@eyewear/shared` or via `@/lib/enums.ts`
6. ✅ **Test both apps** - Verify FE and BE still work

## Recently Completed Migrations

### Enum Migration (Completed)

The following old enum files have been **removed** and replaced with imports from `@eyewear/shared`:

**Backend (removed files):**

- `wdp-be/src/commons/enums/order.enum.ts` → Use `ORDER_STATUS` from `@eyewear/shared`
- `wdp-be/src/commons/enums/role.enum.ts` → Use `USER_ROLES` from `@eyewear/shared`
- `wdp-be/src/commons/enums/product.enum.ts` → Use `PRODUCT_CATEGORIES` from `@eyewear/shared`
- `wdp-be/src/commons/enums/preorder.enum.ts` → Use `PREORDER_STATUS` from `@eyewear/shared`
- `wdp-be/src/commons/enums/address.enum.ts` → Use `ADDRESS_TYPES` from `@eyewear/shared`
- `wdp-be/src/commons/enums/policy.enum.ts` → Use `POLICY_TYPES` from `@eyewear/shared`

**Frontend (updated file):**

- `FE/src/lib/enums.ts` → Now re-exports from `@eyewear/shared` with backward-compatible aliases

## Common Duplication Patterns to Avoid

### ❌ BAD: Defining same enum in both places

```typescript
// wdp-be/src/commons/enums/order.enum.ts (REMOVED)
export enum ORDER_STATUS {
  PENDING = 'PENDING',
  // ...
}

// FE/src/lib/enums.ts
export enum OrderStatus {  // Different name!
  PENDING = 'PENDING',
  // ...
}
```

### ✅ GOOD: Use shared enum

```typescript
// packages/shared/src/enums/order.enums.ts
export enum ORDER_STATUS {
  PENDING = 'PENDING',
  // ...
}

// Both apps import from shared
import { ORDER_STATUS } from '@eyewear/shared';

// Frontend can use the backward-compatible wrapper
import { OrderStatus } from '@/lib/enums';
```

## Current Shared Types

### Enums

- `ORDER_STATUS`, `ORDER_TYPES`, `PREORDER_STATUS`, `PRESCRIPTION_STATUS`
- `USER_ROLES`, `ADDRESS_TYPES`
- `PRODUCT_CATEGORIES`, `FRAME_TYPE`, `FRAME_SHAPE`, `FRAME_MATERIAL`, `LENS_TYPE`
- `RETURN_STATUS`, `RETURN_REASON`, `RETURN_ITEM_CONDITION`, `RETURN_TYPE`
- `POLICY_TYPES`
- `PAYMENT_METHOD`, `PAYMENT_STATUS`, `SHIPPING_METHOD`, `SHIPPING_CARRIER`
- `MOVEMENT_TYPE`, `ADJUSTMENT_REASON`

### Models

- `User`, `Address`, `AuthResponse`
- `Order`, `OrderItem`, `ShippingAddress`
- `Product`, `ProductVariant`
- `Cart`, `CartItem`
- `ReturnRequest`, `ReturnLineItem`
- `Policy`, `ReturnPolicyConfig`, `ExchangePolicyConfig`

### Utilities

- `formatCurrency()` - Format money values
- `formatDate()` / `formatDateTime()` - Date formatting
- `isValidEmail()` - Email validation
- `isValidPhoneNumber()` - Phone validation
- `isValidStatusTransition()` - Check valid order status transitions

## Preventing Future Duplication

### Code Review Checklist

When reviewing PRs, check for:

- [ ] New enums that should be shared
- [ ] New types that match backend schemas
- [ ] Duplicate utility functions
- [ ] Type definitions that mirror database schemas
- [ ] Imports from old enum locations (should use `@eyewear/shared`)

### ESLint Rules (Optional)

To enforce usage of shared types, consider adding ESLint rules:

```json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "name": "commons/enums",
        "message": "Use @eyewear/shared for enums instead"
      },
      {
        "name": "lib/enums",
        "importNames": ["OrderStatus", "UserRole", "ReturnStatus"],
        "message": "Use @eyewear/shared for core enums instead"
      }
    ]
  }
}
```

## Troubleshooting

### Import Error: Cannot find module '@eyewear/shared'

1. Build the shared package: `cd packages/shared && npm run build`
2. Reinstall: `npm install`
3. Check tsconfig has correct paths configured

### Type Mismatch After Migration

- Clear node_modules and rebuild: `rm -rf node_modules && npm install`
- Restart TypeScript server in IDE
- Check for old imports still pointing to local files

### Build Fails After Adding New Shared Types

1. Make sure you exported from `packages/shared/src/index.ts`
2. Rebuild the shared package: `cd packages/shared && npm run build`
3. Restart your dev server

## Related Documentation

- [Shared Package README](./packages/shared/README.md) - Detailed shared package documentation
- [Backend Architecture](./wdp-be/README.md) - Backend-specific documentation
- [Frontend Architecture](./FE/README.md) - Frontend-specific documentation
