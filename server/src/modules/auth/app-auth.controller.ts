import { Body, Controller, Post, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AppGuard } from '../../common/guards/app.guard';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Workspace, WorkspaceDocument } from '../workspace/schemas/workspace.schema';

@Controller('app/auth')
export class AppAuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password, false);

    if (!dto.workspaceId) {
      // Enrich user's workspaces with workspace names
      const workspaceIds = (user.workspaces || []).map((w: any) => w.workspaceId);
      const workspaces = await this.workspaceModel
        .find({ _id: { $in: workspaceIds } })
        .select('name')
        .lean();
      const nameById = new Map<string, string>(workspaces.map((w: any) => [w._id.toString(), w.name]));

      const enriched = (user.workspaces || []).map((w: any) => ({
        workspaceId: w.workspaceId.toString(),
        role: w.role,
        joinedAt: w.joinedAt,
        name: nameById.get(w.workspaceId.toString()) || 'Workspace',
      }));

      return {
        userId: user._id,
        email: user.email,
        workspaces: enriched,
      };
    }

    const loginResp = await this.authService.login(user, 'APP', dto.workspaceId);

    // Attach current workspace details
    const ws = await this.workspaceModel
      .findById(new Types.ObjectId(dto.workspaceId))
      .select('name')
      .lean();

    const userWs = (user.workspaces || []).find((w: any) => w.workspaceId.toString() === dto.workspaceId);

    return {
      ...loginResp,
      workspace: ws
        ? {
            workspaceId: dto.workspaceId,
            name: ws.name,
            role: userWs?.role,
            joinedAt: userWs?.joinedAt,
          }
        : undefined,
    };
  }

  @UseGuards(JwtAuthGuard, AppGuard)
  @Post('logout')
  async logout(@Req() req) {
    const payload = req.user as JwtPayload;
    if (!payload.jti) {
      throw new UnauthorizedException('Invalid token');
    }
    return this.authService.logout(payload.jti);
  }
}
