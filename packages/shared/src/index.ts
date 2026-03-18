/**
 * @eyewear/shared
 *
 * Shared types, enums, constants, and utilities for the Eyewear full-stack application.
 *
 * This package provides a single source of truth for common types and values used
 * across both frontend and backend codebases.
 *
 * Usage:
 *   import { ORDER_STATUS, User, formatCurrency } from '@eyewear/shared';
 */

// ============================================================================
// Enums
// ============================================================================

export * from './enums/order.enums';
export * from './enums/user.enums';
export * from './enums/product.enums';
export * from './enums/return.enums';
export * from './enums/policy.enums';
export * from './enums/inventory.enums';

// ============================================================================
// Models
// ============================================================================

export * from './models/order.models';
export * from './models/return.models';
export * from './models/user.models';
export * from './models/product.models';
export * from './models/cart.models';
export * from './models/policy.models';
export * from './models/common.models';

// ============================================================================
// Constants
// ============================================================================

export * from './constants/order.constants';
export * from './constants/user.constants';
export * from './constants/return.constants';
export * from './constants/shipping.constants';

// ============================================================================
// Utils
// ============================================================================

export * from './utils/date.utils';
export * from './utils/format.utils';
export * from './utils/validation.utils';
export * from './utils/type-guards.utils';
