import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export enum UserRole {
  ADMIN = 0,
  MANAGER = 1,
  OPERATION = 2,
  SALE = 3,
  CUSTOMER = 4,
}

interface RequestWithUser {
  user?: {
    role: UserRole | string | number;
  };
}

function normalizeRole(role: UserRole | string | number): UserRole | null {
  if (typeof role === 'number') {
    return Number.isInteger(role) ? (role as UserRole) : null;
  }

  if (typeof role === 'string') {
    const numericRole = Number.parseInt(role, 10);
    if (!Number.isNaN(numericRole)) {
      return numericRole as UserRole;
    }

    const enumValue = (UserRole as unknown as Record<string, number>)[role];
    return typeof enumValue === 'number' ? (enumValue as UserRole) : null;
  }

  return null;
}

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // Check if user is authenticated
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const normalizedRole = normalizeRole(user.role);
    if (normalizedRole === null) {
      throw new ForbiddenException(
        `User role '${String(user.role)}' is invalid for authorization`,
      );
    }

    const hasRole = requiredRoles.includes(normalizedRole);
    if (!hasRole) {
      throw new ForbiddenException(
        `User role '${String(normalizedRole)}' is not authorized. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}

// Decorator to specify required roles
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

// Manager and Admin only
export const MANAGER_OR_ADMIN = [UserRole.MANAGER, UserRole.ADMIN];

// Admin only
export const ADMIN_ONLY = [UserRole.ADMIN];
