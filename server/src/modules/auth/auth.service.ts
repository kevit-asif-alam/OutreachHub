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

  async login(user: UserDocument, portal: 'ADMIN' | 'APP', workspaceId?: string) {
    // For app login, verify workspace access if workspaceId is provided
    if (portal === 'APP' && workspaceId) {
      const hasAccess = user.workspaces.some(
        (ws: WorkspaceAccess) => ws.workspaceId.toString() === workspaceId
      );
      
      if (!hasAccess) {
        throw new UnauthorizedException('No access to the specified workspace');
      }
    } else if (portal === 'ADMIN' && !user.isAdmin) {
      throw new UnauthorizedException('Admin access required');
    }

    return this.signAndStore(user, portal, workspaceId);
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
      workspaceId: new Types.ObjectId(workspaceId),
      role,
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

    return this.signAndStore(user, 'ADMIN');
  }

  async logout(jti: string) {
    await this.tokenModel.updateOne({ jti }, { revoked: true });
    return { message: 'Logged out successfully' };
  }

  async validateUser(email: string, password: string) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.userModel.findOne({ email: normalizedEmail });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // If user was created by admin with default password, it will be set.
    const valid =
      user.passwordHash && (await bcrypt.compare(password, user.passwordHash));
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  async loginAsApp(user: UserDocument) {
    return this.signAndStore(user, 'APP');
  }
}
