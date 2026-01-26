/**
 * Role definitions derived from backend enum
 * Backend source: wdp-be/src/commons/enums/role.enum.ts
 */

import { ROLES } from './validations'

export const roleLabels: Record<number, string> = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.OPERATION]: 'Operation',
  [ROLES.SALE]: 'Sale',
  [ROLES.CUSTOMER]: 'Customer',
}

// Re-export ROLES for convenience
export const ADMIN_ROLE = ROLES.ADMIN
export const MANAGER_ROLE = ROLES.MANAGER
export const OPERATION_ROLE = ROLES.OPERATION
export const SALE_ROLE = ROLES.SALE
export const CUSTOMER_ROLE = ROLES.CUSTOMER

