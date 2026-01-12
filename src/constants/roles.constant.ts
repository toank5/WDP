import { UserRole } from '../modules/users/role.enum';

export const ADMIN_ROLES = [
    UserRole.ADMIN,
];

export const MANAGER_ROLES = [
    UserRole.MANAGER,
    UserRole.ADMIN,
];

export const STAFF_ROLES = [
    UserRole.SALES,
    UserRole.OPERATIONS,
    UserRole.MANAGER,
    UserRole.ADMIN,
];

export const ALL_INTERNAL_ROLES = [
    UserRole.SALES,
    UserRole.OPERATIONS,
    UserRole.MANAGER,
    UserRole.ADMIN,
];
