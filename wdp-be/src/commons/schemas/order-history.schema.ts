import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { ORDER_STATUS } from '../../shared';

@Schema({ _id: false })
export class OrderHistory {
  @Prop({
    type: String,
    enum: ORDER_STATUS,
  })
  status: ORDER_STATUS;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  })
  changedBy?: mongoose.Types.ObjectId;

  @Prop()
  timestamp: Date;

  @Prop()
  note: string;
}

export const OrderHistorySchema = SchemaFactory.createForClass(OrderHistory);
