/**
 * @deprecated Import from @eyewear/shared instead
 * This file re-exports from the shared package for backward compatibility
 */

// Import from shared package
import { USER_ROLES, USER_ROLE_LABELS } from '@eyewear/shared';

export const ROLES = USER_ROLES;

// Re-export roleLabels from shared package
export const roleLabels = USER_ROLE_LABELS;

// Re-export ROLES for convenience
export const ADMIN_ROLE = USER_ROLES.ADMIN
export const MANAGER_ROLE = USER_ROLES.MANAGER
export const OPERATION_ROLE = USER_ROLES.OPERATION
export const SALE_ROLE = USER_ROLES.SALE
export const CUSTOMER_ROLE = USER_ROLES.CUSTOMER
