import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ _id: false })
export class EyePrescription {
  @Prop({ required: true })
  sph: number;

  @Prop({ required: true })
  cyl: number;

  @Prop({ required: true })
  axis: number;

  @Prop({ required: true })
  add: number;
}

export const EyePrescriptionSchema =
  SchemaFactory.createForClass(EyePrescription);

@Schema({ _id: false })
export class TypedPrescription {
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

  @Prop()
  notesFromCustomer?: string;
}

export const TypedPrescriptionSchema =
  SchemaFactory.createForClass(TypedPrescription);

@Schema()
export class CartItem {
  _id?: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  })
  productId: mongoose.Types.ObjectId;

  @Prop({
    type: String,
  })
  variantSku: string;

  @Prop({
    type: Number,
    required: true,
  })
  quantity: number;

  @Prop({
    type: Boolean,
    default: false,
  })
  requiresPrescription?: boolean;

  @Prop({
    type: TypedPrescriptionSchema,
    default: null,
  })
  typedPrescription?: TypedPrescription;

  @Prop({
    type: Date,
    default: Date.now,
  })
  addedAt: Date;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);
