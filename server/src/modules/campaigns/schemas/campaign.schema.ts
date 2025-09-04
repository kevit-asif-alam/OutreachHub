import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export enum CampaignStatus {
  DRAFT = 'draft',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export type CampaignDocument = Campaign & Document;

@Schema({ timestamps: true })
export class Campaign {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [String], default: [] })
  targetTags: string[];

  @Prop({ 
    type: String, 
    enum: Object.values(CampaignStatus),
    default: CampaignStatus.DRAFT 
  })
  status: CampaignStatus;

  @Prop({ type: Types.ObjectId, ref: 'MessageTemplate', required: true })
  templateId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspaceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  @Prop({ type: Date })
  launchedAt?: Date;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ type: Date })
  deletedAt?: Date;

  // Campaign statistics
  @Prop({ default: 0 })
  totalContacts: number;

  @Prop({ default: 0 })
  messagesSent: number;

  @Prop({ default: 0 })
  messagesDelivered: number;

  @Prop({ default: 0 })
  messagesFailed: number;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);

// Indexes for better performance
CampaignSchema.index({ workspaceId: 1 });
CampaignSchema.index({ status: 1 });
CampaignSchema.index({ targetTags: 1 });
CampaignSchema.index({ name: 'text', description: 'text' });
CampaignSchema.index({ launchedAt: 1 });

// Soft delete support
CampaignSchema.pre('find', function() {
  this.where({ deletedAt: null });
});

CampaignSchema.pre('findOne', function() {
  this.where({ deletedAt: null });
});

CampaignSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() });
});


