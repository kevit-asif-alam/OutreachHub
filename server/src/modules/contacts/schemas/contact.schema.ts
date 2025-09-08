import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type ContactDocument = Contact & Document;

@Schema({ timestamps: true })
export class Contact {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, trim: true })
  phoneNumber: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspaceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);

// Indexes for better performance
ContactSchema.index({ phoneNumber: 1, workspaceId: 1 }, { unique: true });
ContactSchema.index({ workspaceId: 1 });
ContactSchema.index({ tags: 1 });
ContactSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

// Soft delete support
ContactSchema.pre('find', function() {
  this.where({ deletedAt: null });
});

ContactSchema.pre('findOne', function() {
  this.where({ deletedAt: null });
});

ContactSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() });
});


