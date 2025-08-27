import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum UserRole {
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export interface WorkspaceAccess {
  workspaceId: MongooseSchema.Types.ObjectId;
  role: UserRole;
}

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ default: false })
  isAdmin: boolean;

  @Prop({
    type: [{
      workspaceId: { type: MongooseSchema.Types.ObjectId, ref: 'Workspace' },
      role: { type: String, enum: Object.values(UserRole), default: UserRole.VIEWER },
    }],
    default: [],
    _id: false,
  })
  workspaces: WorkspaceAccess[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLogin?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 }, { unique: true });

