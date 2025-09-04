import { IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator';
import { WorkspaceRole } from '../schemas/workspace-user.schema';

export class InviteUserDto {
  @IsEmail()
  email: string;

  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;

  @IsOptional()
  @MinLength(8)
  tempPassword?: string;
}
