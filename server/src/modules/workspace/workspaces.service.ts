import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Workspace, WorkspaceDocument } from './schemas/workspace.schema';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { User, UserDocument, UserRole } from '../auth/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { generateRandomPassword } from '../../common/utils/string-utils';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateWorkspaceDto & { createdBy: string }) {
    // Create the workspace (no session transactions for dev stand-alone MongoDB)
    const workspace = await this.workspaceModel.create({
      name: dto.name,
      description: dto.description,
      createdBy: new Types.ObjectId(dto.createdBy),
      members: [
        {
          userId: new Types.ObjectId(dto.createdBy),
          role: UserRole.EDITOR,
          joinedAt: new Date(),
        },
      ],
    });

    // Add workspace to user's workspaces
    await this.userModel.findByIdAndUpdate(dto.createdBy, {
      $addToSet: {
        workspaces: {
          workspaceId: workspace._id,
          role: UserRole.EDITOR,
        },
      },
    });

    return workspace;
  }

  async findAll() {
    return this.workspaceModel.find().lean();
  }

  // Return workspaces created by a specific admin
  async findAllByAdmin(adminId: string) {
    return this.workspaceModel.find({ createdBy: new Types.ObjectId(adminId) }).lean();
  }

  async findOne(id: string) {
    const workspace = await this.workspaceModel
      .findById(id)
      .populate('members.userId', 'email firstName lastName')
      .lean();
    
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    
    return workspace;
  }

  // Ensure workspace is owned by admin
  private async ensureOwned(workspaceId: string, adminId: string) {
    const ws = await this.workspaceModel.findById(workspaceId).lean();
    if (!ws) throw new NotFoundException('Workspace not found');
    if (ws.createdBy?.toString() !== adminId) {
      throw new ForbiddenException('Not owner of this workspace');
    }
    return ws;
  }

  async findOneOwned(id: string, adminId: string) {
    await this.ensureOwned(id, adminId);
    return this.findOne(id);
  }

  async update(id: string, dto: UpdateWorkspaceDto, updatedBy: string) {
    const workspace = await this.workspaceModel.findById(id);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Check if user has permission to update
    const isAdmin = workspace.members.some(
      m => m.userId.toString() === updatedBy && m.role === UserRole.EDITOR
    );

    if (!isAdmin) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.workspaceModel.findByIdAndUpdate(
      id, 
      { 
        ...dto,
        $addToSet: { updatedBy: new Types.ObjectId(updatedBy) } 
      },
      { new: true }
    );
  }

  async updateOwned(id: string, dto: UpdateWorkspaceDto, adminId: string) {
    await this.ensureOwned(id, adminId);
    return this.update(id, dto, adminId);
  }

  async remove(id: string) {
    // Remove workspace from all users
    await this.userModel.updateMany(
      { 'workspaces.workspaceId': new Types.ObjectId(id) },
      { $pull: { workspaces: { workspaceId: new Types.ObjectId(id) } } },
    );

    // Delete the workspace
    return this.workspaceModel.findByIdAndDelete(id);
  }

  async removeOwned(id: string, adminId: string) {
    await this.ensureOwned(id, adminId);
    return this.remove(id);
  }

  async inviteUser(workspaceId: string, dto: InviteUserDto, invitedBy: string, isAdmin: boolean) {
    // Check if workspace exists and inviter has permission
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const isInviterEditorInWorkspace = workspace.members.some(
      (m) => m.userId.toString() === invitedBy && m.role === UserRole.EDITOR,
    );
    if (!(isAdmin || isInviterEditorInWorkspace)) {
      throw new ForbiddenException('Insufficient permissions to invite users');
    }

    // Find or create user and assign a dummy password (provided or generated)
    let user = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    let tempPassword: string = dto.tempPassword && dto.tempPassword.length >= 8
      ? dto.tempPassword
      : generateRandomPassword(12);

    if (!user) {
      user = await this.userModel.create({
        email: dto.email.toLowerCase(),
        passwordHash: await bcrypt.hash(tempPassword, 10),
        workspaces: [
          {
            workspaceId: new Types.ObjectId(workspaceId),
            role: (dto as any).role || UserRole.VIEWER,
            joinedAt: new Date(),
          },
        ],
        isActive: true,
      });
    } else {
      // Check if user is already a member
      const isMember = user.workspaces.some(
        (ws) => ws.workspaceId.toString() === workspaceId,
      );
      if (isMember) {
        throw new ConflictException('User is already a member of this workspace');
      }

      // Reset the user's password to the dummy one to allow first login
      user.passwordHash = await bcrypt.hash(tempPassword, 10);
      await user.save();

      // Add workspace to user
      await this.userModel.findByIdAndUpdate(user._id, {
        $addToSet: {
          workspaces: {
            workspaceId: new Types.ObjectId(workspaceId),
            role: (dto as any).role || UserRole.VIEWER,
          },
        },
      });
    }

    // Add user to workspace members
    await this.workspaceModel.findByIdAndUpdate(workspaceId, {
      $addToSet: {
        members: {
          userId: user._id,
          role: (dto as any).role || UserRole.VIEWER,
          joinedAt: new Date(),
          invitedBy: new Types.ObjectId(invitedBy),
        },
      },
    });

    return {
      user: {
        id: user._id,
        email: user.email,
        role: (dto as any).role || UserRole.VIEWER,
        tempPassword,
      },
    };
  }

  // Owned variants enforcing creator ownership
  async inviteUserOwned(workspaceId: string, dto: InviteUserDto, adminId: string, isAdmin: boolean) {
    await this.ensureOwned(workspaceId, adminId);
    return this.inviteUser(workspaceId, dto, adminId, isAdmin);
  }

  async listUsers(workspaceId: string) {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    
    return workspace.members.map(member => ({
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt
    }));
  }

  async listUsersOwned(workspaceId: string, adminId: string) {
    await this.ensureOwned(workspaceId, adminId);
    return this.listUsers(workspaceId);
  }

  async revokeWorkspaceAccess(userId: string, workspaceId: string) {
    // Remove user from workspace members
    await this.workspaceModel.updateOne(
      { _id: new Types.ObjectId(workspaceId) },
      { $pull: { members: { userId: new Types.ObjectId(userId) } } },
    );

    // Remove workspace from user's workspaces
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $pull: { workspaces: { workspaceId: new Types.ObjectId(workspaceId) } } },
    );

    return { success: true };
  }

  async revokeWorkspaceAccessOwned(userId: string, workspaceId: string, adminId: string) {
    await this.ensureOwned(workspaceId, adminId);
    return this.revokeWorkspaceAccess(userId, workspaceId);
  }
}
