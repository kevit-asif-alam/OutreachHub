import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TokenDocument = Token & Document;

@Schema({ timestamps: true })
export class Token {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  jti: string;

  @Prop({ required: true })
  expiresAt: Date;

  // Optional workspace context for app tokens
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: false })
  workspaceId?: Types.ObjectId;

  @Prop({ default: false })
  revoked: boolean;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
