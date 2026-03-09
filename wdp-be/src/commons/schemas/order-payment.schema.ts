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

  @Prop()
  bankCode?: string;

  @Prop()
  bankTransactionNo?: string;

  @Prop()
  cardType?: string;

  @Prop()
  txnRef?: string;

  @Prop()
  responseCode?: string;

  @Prop()
  vnpPayDate?: Date;
}

export const OrderPaymentSchema = SchemaFactory.createForClass(OrderPayment);
