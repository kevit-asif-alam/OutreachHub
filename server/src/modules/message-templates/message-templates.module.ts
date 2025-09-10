import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { MessageTemplatesController } from './message-templates.controller';
import { MessageTemplatesService } from './message-templates.service';
import {
  MessageTemplate,
  MessageTemplateSchema,
} from './schemas/message-template.schema';
import { Token, TokenSchema } from '../auth/schemas/token.schema';

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: MessageTemplate.name, schema: MessageTemplateSchema },
      { name: Token.name, schema: TokenSchema },
    ]),
  ],
  controllers: [MessageTemplatesController],
  providers: [MessageTemplatesService],
  exports: [MessageTemplatesService],
})
export class MessageTemplatesModule {}
