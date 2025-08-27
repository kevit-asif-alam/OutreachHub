import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';
import { UserRole } from '../../modules/auth/schemas/user.schema';

export const WORKSPACE_ROLES_KEY = 'workspace_roles';

export const WorkspaceRoles = (...roles: UserRole[]) => 
  (target: any, key?: string, descriptor?: any) => {
    if (descriptor) {
      Reflect.defineMetadata(WORKSPACE_ROLES_KEY, roles, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(WORKSPACE_ROLES_KEY, roles, target);
    return target;
  };

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      WORKSPACE_ROLES_KEY,
      context.getHandler(),
    ) || [];

    // If no roles are specified, just check if user is authenticated
    if (requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    // For admin users, bypass workspace role checks
    if (user.isAdmin) {
      return true;
    }

    // Check if user has the required role for the workspace
    const userWorkspace = user.workspaces?.find(
      (ws: any) => ws.workspaceId === user.workspaceId
    );

    if (!userWorkspace) {
      throw new ForbiddenException('No access to this workspace');
    }

    // If no specific roles required, just having access is enough
    if (requiredRoles.length === 0) {
      return true;
    }

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some((role) => userWorkspace.role === role);
    
    if (!hasRole) {
      throw new ForbiddenException(
        `Required roles: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }
}
