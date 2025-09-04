import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  Param, 
  Patch, 
  Post, 
  UseGuards, 
  Req, 
  Query,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AppGuard } from '../../common/guards/app.guard';
import { WorkspaceGuard, WorkspaceRoles } from '../../common/guards/workspace.guard';
import { UserRole } from '../auth/schemas/user.schema';

@Controller('app/campaigns')
@UseGuards(JwtAuthGuard, AppGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class CampaignsController {
  constructor(private readonly service: CampaignsService) {}

  @Post()
  @WorkspaceRoles(UserRole.EDITOR)
  async create(@Body() dto: CreateCampaignDto, @Req() req) {
    return this.service.create({
      ...dto,
      workspaceId: req.user.workspaceId,
      createdBy: req.user.sub,
    });
  }

  @Get()
  @WorkspaceRoles(UserRole.EDITOR, UserRole.VIEWER)
  async findAll(
    @Req() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    return this.service.findAll(
      req.user.workspaceId,
      parseInt(page),
      parseInt(limit),
      search,
    );
  }

  @Get('stats')
  @WorkspaceRoles(UserRole.EDITOR, UserRole.VIEWER)
  async getStats(@Req() req) {
    return this.service.getCampaignStats(req.user.workspaceId);
  }

  @Get(':id')
  @WorkspaceRoles(UserRole.EDITOR, UserRole.VIEWER)
  async findOne(@Param('id') id: string, @Req() req) {
    return this.service.findOne(id, req.user.workspaceId);
  }

  @Get(':id/status')
  @WorkspaceRoles(UserRole.EDITOR, UserRole.VIEWER)
  async getStatus(@Param('id') id: string, @Req() req) {
    return this.service.getCampaignStatus(id, req.user.workspaceId);
  }

  @Patch(':id')
  @WorkspaceRoles(UserRole.EDITOR)
  async update(
    @Param('id') id: string, 
    @Body() dto: UpdateCampaignDto,
    @Req() req
  ) {
    return this.service.update(id, dto, req.user.workspaceId, req.user.sub);
  }

  @Post(':id/launch')
  @WorkspaceRoles(UserRole.EDITOR)
  async launch(@Param('id') id: string, @Req() req) {
    return this.service.launch(id, req.user.workspaceId);
  }

  @Post(':id/copy')
  @WorkspaceRoles(UserRole.EDITOR)
  async copy(@Param('id') id: string, @Req() req) {
    return this.service.copy(id, req.user.workspaceId, req.user.sub);
  }

  @Delete(':id')
  @WorkspaceRoles(UserRole.EDITOR)
  async remove(@Param('id') id: string, @Req() req) {
    return this.service.remove(id, req.user.workspaceId);
  }
}


