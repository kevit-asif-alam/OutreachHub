import { IsString, IsNotEmpty, IsOptional, IsArray, IsMongoId, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCampaignDto {
  @ApiProperty({
    description: 'Name of the campaign',
    minLength: 1,
    maxLength: 100,
    example: 'Summer Sale Campaign',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Description of the campaign',
    required: false,
    maxLength: 500,
    example: 'Campaign to promote summer sale to VIP customers',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Tags to target for this campaign',
    type: [String],
    example: ['vip', 'customer'],
  })
  @IsArray()
  @IsString({ each: true })
  targetTags: string[];

  @ApiProperty({
    description: 'ID of the message template to use',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  templateId: string;
}


