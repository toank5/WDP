/**
 * Central Enum Definitions for EyeWear Project
 *
 * @deprecated Import enums from @eyewear/shared directly
 * This file re-exports from the shared package for backward compatibility
 *
 * Usage:
 *   import { ORDER_STATUS, USER_ROLES as UserRole } from '@eyewear/shared';
 */

// ============================================================================
// Re-export all enums from shared package
// ============================================================================

export * from '@eyewear/shared';

// ============================================================================
// Aliases for backward compatibility with frontend naming conventions
// ============================================================================

import {
  ORDER_TYPES,
  ORDER_STATUS,
  PREORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  SHIPPING_METHOD,
  SHIPPING_CARRIER,
  USER_ROLES,
} from '@eyewear/shared';

// Frontend uses PascalCase for enum names
export { ORDER_TYPES as OrderType };
export { ORDER_STATUS as OrderStatus };
export { PREORDER_STATUS as PreorderStatus };
export { PAYMENT_METHOD as PaymentMethod };
export { PAYMENT_STATUS as PaymentStatus };
export { SHIPPING_METHOD as ShippingMethod };
export { SHIPPING_CARRIER as ShippingCarrier };
// UserRole is already exported as alias from shared package

// ============================================================================
// UI-specific helpers (these stay in frontend as they are UI-only)
// ============================================================================

/**
 * User Role Display Names
 */
export const UserRoleLabels: Record<USER_ROLES, string> = {
  [USER_ROLES.CUSTOMER]: 'Customer',
  [USER_ROLES.OPERATION]: 'Operations Staff',
  [USER_ROLES.SALE]: 'Sales Staff',
  [USER_ROLES.MANAGER]: 'Manager',
  [USER_ROLES.ADMIN]: 'Administrator',
};

/**
 * Order Status Display Labels
 */
export const OrderStatusLabel: Record<ORDER_STATUS, string> = {
  [ORDER_STATUS.PENDING]: 'Pending',
  [ORDER_STATUS.PENDING_PAYMENT]: 'Pending Payment',
  [ORDER_STATUS.PAID]: 'Paid',
  [ORDER_STATUS.ON_HOLD]: 'On Hold',
  [ORDER_STATUS.PROCESSING]: 'Processing',
  [ORDER_STATUS.CONFIRMED]: 'Confirmed',
  [ORDER_STATUS.SHIPPED]: 'Shipped',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.RETURNED]: 'Returned',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
};

/**
 * Order Status Color Mapping for UI
 */
export const OrderStatusColor: Record<ORDER_STATUS, 'default' | 'success' | 'info' | 'warning' | 'error'> = {
  [ORDER_STATUS.PENDING]: 'default',
  [ORDER_STATUS.PENDING_PAYMENT]: 'warning',
  [ORDER_STATUS.PAID]: 'info',
  [ORDER_STATUS.ON_HOLD]: 'warning',
  [ORDER_STATUS.PROCESSING]: 'info',
  [ORDER_STATUS.CONFIRMED]: 'info',
  [ORDER_STATUS.SHIPPED]: 'warning',
  [ORDER_STATUS.DELIVERED]: 'success',
  [ORDER_STATUS.RETURNED]: 'error',
  [ORDER_STATUS.CANCELLED]: 'error',
};

/**
 * Valid Order Status Transitions
 * Key = current status, Value = array of allowed next statuses
 */
export const OrderStatusTransitions: Record<ORDER_STATUS, ORDER_STATUS[]> = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.PENDING_PAYMENT],
  [ORDER_STATUS.PENDING_PAYMENT]: [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PAID]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.ON_HOLD, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.ON_HOLD]: [ORDER_STATUS.PAID, ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.RETURNED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  currentStatus: ORDER_STATUS,
  newStatus: ORDER_STATUS,
): boolean {
  const allowedTransitions = OrderStatusTransitions[currentStatus];
  return allowedTransitions.includes(newStatus);
}

/**
 * Preorder Status Display Labels
 */
export const PreorderStatusLabel: Record<PREORDER_STATUS, string> = {
  [PREORDER_STATUS.PENDING_STOCK]: 'Pending Stock',
  [PREORDER_STATUS.PARTIALLY_RESERVED]: 'Partially Reserved',
  [PREORDER_STATUS.READY_TO_FULFILL]: 'Ready to Fulfill',
  [PREORDER_STATUS.FULFILLED]: 'Fulfilled',
  [PREORDER_STATUS.CANCELED]: 'Canceled',
};

/**
 * Preorder Status Color Mapping for UI
 */
export const PreorderStatusColor: Record<PREORDER_STATUS, 'success' | 'info' | 'warning' | 'error'> = {
  [PREORDER_STATUS.PENDING_STOCK]: 'warning',
  [PREORDER_STATUS.PARTIALLY_RESERVED]: 'warning',
  [PREORDER_STATUS.READY_TO_FULFILL]: 'success',
  [PREORDER_STATUS.FULFILLED]: 'success',
  [PREORDER_STATUS.CANCELED]: 'error',
};

/**
 * Preorder statuses that indicate the item is waiting for stock
 */
