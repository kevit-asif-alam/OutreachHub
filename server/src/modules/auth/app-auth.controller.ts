import { Body, Controller, Post, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AppGuard } from '../../common/guards/app.guard';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Controller('app/auth')
export class AppAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password, false);
    
    if (!dto.workspaceId) {
      // Return user's workspaces if no workspaceId provided
      return { 
        userId: user._id,
        email: user.email,
        workspaces: user.workspaces 
      };
    }
    
    return this.authService.login(user, 'APP', dto.workspaceId);
  }

  @UseGuards(JwtAuthGuard, AppGuard)
  @Post('logout')
  async logout(@Req() req) {
    const payload = req.user as JwtPayload;
    if (!payload.jti) {
      throw new UnauthorizedException('Invalid token');
    }
    return this.authService.logout(payload.jti);
  }
}
