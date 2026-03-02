import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Supplier status enum
 */
export enum SupplierStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Schema({ timestamps: true })
export class Supplier extends Document {
  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  email?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  taxCode?: string;

  @Prop({ trim: true, default: 'VND' })
  currency?: string;

  @Prop({ trim: true })
  addressLine1?: string;

  @Prop({ trim: true })
  addressLine2?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  state?: string;

  @Prop({ trim: true })
  postalCode?: string;

  @Prop({ trim: true })
  country?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }] })
  linkedProductIds?: Types.ObjectId[];

  @Prop({
    type: String,
    enum: SupplierStatus,
    default: SupplierStatus.ACTIVE
  })
  status: SupplierStatus;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);
