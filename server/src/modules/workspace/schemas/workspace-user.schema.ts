import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WorkspaceUserDocument = WorkspaceUser & Document;

export enum WorkspaceRole {
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

@Schema({ timestamps: true })
export class WorkspaceUser {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ enum: WorkspaceRole, required: true })
  role: WorkspaceRole;
}

export const WorkspaceUserSchema = SchemaFactory.createForClass(WorkspaceUser);
WorkspaceUserSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
