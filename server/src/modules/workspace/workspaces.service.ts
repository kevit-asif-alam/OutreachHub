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
    const session = await this.workspaceModel.db.startSession();
    session.startTransaction();

    try {
      // Create the workspace
      const workspace = await this.workspaceModel.create([{
        ...dto,
        members: [{
          userId: dto.createdBy,
          role: UserRole.EDITOR,
          joinedAt: new Date(),
        }]
      }], { session });

      // Add workspace to user's workspaces
      await this.userModel.findByIdAndUpdate(
        dto.createdBy,
        {
          $addToSet: {
            workspaces: {
              workspaceId: workspace[0]._id,
              role: UserRole.EDITOR,
            }
          }
        },
        { session }
      );

      await session.commitTransaction();
      return workspace[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async findAll() {
    return this.workspaceModel.find().lean();
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

  async remove(id: string) {
    const session = await this.workspaceModel.db.startSession();
    session.startTransaction();

    try {
      // Remove workspace from all users
      await this.userModel.updateMany(
        { 'workspaces.workspaceId': id },
        { $pull: { workspaces: { workspaceId: id } } },
        { session }
      );

      // Delete the workspace
      const result = await this.workspaceModel.findByIdAndDelete(id, { session });
      
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async inviteUser(workspaceId: string, dto: InviteUserDto, invitedBy: string) {
    const session = await this.workspaceModel.db.startSession();
    session.startTransaction();

    try {
      // Check if workspace exists and inviter has permission
      const workspace = await this.workspaceModel.findById(workspaceId).session(session);
      if (!workspace) {
        throw new NotFoundException('Workspace not found');
      }

      const isInviterAdmin = workspace.members.some(
        m => m.userId.toString() === invitedBy && m.role === UserRole.EDITOR
      );

      if (!isInviterAdmin) {
        throw new ForbiddenException('Insufficient permissions to invite users');
      }

      // Find or create user
      let user = await this.userModel
        .findOne({ email: dto.email.toLowerCase() })
        .session(session);

      let tempPassword: string | undefined;
      
      if (!user) {
        tempPassword = generateRandomPassword(12);
        user = await this.userModel.create([{
          email: dto.email.toLowerCase(),
          password: await bcrypt.hash(tempPassword, 10),
          workspaces: [{
            workspaceId: new Types.ObjectId(workspaceId),
            role: dto.role || UserRole.VIEWER,
          }]
        }], { session });
        user = user[0];
      } else {
        // Check if user is already a member
        const isMember = user.workspaces.some(
          ws => ws.workspaceId.toString() === workspaceId
        );

        if (isMember) {
          throw new ConflictException('User is already a member of this workspace');
        }

        // Add workspace to user
        await this.userModel.findByIdAndUpdate(
          user._id,
          {
            $addToSet: {
              workspaces: {
                workspaceId: new Types.ObjectId(workspaceId),
                role: dto.role || UserRole.VIEWER,
              }
            }
          },
          { session }
        );
      }

      // Add user to workspace members
      await this.workspaceModel.findByIdAndUpdate(
        workspaceId,
        {
          $addToSet: {
            members: {
              userId: user._id,
              role: dto.role || UserRole.VIEWER,
              joinedAt: new Date(),
              invitedBy: new Types.ObjectId(invitedBy),
            }
          }
        },
        { session }
      );

      await session.commitTransaction();
      
      return { 
        user: {
          id: user._id,
          email: user.email,
          role: dto.role || UserRole.VIEWER,
          tempPassword: tempPassword ? 'TEMPORARY_PASSWORD' : undefined,
        }
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
    const existing = await this.userModel.findOne({ workspaceId, userId: user._id });
    if (existing) return existing;
    return this.userModel.create({
      workspaceId,
      userId: user._id,
      role: dto.role,
    });
  }

  listUsers(workspaceId: string) {
    return this.userModel.find({ workspaceId }).populate('userId', 'email').lean();
  }
}
