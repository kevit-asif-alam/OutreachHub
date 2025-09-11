import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, UserDocument, UserRole, WorkspaceAccess } from './schemas/user.schema';
import { Token, TokenDocument } from './schemas/token.schema';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string, isAdminPortal: boolean) {
    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash');
      
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // For admin portal, user must be an admin
    if (isAdminPortal && !user.isAdmin) {
      throw new UnauthorizedException('Admin access required');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // Don't return password hash
    const { passwordHash, ...result } = user.toObject();
    return result;
  }

  private async signAndStore(user: UserDocument, portal: 'ADMIN' | 'APP', workspaceId?: string) {
    const jti = uuidv4();
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      isAdmin: !!user.isAdmin,
      portal,
      jti,
      workspaceId,
    };
    
    const expiresIn = '1h';
    const token = this.jwtService.sign(payload, { expiresIn });
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.tokenModel.create({ 
      userId: user._id, 
      jti, 
      expiresAt,
      workspaceId: workspaceId ? new Types.ObjectId(workspaceId) : undefined,
    });
    
    return { 
      accessToken: token, 
      expiresIn, 
      jti,
      user: {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        workspaces: user.workspaces,
      },
    };
  }

  async login(user: UserDocument | any, portal: 'ADMIN' | 'APP', workspaceId?: string) {
    // For app login, verify workspace access if workspaceId is provided
    if (portal === 'APP' && workspaceId) {
      const hasAccess = user.workspaces?.some(
        (ws: WorkspaceAccess) => ws.workspaceId.toString() === workspaceId
      );
      
      if (!hasAccess) {
        throw new UnauthorizedException('No access to the specified workspace');
      }
    } else if (portal === 'ADMIN' && !user.isAdmin) {
      throw new UnauthorizedException('Admin access required');
    }
    
    // Ensure we have a proper UserDocument
    const userDoc = user._id ? user : await this.userModel.findById(user.id || user._id);
    
    if (!userDoc) {
      throw new UnauthorizedException('User not found');
    }
    
    return this.signAndStore(userDoc, portal, workspaceId);
  }

  async register(email: string, password: string, isAdmin: boolean = false) {
    const existingUser = await this.userModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({
      email: email.toLowerCase(),
      passwordHash,
      isAdmin,
      isActive: true,
    });

    const { passwordHash: _, ...result } = user.toObject();
    return result;
  }

  async addToWorkspace(userId: string, workspaceId: string, role: UserRole = UserRole.VIEWER) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if user already has access to this workspace
    const existingAccess = user.workspaces.find(
      (ws: WorkspaceAccess) => ws.workspaceId.toString() === workspaceId
    );

    if (existingAccess) {
      throw new ConflictException('User already has access to this workspace');
    }

    user.workspaces.push({
      workspaceId: new Types.ObjectId(workspaceId) as any, // Cast to any to avoid type issues
      role,
      joinedAt: new Date()
    });

    await user.save();
    return user;
  }

  async revokeWorkspaceAccess(userId: string, workspaceId: string) {
    const result = await this.userModel.updateOne(
      { _id: userId },
      { $pull: { workspaces: { workspaceId: new Types.ObjectId(workspaceId) } } }
    );

    if (result.matchedCount === 0) {
      throw new BadRequestException('User not found');
    }

    // Revoke any active tokens for this user scoped to that workspace
    await this.tokenModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        workspaceId: new Types.ObjectId(workspaceId),
        revoked: { $ne: true },
        expiresAt: { $gt: new Date() },
      },
      { $set: { revoked: true, revokedAt: new Date() } as any },
    );

    return { success: true };
  }

  async logout(jti: string) {
    await this.tokenModel.findOneAndUpdate(
      { jti },
      { revoked: true, revokedAt: new Date() },
      { new: true }
    );
    return { success: true };
  }

  async loginAsAdmin(user: UserDocument) {
    return this.signAndStore(user, 'ADMIN');
  }

  async loginAsApp(user: UserDocument) {
    return this.signAndStore(user, 'APP');
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters long');
    }
    const user = await this.userModel.findById(userId).select('+passwordHash');
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    // Optionally revoke all tokens so they must login again; here we keep them active.
    return { success: true };
  }
}
