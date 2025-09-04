import { 
  Controller, 
  Get, 
  UseGuards, 
  Req, 
  Query,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AppGuard } from '../../common/guards/app.guard';
import { WorkspaceGuard, WorkspaceRoles } from '../../common/guards/workspace.guard';
import { UserRole } from '../auth/schemas/user.schema';

@Controller('app/analytics')
@UseGuards(JwtAuthGuard, AppGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('dashboard')
  @WorkspaceRoles(UserRole.EDITOR, UserRole.VIEWER)
  async getDashboardStats(@Req() req) {
    return this.service.getDashboardStats(req.user.workspaceId);
  }

  @Get('campaigns-per-day')
  @WorkspaceRoles(UserRole.EDITOR, UserRole.VIEWER)
  async getCampaignsPerDay(
    @Req() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getCampaignsPerDay(
      req.user.workspaceId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('messages-per-type-per-day')
  @WorkspaceRoles(UserRole.EDITOR, UserRole.VIEWER)
  async getMessagesPerTypePerDay(
    @Req() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getMessagesPerTypePerDay(
      req.user.workspaceId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('contacts-reached-per-day')
  @WorkspaceRoles(UserRole.EDITOR, UserRole.VIEWER)
  async getContactsReachedPerDay(
    @Req() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getContactsReachedPerDay(
      req.user.workspaceId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}


