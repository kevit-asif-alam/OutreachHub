import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkspaceDto {
  @ApiProperty({
    description: 'Name of the workspace',
    minLength: 3,
    maxLength: 50,
    example: 'Acme Corp',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'Description of the workspace',
    required: false,
    maxLength: 500,
    example: 'Workspace for Acme Corporation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
