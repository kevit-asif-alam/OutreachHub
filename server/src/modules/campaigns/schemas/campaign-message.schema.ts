import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export type CampaignMessageDocument = CampaignMessage & Document;

@Schema({ timestamps: true })
export class CampaignMessage {
  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: true })
  campaignId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Contact', required: true })
  contactId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'MessageTemplate', required: true })
  templateId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspaceId: Types.ObjectId;

  // Store the actual message content at the time of sending
  @Prop({ required: true })
  messageContent: string;

  @Prop({ trim: true })
  imageUrl?: string;

  @Prop({ 
    type: String, 
    enum: Object.values(MessageStatus),
    default: MessageStatus.PENDING 
  })
  status: MessageStatus;

  @Prop({ type: Date })
  sentAt?: Date;

  @Prop({ type: Date })
  deliveredAt?: Date;

  @Prop({ trim: true })
  failureReason?: string;

  // Store contact details at the time of sending
  @Prop({ required: true })
  contactPhoneNumber: string;

  @Prop({ required: true })
  contactFirstName: string;

  @Prop({ required: true })
  contactLastName: string;

  @Prop({ trim: true })
  contactEmail?: string;

  // Store template details at the time of sending
  @Prop({ required: true })
  templateName: string;

  @Prop({ required: true })
  templateType: string;
}

export const CampaignMessageSchema = SchemaFactory.createForClass(CampaignMessage);

// Indexes for better performance
CampaignMessageSchema.index({ campaignId: 1 });
CampaignMessageSchema.index({ contactId: 1 });
CampaignMessageSchema.index({ workspaceId: 1 });
CampaignMessageSchema.index({ status: 1 });
CampaignMessageSchema.index({ sentAt: 1 });
CampaignMessageSchema.index({ campaignId: 1, status: 1 });


