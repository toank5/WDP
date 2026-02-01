import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  OPERATIONS = 'operations',
  SALES = 'sales',
  CUSTOMER = 'customer',
}

@Injectable()
export class RbacGuard implements CanActivate {
  private requiredRoles: UserRole[] = [];

  setRequiredRoles(roles: UserRole[]): void {
    this.requiredRoles = roles;
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user is authenticated
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Check if user has required role
    if (this.requiredRoles.length > 0) {
      const hasRole = this.requiredRoles.includes(user.role);
      if (!hasRole) {
        throw new ForbiddenException(
          `User role '${user.role}' is not authorized. Required roles: ${this.requiredRoles.join(', ')}`,
        );
      }
    }

    return true;
  }
}

// Decorator to specify required roles
export function Roles(...roles: UserRole[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata('roles', roles, descriptor.value);
    return descriptor;
  };
}

// Manager and Admin only
export const MANAGER_OR_ADMIN = [UserRole.MANAGER, UserRole.ADMIN];

// Admin only
export const ADMIN_ONLY = [UserRole.ADMIN];
