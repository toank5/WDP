/**
 * User-related type definitions shared between frontend and backend
 */

import { USER_ROLES, ADDRESS_TYPES } from '../enums/user.enums';

/**
 * Address
 */
export interface Address {
  type: ADDRESS_TYPES;
  street: string;
  city: string;
  district?: string;
  ward?: string;
  zipCode: string;
  isDefault?: boolean;
}

/**
 * User
 */
export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: USER_ROLES;
  avatar?: string;
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Register Request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role?: USER_ROLES;
}

/**
 * Login Request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Update User Request
 */
export interface UpdateUserRequest {
  email?: string;
  fullName?: string;
  avatar?: string;
  role?: USER_ROLES;
  addresses?: Address[];
}

/**
 * Add Address Request
 */
export interface AddAddressRequest extends Address {}

/**
 * Auth Response
 */
export interface AuthResponse {
  accessToken: string;
  user: User;
}
