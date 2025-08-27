import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Token, TokenDocument } from '../schemas/token.schema';
import { User, UserDocument } from '../schemas/user.schema';

export const JWT_STRATEGY_NAME = 'jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY_NAME) {
  constructor(
    private configService: ConfigService,
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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

    // Verify the portal access
    const requestedPath = req.path;
    const isAdminPath = requestedPath.startsWith('/admin');
    
    if ((isAdminPath && payload.portal !== 'ADMIN') || 
        (!isAdminPath && payload.portal === 'ADMIN')) {
      throw new UnauthorizedException('Invalid access to portal');
    }

    // For app portal, verify workspace access
    if (payload.portal === 'APP' && payload.workspaceId) {
      const user = await this.userModel.findById(payload.sub).select('workspaces');
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const hasAccess = user.workspaces.some(
        ws => ws.workspaceId.toString() === payload.workspaceId
      );

      if (!hasAccess) {
        throw new UnauthorizedException('No access to the specified workspace');
      }
    }

    return {
      userId: payload.sub,
      email: payload.email,
      isAdmin: payload.isAdmin,
      portal: payload.portal,
      workspaceId: payload.workspaceId,
      jti: payload.jti,
    };
  }
  }
}
