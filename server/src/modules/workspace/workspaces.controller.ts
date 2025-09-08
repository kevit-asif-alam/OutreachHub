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
  BadRequestException,
  ForbiddenException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { UserRole } from '../auth/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';

@Controller('admin/workspaces')
@UseGuards(JwtAuthGuard, AdminGuard)
export class WorkspacesController {
  constructor(
    private readonly service: WorkspacesService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  async create(@Body() dto: CreateWorkspaceDto, @Req() req) {
    return this.service.create({
      ...dto,
      createdBy: req.user.sub,
    });
  }

  @Get()
  async findAll(@Req() req) {
    return this.service.findAllByAdmin(req.user.sub);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    return this.service.findOneOwned(id, req.user.sub);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceDto,
    @Req() req,
  ) {
    return this.service.updateOwned(id, dto, req.user.sub);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    return this.service.removeOwned(id, req.user.sub);
  }

  @Post(':id/users')
  async inviteUser(
    @Param('id') workspaceId: string,
    @Body() dto: InviteUserDto,
    @Req() req,
  ) {
    try {
      return await this.service.inviteUserOwned(workspaceId, dto, req.user.sub, !!req.user.isAdmin);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id/users')
  async listWorkspaceUsers(@Param('id') workspaceId: string, @Req() req) {
    return this.service.listUsersOwned(workspaceId, req.user.sub);
  }

  @Delete(':id/users/:userId')
  async removeUser(
    @Param('id') workspaceId: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    // Prevent users from removing themselves
    if (userId === req.user.sub) {
      throw new ForbiddenException('Cannot remove yourself from workspace');
    }

    return this.service.revokeWorkspaceAccessOwned(userId, workspaceId, req.user.sub);
  }
}
