import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './role.enum';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true; // No roles required for this route
    }

    const { user } = context.switchToHttp().getRequest();
    console.log('User in request:', user); // Debug log for user object

    if (!user || !user.role) {
      throw new Error('User object or role is missing. Ensure JwtAuthGuard is applied.');
    }

    return requiredRoles.includes(user.role);
  }
}