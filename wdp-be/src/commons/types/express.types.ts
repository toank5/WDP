import { Request } from 'express';
import { ROLES } from '../enums/role.enum';

/**
 * JWT Payload - structure of the decoded JWT token
 */
export interface JwtPayload {
  id: string;
  email: string;
  role: ROLES;
  iat?: number;
  exp?: number;
}

/**
 * Authenticated User attached to request by JWT strategy
 */
export interface RequestUser {
  _id: string;
  id: string;
  fullName: string;
  email: string;
  role: ROLES;
  avatar?: string;
  addresses?: unknown[];
}

/**
 * Express Request with authenticated user
 * Use this type for controller methods that require JWT authentication
 */
export interface AuthenticatedRequest extends Request {
  user?: RequestUser;
}

/**
 * Express Request type for public endpoints
 * User may or may not be present
 */
export interface RequestWithOptionalUser extends Request {
  user?: RequestUser;
}
