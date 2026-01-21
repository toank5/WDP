import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema({ _id: false })
export class OrderItem {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  })
  productId: mongoose.ObjectId;

  @Prop()
  variantSku: string;

  @Prop()
  quantity: number;

  @Prop()
  priceAtOrder: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
