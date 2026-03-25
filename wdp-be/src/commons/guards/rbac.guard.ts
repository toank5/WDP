import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES } from '@eyewear/shared';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

interface RequestWithUser {
  user?: {
    role: ROLES | string;
  };
}

function normalizeRole(role: ROLES | string): ROLES | null {
  if (typeof role === 'string') {
    // Check if it's a valid ROLES enum value
    if (Object.values(ROLES).includes(role as ROLES)) {
      return role as ROLES;
    }
  }

  return null;
}

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<ROLES[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Check if route is public - skip role check
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

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
export const Roles = (...roles: ROLES[]) => SetMetadata('roles', roles);

// Re-export ROLES as UserRole for backward compatibility
export { ROLES as UserRole } from '@eyewear/shared';

// Manager and Admin only
export const MANAGER_OR_ADMIN = [ROLES.MANAGER, ROLES.ADMIN];

// Admin only
export const ADMIN_ONLY = [ROLES.ADMIN];
