/**
 * Central Enum Definitions for EyeWear Project
 *
 * This file contains all enum definitions used across the frontend application.
 * Import enums from here instead of defining string literals to ensure type safety.
 */

// ============================================================================
// Order Enums
// ============================================================================

/**
 * Order Type Enumeration
 */
export enum OrderType {
  READY = 'READY',
  PREORDER = 'PREORDER',
  PRESCRIPTION = 'PRESCRIPTION',
}

/**
 * Order Status Enumeration
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  ON_HOLD = 'ON_HOLD',
  PROCESSING = 'PROCESSING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

/**
 * Preorder Status Enumeration
 */
export enum PreorderStatus {
  PENDING_STOCK = 'PENDING_STOCK',
  PARTIALLY_RESERVED = 'PARTIALLY_RESERVED',
  READY_TO_FULFILL = 'READY_TO_FULFILL',
  FULFILLED = 'FULFILLED',
  CANCELED = 'CANCELED',
}

/**
 * Prescription Status Enumeration
 */
export enum PrescriptionStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  NEEDS_UPDATE = 'NEEDS_UPDATE',
  APPROVED = 'APPROVED',
  IN_MANUFACTURING = 'IN_MANUFACTURING',
  READY_TO_SHIP = 'READY_TO_SHIP',
  COMPLETED = 'COMPLETED',
}

/**
 * Payment Method Enumeration
 */
export enum PaymentMethod {
  VNPAY = 'VNPAY',
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

/**
 * Payment Status Enumeration
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// ============================================================================
// User Role Enum
// ============================================================================

/**
 * User Role Enumeration
 */
export enum UserRole {
  CUSTOMER = 1,
  OPERATION = 2,
  SALE = 3,
  MANAGER = 4,
  ADMIN = 5,
}

/**
 * User Role Display Names
 */
export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.CUSTOMER]: 'Customer',
  [UserRole.OPERATION]: 'Operations Staff',
  [UserRole.SALE]: 'Sales Staff',
  [UserRole.MANAGER]: 'Manager',
  [UserRole.ADMIN]: 'Administrator',
}

// ============================================================================
// Order Status Mappings
// ============================================================================

/**
 * Order Status Display Labels
 */
export const OrderStatusLabel: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pending',
  [OrderStatus.PENDING_PAYMENT]: 'Pending Payment',
  [OrderStatus.PAID]: 'Paid',
  [OrderStatus.ON_HOLD]: 'On Hold',
  [OrderStatus.PROCESSING]: 'Processing',
  [OrderStatus.CONFIRMED]: 'Confirmed',
  [OrderStatus.SHIPPED]: 'Shipped',
  [OrderStatus.DELIVERED]: 'Delivered',
  [OrderStatus.RETURNED]: 'Returned',
  [OrderStatus.CANCELLED]: 'Cancelled',
}

/**
 * Order Status Color Mapping for UI
 */
export const OrderStatusColor: Record<OrderStatus, 'default' | 'success' | 'info' | 'warning' | 'error'> = {
  [OrderStatus.PENDING]: 'default',
  [OrderStatus.PENDING_PAYMENT]: 'warning',
  [OrderStatus.PAID]: 'info',
  [OrderStatus.ON_HOLD]: 'warning',
  [OrderStatus.PROCESSING]: 'info',
  [OrderStatus.CONFIRMED]: 'info',
  [OrderStatus.SHIPPED]: 'warning',
  [OrderStatus.DELIVERED]: 'success',
  [OrderStatus.RETURNED]: 'error',
  [OrderStatus.CANCELLED]: 'error',
}

/**
 * Valid Order Status Transitions
 * Key = current status, Value = array of allowed next statuses
 */
export const OrderStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PENDING_PAYMENT],
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.ON_HOLD, OrderStatus.CANCELLED],
  [OrderStatus.ON_HOLD]: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.SHIPPED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.RETURNED]: [],
  [OrderStatus.CANCELLED]: [],
}

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean {
  const allowedTransitions = OrderStatusTransitions[currentStatus]
  return allowedTransitions.includes(newStatus)
}

// ============================================================================
// Preorder Status Mappings
// ============================================================================

/**
 * Preorder Status Display Labels
 */
export const PreorderStatusLabel: Record<PreorderStatus, string> = {
  [PreorderStatus.PENDING_STOCK]: 'Pending Stock',
  [PreorderStatus.PARTIALLY_RESERVED]: 'Partially Reserved',
  [PreorderStatus.READY_TO_FULFILL]: 'Ready to Fulfill',
  [PreorderStatus.FULFILLED]: 'Fulfilled',
  [PreorderStatus.CANCELED]: 'Canceled',
}

/**
 * Preorder Status Color Mapping for UI
 */
export const PreorderStatusColor: Record<PreorderStatus, 'success' | 'info' | 'warning' | 'error'> = {
  [PreorderStatus.PENDING_STOCK]: 'warning',
  [PreorderStatus.PARTIALLY_RESERVED]: 'warning',
  [PreorderStatus.READY_TO_FULFILL]: 'success',
  [PreorderStatus.FULFILLED]: 'success',
  [PreorderStatus.CANCELED]: 'error',
}

/**
 * Preorder statuses that indicate the item is waiting for stock
 */
export const WAITING_PREORDER_STATUSES = new Set<PreorderStatus>([
  PreorderStatus.PENDING_STOCK,
  PreorderStatus.PARTIALLY_RESERVED,
])

