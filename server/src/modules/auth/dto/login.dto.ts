import { IsEmail, IsString, MinLength, IsOptional, IsMongoId } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsMongoId()
  workspaceId?: string;
}
