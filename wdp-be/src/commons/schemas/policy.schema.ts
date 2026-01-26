import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { POLICY_TYPES } from '../enums/policy.enum';

@Schema({ timestamps: true })
export class Policy {
  @Prop({
    type: String,
    enum: POLICY_TYPES,
    required: true,
  })
  type: POLICY_TYPES;

  config: object;
}

export const PolicySchema = SchemaFactory.createForClass(Policy);
