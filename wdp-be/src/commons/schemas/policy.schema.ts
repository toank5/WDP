import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { POLICY_TYPES } from '../enums/policy.enum';
import type { PolicyConfig } from '../types/policy.types';

export type PolicyDocument = HydratedDocument<Policy>;

@Schema({ timestamps: true })
export class Policy {
  _id?: string;

  @Prop({
    type: String,
    required: true,
    enum: [
      'return',
      'refund',
      'warranty',
      'shipping',
      'prescription',
      'cancellation',
      'privacy',
      'terms',
    ],
  })
  type: POLICY_TYPES;

  @Prop({ required: true })
  version: number;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, maxlength: 300 })
  summary: string;

  @Prop({ required: true })
  bodyPlainText: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  bodyRichTextJson?: Record<string, unknown>; // Rich text editor JSON output

  @Prop({ type: Object, required: true })
  config: PolicyConfig;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ required: true })
  effectiveFrom: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: MongooseSchema.Types.ObjectId;
}

export const PolicySchema = SchemaFactory.createForClass(Policy);

// Indexes for efficient querying
PolicySchema.index({ type: 1, isActive: 1, effectiveFrom: -1 });
PolicySchema.index({ type: 1, version: -1 });
