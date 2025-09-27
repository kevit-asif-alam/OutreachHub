import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export enum MessageTemplateType {
  TEXT = 'text',
  TEXT_AND_IMAGE = 'text_and_image',
}

export type MessageTemplateDocument = MessageTemplate & Document;

@Schema({ timestamps: true })
export class MessageTemplate {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ 
    type: String, 
    enum: Object.values(MessageTemplateType),
    default: MessageTemplateType.TEXT 
  })
  type: MessageTemplateType;

  @Prop({ trim: true })
  imageUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspaceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const MessageTemplateSchema = SchemaFactory.createForClass(MessageTemplate);

// Indexes for better performance
MessageTemplateSchema.index({ workspaceId: 1 });
MessageTemplateSchema.index({ name: 'text', content: 'text' });
MessageTemplateSchema.index({ type: 1 });

// Soft delete support
MessageTemplateSchema.pre('find', function() {
  this.where({ deletedAt: null });
});

MessageTemplateSchema.pre('findOne', function() {
  this.where({ deletedAt: null });
});

MessageTemplateSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() });
});
