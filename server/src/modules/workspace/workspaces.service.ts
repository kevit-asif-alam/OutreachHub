import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Workspace, WorkspaceDocument } from './schemas/workspace.schema';
import { WorkspaceUser, WorkspaceUserDocument } from './schemas/workspace-user.schema';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { User, UserDocument } from '../auth/schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(WorkspaceUser.name) private wuserModel: Model<WorkspaceUserDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateWorkspaceDto) {
    return this.workspaceModel.create(dto);
  }

  async findAll() {
    return this.workspaceModel.find().lean();
  }

  async findOne(id: string) {
    const ws = await this.workspaceModel.findById(id).lean();
    if (!ws) throw new NotFoundException('Workspace not found');
    return ws;
  }

  async update(id: string, dto: UpdateWorkspaceDto) {
    return this.workspaceModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async remove(id: string) {
    return this.workspaceModel.findByIdAndDelete(id);
  }

  async inviteUser(workspaceId: string, dto: InviteUserDto) {
    let user = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (!user) {
      const tempPassword = dto.tempPassword ?? Math.random().toString(36).slice(-8);
      user = await this.userModel.create({
        email: dto.email.toLowerCase(),
        password: await bcrypt.hash(tempPassword, 10),
      });
    }
    const existing = await this.wuserModel.findOne({ workspaceId, userId: user._id });
    if (existing) return existing;
    return this.wuserModel.create({
      workspaceId,
      userId: user._id,
      role: dto.role,
    });
  }

  listUsers(workspaceId: string) {
    return this.wuserModel.find({ workspaceId }).populate('userId', 'email').lean();
  }
}
