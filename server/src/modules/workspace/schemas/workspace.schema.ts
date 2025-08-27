import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { UserRole } from '../../auth/schemas/user.schema';

export type WorkspaceDocument = Workspace & Document;

class WorkspaceMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: Object.values(UserRole),
    default: UserRole.VIEWER 
  })
  role: UserRole;

  @Prop({ type: Date, default: Date.now })
  joinedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  invitedBy?: Types.ObjectId;
}

@Schema({ 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true } 
})
export class Workspace {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [WorkspaceMember], default: [] })
  members: WorkspaceMember[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  updatedBy: Types.ObjectId[];

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);

// Index for faster lookups
WorkspaceSchema.index({ 'members.userId': 1 });
WorkspaceSchema.index({ 'members.role': 1 });
WorkspaceSchema.index({ name: 'text', description: 'text' });

// Soft delete support
WorkspaceSchema.pre('find', function() {
  this.where({ deletedAt: null });
});

WorkspaceSchema.pre('findOne', function() {
  this.where({ deletedAt: null });
});

WorkspaceSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() });
});
