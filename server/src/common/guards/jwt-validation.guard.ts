import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JWT_VALIDATION_STRATEGY_NAME } from '../../modules/auth/strategies/jwt-validation.strategy';

@Injectable()
export class JwtValidationGuard extends AuthGuard(JWT_VALIDATION_STRATEGY_NAME) {
  canActivate(context: any) {
    return super.canActivate(context);
  }
}
