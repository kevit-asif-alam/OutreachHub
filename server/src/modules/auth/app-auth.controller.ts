import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AppGuard } from '../../common/guards/app.guard';

@Controller('app/auth')
export class AppAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    return this.authService.loginAsApp(user);
  }

  @UseGuards(JwtAuthGuard, AppGuard)
  @Post('logout')
  async logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto.jti);
  }
}
