import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

export enum UserRole {
  ADMIN = 0,
  MANAGER = 1,
  OPERATION = 2,
  SALE = 3,
  CUSTOMER = 4,
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

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user is authenticated
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Check if user has required role
    console.log('User role:', user.role, 'Type:', typeof user.role);
    console.log(
      'Required roles:',
      requiredRoles,
      'Types:',
      requiredRoles.map((r) => typeof r),
    );
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `User role '${user.role}' is not authorized. Required roles: ${requiredRoles.join(', ')}`,
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
