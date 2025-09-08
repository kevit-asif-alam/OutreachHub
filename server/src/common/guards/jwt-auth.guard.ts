import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JWT_STRATEGY_NAME } from '../../modules/auth/strategies/jwt.strategy';

@Injectable()
export class JwtAuthGuard extends AuthGuard(JWT_STRATEGY_NAME) {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    return (await super.canActivate(context)) as boolean;
  }

  handleRequest(err: any, user: any, _info: any, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired token');
    }

    // Enforce portal access consistency with path
    const req = context.switchToHttp().getRequest();
    const requestedPath = req.path as string;
    const isAdminPath = requestedPath.startsWith('/admin');
    if ((isAdminPath && user.portal !== 'ADMIN') || (!isAdminPath && user.portal === 'ADMIN')) {
      throw new UnauthorizedException('Invalid access to portal');
    }

    // Attach the validated user (already includes workspace checks for APP)
    req.user = user;
    return user;
  }
}