export const WAITING_PREORDER_STATUSES = new Set<PREORDER_STATUS>([
  PREORDER_STATUS.PENDING_STOCK,
  PREORDER_STATUS.PARTIALLY_RESERVED,
]);

/**
 * Type guard for waiting preorder status
 */
export function isWaitingPreorderStatus(status: string | undefined): status is PREORDER_STATUS {
  return status !== undefined && WAITING_PREORDER_STATUSES.has(status as PREORDER_STATUS);
}

/**
 * Payment Method Display Labels
 */
export const PaymentMethodLabel: Record<PAYMENT_METHOD, string> = {
  [PAYMENT_METHOD.VNPAY]: 'VNPay',
  [PAYMENT_METHOD.CASH]: 'Cash on Delivery',
  [PAYMENT_METHOD.BANK_TRANSFER]: 'Bank Transfer',
  [PAYMENT_METHOD.CARD]: 'Credit/Debit Card',
  [PAYMENT_METHOD.MOMO]: 'MoMo Wallet',
  [PAYMENT_METHOD.ZALO_PAY]: 'ZaloPay',
};

/**
 * Payment Method Icons (emoji for quick reference)
 */
export const PaymentMethodIcon: Record<PAYMENT_METHOD, string> = {
  [PAYMENT_METHOD.VNPAY]: '💳',
  [PAYMENT_METHOD.CASH]: '💵',
  [PAYMENT_METHOD.BANK_TRANSFER]: '🏦',
  [PAYMENT_METHOD.CARD]: '💳',
  [PAYMENT_METHOD.MOMO]: '📱',
  [PAYMENT_METHOD.ZALO_PAY]: '📱',
};

/**
 * Shipping Method Display Labels
 */
export const ShippingMethodLabel: Record<SHIPPING_METHOD, string> = {
  [SHIPPING_METHOD.STANDARD]: 'Standard Delivery',
  [SHIPPING_METHOD.EXPRESS]: 'Express Delivery',
};

/**
 * Shipping Method Fees
 */
export const ShippingMethodFee: Record<SHIPPING_METHOD, number> = {
  [SHIPPING_METHOD.STANDARD]: 30000,
  [SHIPPING_METHOD.EXPRESS]: 50000,
};

/**
 * Shipping Method Estimated Days
 */
export const ShippingMethodDays: Record<SHIPPING_METHOD, string> = {
  [SHIPPING_METHOD.STANDARD]: '3-5 business days',
  [SHIPPING_METHOD.EXPRESS]: '1-2 business days',
};

// ============================================================================
// Type Guards for Enums
// ============================================================================

/**
 * Type guard for OrderType
 */
export function isOrderType(value: unknown): value is ORDER_TYPES {
  return typeof value === 'string' && Object.values(ORDER_TYPES).includes(value as ORDER_TYPES);
}

/**
 * Type guard for OrderStatus
 */
export function isOrderStatus(value: unknown): value is ORDER_STATUS {
  return typeof value === 'string' && Object.values(ORDER_STATUS).includes(value as ORDER_STATUS);
}

/**
 * Type guard for PreorderStatus
 */
export function isPreorderStatus(value: unknown): value is PREORDER_STATUS {
  return typeof value === 'string' && Object.values(PREORDER_STATUS).includes(value as PREORDER_STATUS);
}

/**
 * Type guard for PaymentMethod
 */
export function isPaymentMethod(value: unknown): value is PAYMENT_METHOD {
  return typeof value === 'string' && Object.values(PAYMENT_METHOD).includes(value as PAYMENT_METHOD);
}

/**
 * Type guard for UserRole
 */
export function isUserRole(value: unknown): value is USER_ROLES {
  return typeof value === 'string' && Object.values(USER_ROLES).includes(value as USER_ROLES);
}

/**
 * Type guard for ShippingMethod
 */
export function isShippingMethod(value: unknown): value is SHIPPING_METHOD {
  return typeof value === 'string' && Object.values(SHIPPING_METHOD).includes(value as SHIPPING_METHOD);
}

// ============================================================================
// Export all enums and utilities for convenience
// ============================================================================

export const Enums = {
  // Enums (use SCREAMING_CASE from shared package)
  OrderType: ORDER_TYPES,
  OrderStatus: ORDER_STATUS,
  PreorderStatus: PREORDER_STATUS,
  PaymentMethod: PAYMENT_METHOD,
  PaymentStatus: PAYMENT_STATUS,
  UserRole: USER_ROLES,
  ShippingMethod: SHIPPING_METHOD,

  // Labels
  UserRoleLabels,
  OrderStatusLabel,
  OrderStatusColor,
  PreorderStatusLabel,
  PreorderStatusColor,
  PaymentMethodLabel,
  PaymentMethodIcon,
  ShippingMethodLabel,
  ShippingMethodFee,
  ShippingMethodDays,

  // Type Guards
  isOrderType,
  isOrderStatus,
  isPreorderStatus,
  isPaymentMethod,
  isUserRole,
  isShippingMethod,
  isValidStatusTransition,
  isWaitingPreorderStatus,

  // Sets
  WAITING_PREORDER_STATUSES,
};