/**
 * Type guard for waiting preorder status
 */
export function isWaitingPreorderStatus(status: string | undefined): status is PreorderStatus {
  return status !== undefined && WAITING_PREORDER_STATUSES.has(status as PreorderStatus)
}

// ============================================================================
// Prescription Status Mappings
// ============================================================================

/**
 * Prescription Status Display Labels
 */
export const PrescriptionStatusLabel: Record<PrescriptionStatus, string> = {
  [PrescriptionStatus.PENDING_REVIEW]: 'Pending Review',
  [PrescriptionStatus.NEEDS_UPDATE]: 'Needs Update',
  [PrescriptionStatus.APPROVED]: 'Approved',
  [PrescriptionStatus.IN_MANUFACTURING]: 'In Manufacturing',
  [PrescriptionStatus.READY_TO_SHIP]: 'Ready to Ship',
  [PrescriptionStatus.COMPLETED]: 'Completed',
}

/**
 * Prescription Status Color Mapping for UI
 */
export const PrescriptionStatusColor: Record<PrescriptionStatus, 'success' | 'info' | 'warning' | 'error'> = {
  [PrescriptionStatus.PENDING_REVIEW]: 'warning',
  [PrescriptionStatus.NEEDS_UPDATE]: 'error',
  [PrescriptionStatus.APPROVED]: 'success',
  [PrescriptionStatus.IN_MANUFACTURING]: 'info',
  [PrescriptionStatus.READY_TO_SHIP]: 'success',
  [PrescriptionStatus.COMPLETED]: 'success',
}

// ============================================================================
// Payment Method Mappings
// ============================================================================

/**
 * Payment Method Display Labels
 */
export const PaymentMethodLabel: Record<PaymentMethod, string> = {
  [PaymentMethod.VNPAY]: 'VNPay',
  [PaymentMethod.CASH]: 'Cash on Delivery',
  [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
}

/**
 * Payment Method Icons (emoji for quick reference)
 */
export const PaymentMethodIcon: Record<PaymentMethod, string> = {
  [PaymentMethod.VNPAY]: '💳',
  [PaymentMethod.CASH]: '💵',
  [PaymentMethod.BANK_TRANSFER]: '🏦',
}

// ============================================================================
// Shipping Enums
// ============================================================================

/**
 * Shipping Method Enumeration
 */
export enum ShippingMethod {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
}

/**
 * Shipping Method Display Labels
 */
export const ShippingMethodLabel: Record<ShippingMethod, string> = {
  [ShippingMethod.STANDARD]: 'Standard Delivery',
  [ShippingMethod.EXPRESS]: 'Express Delivery',
}

/**
 * Shipping Method Fees
 */
export const ShippingMethodFee: Record<ShippingMethod, number> = {
  [ShippingMethod.STANDARD]: 30000,
  [ShippingMethod.EXPRESS]: 50000,
}

/**
 * Shipping Method Estimated Days
 */
export const ShippingMethodDays: Record<ShippingMethod, string> = {
  [ShippingMethod.STANDARD]: '3-5 business days',
  [ShippingMethod.EXPRESS]: '1-2 business days',
}

// ============================================================================
// Type Guards for Enums
// ============================================================================

/**
 * Type guard for OrderType
 */
export function isOrderType(value: unknown): value is OrderType {
  return typeof value === 'string' && Object.values(OrderType).includes(value as OrderType)
}

/**
 * Type guard for OrderStatus
 */
export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && Object.values(OrderStatus).includes(value as OrderStatus)
}

/**
 * Type guard for PreorderStatus
 */
export function isPreorderStatus(value: unknown): value is PreorderStatus {
  return typeof value === 'string' && Object.values(PreorderStatus).includes(value as PreorderStatus)
}

/**
 * Type guard for PrescriptionStatus
 */
export function isPrescriptionStatus(value: unknown): value is PrescriptionStatus {
  return typeof value === 'string' && Object.values(PrescriptionStatus).includes(value as PrescriptionStatus)
}

/**
 * Type guard for PaymentMethod
 */
export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === 'string' && Object.values(PaymentMethod).includes(value as PaymentMethod)
}

/**
 * Type guard for UserRole
 */
export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'number' && Object.values(UserRole).includes(value as UserRole)
}

/**
 * Type guard for ShippingMethod
 */
export function isShippingMethod(value: unknown): value is ShippingMethod {
  return typeof value === 'string' && Object.values(ShippingMethod).includes(value as ShippingMethod)
}

// ============================================================================
// Export all enums and utilities
// ============================================================================

export const Enums = {
  // Enums
  OrderType,
  OrderStatus,
  PreorderStatus,
  PrescriptionStatus,
  PaymentMethod,
  PaymentStatus,
  UserRole,
  ShippingMethod,

  // Labels
  UserRoleLabels,
  OrderStatusLabel,
  OrderStatusColor,
  PreorderStatusLabel,
  PreorderStatusColor,
  PrescriptionStatusLabel,
  PrescriptionStatusColor,
  PaymentMethodLabel,
  PaymentMethodIcon,
  ShippingMethodLabel,
  ShippingMethodFee,
  ShippingMethodDays,

  // Type Guards
  isOrderType,
  isOrderStatus,
  isPreorderStatus,
  isPrescriptionStatus,
  isPaymentMethod,
  isUserRole,
  isShippingMethod,
  isValidStatusTransition,
  isWaitingPreorderStatus,

  // Sets
  WAITING_PREORDER_STATUSES,
}
