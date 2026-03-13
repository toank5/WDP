/**
 * User-related constants shared between frontend and backend
 */

import { USER_ROLES } from '../enums/user.enums';

/**
 * User Role Display Labels
 */
export const USER_ROLE_LABELS: Record<USER_ROLES, string> = {
  [USER_ROLES.ADMIN]: 'Admin',
  [USER_ROLES.MANAGER]: 'Manager',
  [USER_ROLES.OPERATION]: 'Operations Staff',
  [USER_ROLES.SALE]: 'Sales Staff',
  [USER_ROLES.CUSTOMER]: 'Customer',
};
