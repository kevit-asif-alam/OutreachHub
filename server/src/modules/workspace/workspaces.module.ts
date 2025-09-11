import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { Workspace, WorkspaceSchema } from './schemas/workspace.schema';
import { WorkspaceUser, WorkspaceUserSchema } from './schemas/workspace-user.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Token, TokenSchema } from '../auth/schemas/token.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: WorkspaceUser.name, schema: WorkspaceUserSchema },
      { name: User.name, schema: UserSchema },
      { name: Token.name, schema: TokenSchema },
    ]),
  ],
  controllers: [WorkspacesController],
  providers: [
    WorkspacesService,
    JwtService,
  ],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
