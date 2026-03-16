import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { PREORDER_STATUS } from '@eyewear/shared';

@Schema({ _id: false })
export class OrderItem {
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
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
