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
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AppGuard } from '../../common/guards/app.guard';
import { WorkspaceGuard, WorkspaceRoles } from '../../common/guards/workspace.guard';
import { UserRole } from '../auth/schemas/user.schema';

@Controller('app/contacts')
@UseGuards(JwtAuthGuard, AppGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class ContactsController {
  constructor(private readonly service: ContactsService) {}

  @Post()
  @WorkspaceRoles(UserRole.EDITOR)
  async create(@Body() dto: CreateContactDto, @Req() req) {
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
    return this.service.getContactStats(req.user.workspaceId);
  }

  @Get('tags')
  @WorkspaceRoles(UserRole.EDITOR, UserRole.VIEWER)
  async getTags(@Req() req) {
    return this.service.getTags(req.user.workspaceId);
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
    @Body() dto: UpdateContactDto,
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


