import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, true);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(
      dto.email,
      dto.password,
      true,
    );
    return this.authService.login(user, 'ADMIN');
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('create-user')
  async createUser(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, false);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('logout')
  async logout(@Req() req) {
    const payload = req.user as JwtPayload;
    if (!payload.jti) {
      throw new UnauthorizedException('Invalid token');
    }
    return this.authService.logout(payload.jti);
  }
}
