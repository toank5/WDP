import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { POLICY_TYPES, PolicyType } from '../enums/policy.enum';

export type PolicyDocument = HydratedDocument<Policy>;

@Schema({ timestamps: true })
export class Policy {
  @Prop({
    type: String,
    required: true,
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
  bodyRichTextJson: any;

  @Prop({ type: Object, required: true })
  config: Record<string, any>;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ required: true })
  effectiveFrom: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: MongooseSchema.Types.ObjectId;
}

export const PolicySchema = SchemaFactory.createForClass(Policy);

// Indexes
PolicySchema.index({ type: 1, isActive: 1, effectiveFrom: -1 });
