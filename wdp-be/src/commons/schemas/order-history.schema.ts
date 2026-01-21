import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema({ _id: false })
export class OrderHistory {
  @Prop()
  status: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  })
  changedBy: mongoose.ObjectId;

  @Prop()
  timestamp: Date;

  @Prop()
  note: string;
}

export const OrderHistorySchema = SchemaFactory.createForClass(OrderHistory);
