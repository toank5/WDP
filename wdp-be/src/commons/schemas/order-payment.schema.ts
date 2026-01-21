import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class OrderPayment {
  @Prop()
  method: string;

  @Prop()
  amount: number;

  @Prop()
  transactionId: string;

  @Prop()
  paidAt: Date;
}

export const OrderPaymentSchema = SchemaFactory.createForClass(OrderPayment);
