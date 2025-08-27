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
  ValidationPipe
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { WorkspaceGuard, WorkspaceRoles } from '../../common/guards/workspace.guard';
import { UserRole } from '../auth/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';

@Controller('admin/workspaces')
@UseGuards(JwtAuthGuard, AdminGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class WorkspacesController {
  constructor(
    private readonly service: WorkspacesService,
    private readonly jwtService: JwtService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body() dto: CreateWorkspaceDto, @Req() req) {
    return this.service.create({
      ...dto,
      createdBy: req.user.userId,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @WorkspaceRoles(UserRole.EDITOR, UserRole.VIEWER)
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @WorkspaceRoles(UserRole.EDITOR)
  async update(
    @Param('id') id: string, 
    @Body() dto: UpdateWorkspaceDto,
    @Req() req
  ) {
    return this.service.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/users')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @WorkspaceRoles(UserRole.EDITOR)
  async inviteUser(
    @Param('id') workspaceId: string, 
    @Body() dto: InviteUserDto,
    @Req() req
  ) {
    try {
      return await this.service.inviteUser(workspaceId, dto, req.user.userId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id/users')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @WorkspaceRoles(UserRole.EDITOR, UserRole.VIEWER)
  async listWorkspaceUsers(@Param('id') workspaceId: string) {
    return this.service.listUsers(workspaceId);
  }

  @Delete(':id/users/:userId')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @WorkspaceRoles(UserRole.EDITOR)
  async removeUser(
    @Param('id') workspaceId: string,
    @Param('userId') userId: string,
    @Req() req: any
  ) {
    // Prevent users from removing themselves
    if (userId === req.user.sub) {
      throw new ForbiddenException('Cannot remove yourself from workspace');
    }
    
    return this.service.revokeWorkspaceAccess(userId, workspaceId);
  }
}
