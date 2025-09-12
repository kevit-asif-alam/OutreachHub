import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (!req.user?.isAdmin || req.user?.portal !== 'ADMIN') {
      throw new ForbiddenException('Admin access only');
    }
    return true;
  }
}
