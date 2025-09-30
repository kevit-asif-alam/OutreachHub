import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AdminAuthController } from './admin-auth.controller';
import { AuthService } from './auth.service';
import { User, UserSchema } from './schemas/user.schema';
import { Token, TokenSchema } from './schemas/token.schema';
import { AppAuthController } from './app-auth.controller';
import { GeneralAuthController } from './general-auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtValidationStrategy } from './strategies/jwt-validation.strategy';
import { Workspace, WorkspaceSchema } from '../workspace/schemas/workspace.schema';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'changeme',
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Workspace.name, schema: WorkspaceSchema },
    ]),
  ],
  controllers: [AdminAuthController, AppAuthController, GeneralAuthController],
  providers: [AuthService, JwtStrategy, JwtValidationStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
