import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditAction = 'EDIT' | 'APPROVE' | 'REQUEST_UPDATE';

@Schema({ timestamps: true })
export class PrescriptionAuditLog {
  @Prop({ type: Types.ObjectId, required: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  orderItemId: Types.ObjectId;

  @Prop({ required: true })
  field: string;

  @Prop({ required: true })
  oldValue: string;

  @Prop({ required: true })
  newValue: string;

  @Prop({
    type: String,
    enum: ['EDIT', 'APPROVE', 'REQUEST_UPDATE'],
    required: true,
  })
  action: AuditAction;

  @Prop({ type: Types.ObjectId, required: true })
  staffId: Types.ObjectId;

  @Prop({ required: true })
  staffName: string;
}

export type PrescriptionAuditLogDocument = PrescriptionAuditLog & Document;

export const PrescriptionAuditLogSchema =
  SchemaFactory.createForClass(PrescriptionAuditLog);
