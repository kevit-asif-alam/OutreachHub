import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUrl, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageTemplateType } from '../schemas/message-template.schema';

export class CreateMessageTemplateDto {
  @ApiProperty({
    description: 'Name of the message template',
    minLength: 1,
    maxLength: 100,
    example: 'Welcome Message',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Content of the message template',
    minLength: 1,
    maxLength: 1000,
    example: 'Hello {{firstName}}, welcome to our service!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  content: string;

  @ApiProperty({
    description: 'Type of the message template',
    enum: MessageTemplateType,
    example: MessageTemplateType.TEXT,
  })
  @IsEnum(MessageTemplateType)
  type: MessageTemplateType;

  @ApiProperty({
    description: 'Image URL for text and image templates',
    required: false,
    example: 'https://example.com/image.jpg',
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}


