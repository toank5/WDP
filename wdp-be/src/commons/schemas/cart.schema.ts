import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { CartItem, CartItemSchema } from './cart-item.schema';

@Schema({ timestamps: true })
export class Cart {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  })
  customerId: mongoose.ObjectId;

  @Prop({
    type: [CartItemSchema],
    default: [],
  })
  items: CartItem[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);
