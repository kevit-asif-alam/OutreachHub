import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateAdmin(dto.email, dto.password);
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('logout')
  async logout(@Body() dto: LogoutDto, @Req() req) {
    return this.authService.logout(dto.jti);
  }
}
