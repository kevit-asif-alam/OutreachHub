import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtValidationGuard } from '../../common/guards/jwt-validation.guard';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Controller('auth')
export class GeneralAuthController {
  @UseGuards(JwtValidationGuard)
  @Get('validate')
  async validateToken(@Req() req) {
    const payload = req.user as JwtPayload;
    // If the guard passes, the token is valid
    return { 
      valid: true,
      portal: payload.portal,
      isAdmin: payload.isAdmin,
      userId: payload.sub
    };
  }
}
