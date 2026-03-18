/**
 * User Role Enumeration
 */
export enum USER_ROLES {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  OPERATION = 'OPERATION',
  SALE = 'SALE',
  CUSTOMER = 'CUSTOMER',
}

/**
 * Alias for frontend compatibility
 */
export { USER_ROLES as UserRole };

/**
 * Alias for backend compatibility
 */
export { USER_ROLES as ROLES };

/**
 * Address Types
 */
export enum ADDRESS_TYPES {
  BILLING = 'BILLING',
  SHIPPING = 'SHIPPING',
}
