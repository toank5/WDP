import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import {
  PREORDER_STATUS,
  PRESCRIPTION_REVIEW_STATUS,
} from '@eyewear/shared';
import {
  TypedPrescription,
  TypedPrescriptionSchema,
} from './cart-item.schema';

@Schema({ _id: false })
export class OrderItem {
  @Prop({
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
  })
  itemId?: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  })
  productId: mongoose.Types.ObjectId;

  @Prop()
  variantSku?: string;

  @Prop()
  quantity: number;

  @Prop()
  priceAtOrder: number;

  // Pre-order fields
  @Prop({
    type: Boolean,
    default: false,
  })
  isPreorder: boolean;

  @Prop({
    type: String,
    enum: PREORDER_STATUS,
    default: null,
  })
  preorderStatus?: PREORDER_STATUS;

  @Prop({
    type: Date,
    default: null,
  })
  expectedShipDate?: Date;

  @Prop({
    type: Number,
    default: 0,
  })
  reservedQuantity?: number; // How much has been reserved from incoming stock

  // Manufacturing proof fields (for the actual glasses being made)
  @Prop({
    type: String,
    default: null,
  })
  manufacturingProofUrl?: string;

  @Prop({
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
  })
  manufacturingStatus?: 'PENDING' | 'COMPLETED' | 'FAILED';

  @Prop({
    type: Date,
    default: null,
  })
  manufacturedAt?: Date;

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
    type: String,
    enum: PRESCRIPTION_REVIEW_STATUS,
    default: null,
  })
  prescriptionReviewStatus?: PRESCRIPTION_REVIEW_STATUS;

  @Prop({
    type: String,
    default: null,
  })
  prescriptionReviewNote?: string;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
