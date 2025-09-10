import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Campaign, CampaignSchema } from '../campaigns/schemas/campaign.schema';
import {
  CampaignMessage,
  CampaignMessageSchema,
} from '../campaigns/schemas/campaign-message.schema';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { Token, TokenSchema } from '../auth/schemas/token.schema';

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
      { name: CampaignMessage.name, schema: CampaignMessageSchema },
      { name: Contact.name, schema: ContactSchema },
      { name: Token.name, schema: TokenSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
