import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { LAB_JOB_STATUS } from '@eyewear/shared';
import { EyePrescription, EyePrescriptionSchema } from './cart-item.schema';

@Schema({ timestamps: true })
export class WorkOrder {
  _id?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true })
  orderId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  orderItemId: string;

  @Prop({ type: EyePrescriptionSchema, required: true })
  rightEye: EyePrescription;

  @Prop({ type: EyePrescriptionSchema, required: true })
  leftEye: EyePrescription;

  @Prop()
  pd?: number;

  @Prop()
  pdRight?: number;

  @Prop()
  pdLeft?: number;

  @Prop({ default: 'STANDARD' })
  lensType: string;

  @Prop({ type: String, enum: LAB_JOB_STATUS, default: LAB_JOB_STATUS.PENDING })
  status: LAB_JOB_STATUS;

  @Prop()
  notes?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const WorkOrderSchema = SchemaFactory.createForClass(WorkOrder);
