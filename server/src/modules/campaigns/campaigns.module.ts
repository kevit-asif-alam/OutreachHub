import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { Campaign, CampaignSchema } from './schemas/campaign.schema';
import {
  CampaignMessage,
  CampaignMessageSchema,
} from './schemas/campaign-message.schema';
import { ContactsModule } from '../contacts/contacts.module';
import { MessageTemplatesModule } from '../message-templates/message-templates.module';
import { Token, TokenSchema } from '../auth/schemas/token.schema';

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
      { name: CampaignMessage.name, schema: CampaignMessageSchema },
      { name: Token.name, schema: TokenSchema },
    ]),
    ContactsModule,
    MessageTemplatesModule,
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
