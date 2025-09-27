import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Token, TokenDocument } from '../schemas/token.schema';

export const JWT_VALIDATION_STRATEGY_NAME = 'jwt-validation';

@Injectable()
export class JwtValidationStrategy extends PassportStrategy(Strategy, JWT_VALIDATION_STRATEGY_NAME) {
  constructor(
    private configService: ConfigService,
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'changeme',
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtPayload) {
    // Check if token is revoked
    const token = req.headers.authorization?.split(' ')[1];
    const tokenExists = await this.tokenModel.findOne({
      jti: payload.jti,
      revoked: { $ne: true },
      expiresAt: { $gt: new Date() },
    });

    if (!token || !tokenExists) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // For validation endpoint, we don't enforce portal restrictions
    // Just return the basic payload information
    return {
      sub: payload.sub,
      userId: payload.sub,
      email: payload.email,
      isAdmin: payload.isAdmin,
      portal: payload.portal,
      workspaceId: payload.workspaceId,
      jti: payload.jti,
    };
  }
}
