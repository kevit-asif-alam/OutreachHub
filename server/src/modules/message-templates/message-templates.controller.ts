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
import { MessageTemplatesService } from './message-templates.service';
import { CreateMessageTemplateDto } from './dto/create-message-template.dto';
import { UpdateMessageTemplateDto } from './dto/update-message-template.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AppGuard } from '../../common/guards/app.guard';
import { WorkspaceGuard, WorkspaceRoles } from '../../common/guards/workspace.guard';
import { UserRole } from '../auth/schemas/user.schema';

@Controller('app/message-templates')
@UseGuards(JwtAuthGuard, AppGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class MessageTemplatesController {
  constructor(private readonly service: MessageTemplatesService) {}

  @Post()
  @WorkspaceRoles(UserRole.EDITOR)
  async create(@Body() dto: CreateMessageTemplateDto, @Req() req) {
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
    return this.service.getTemplateStats(req.user.workspaceId);
  }

  @Get(':id')
  @WorkspaceRoles(UserRole.EDITOR, UserRole.VIEWER)
  async findOne(@Param('id') id: string, @Req() req) {
    return this.service.findOne(id, req.user.workspaceId);
  }

  @Patch(':id')
  @WorkspaceRoles(UserRole.EDITOR)
  async update(
    @Param('id') id: string, 
    @Body() dto: UpdateMessageTemplateDto,
    @Req() req
  ) {
    return this.service.update(id, dto, req.user.workspaceId, req.user.sub);
  }

  @Delete(':id')
  @WorkspaceRoles(UserRole.EDITOR)
  async remove(@Param('id') id: string, @Req() req) {
    return this.service.remove(id, req.user.workspaceId);
  }
}


