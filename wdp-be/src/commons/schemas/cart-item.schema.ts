import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ _id: false })
export class CartItem {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  })
  productId: mongoose.ObjectId;

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
    type: Date,
    default: Date.now,
  })
  addedAt: Date;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);
