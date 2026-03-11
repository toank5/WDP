import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

export const PrescriptionEyeDataSchema = new MongooseSchema(
  {
    sph: { type: Number, required: false },
    cyl: { type: Number, required: false },
    axis: { type: Number, required: false },
    add: { type: Number, required: false },
  },
  { _id: false },
);

export const PrescriptionPDSchema = new MongooseSchema(
  {
    left: { type: Number, required: false },
    right: { type: Number, required: false },
    total: { type: Number, required: false },
  },
  { _id: false },
);

@Schema({ timestamps: true })
export class Prescription {
  _id: string;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Date, required: false })
  prescriptionDate?: Date;

  @Prop({
    type: PrescriptionEyeDataSchema,
    required: false,
    default: null,
  })
  rightEye?: {
    sph?: number;
    cyl?: number;
    axis?: number;
    add?: number;
  };

  @Prop({
    type: PrescriptionEyeDataSchema,
    required: false,
    default: null,
  })
  leftEye?: {
    sph?: number;
    cyl?: number;
    axis?: number;
    add?: number;
  };

  @Prop({
    type: PrescriptionPDSchema,
    required: false,
    default: null,
  })
  pd?: {
    left?: number;
    right?: number;
    total?: number;
  };

  @Prop({ type: String, required: false })
  imageUrl?: string;

  @Prop({ type: Boolean, default: false })
  isVerified: boolean;

  @Prop({ type: Date, default: null })
  verifiedAt?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  verifiedBy?: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, default: null })
  verificationNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const PrescriptionSchema = SchemaFactory.createForClass(Prescription);
