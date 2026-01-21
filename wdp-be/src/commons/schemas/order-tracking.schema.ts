import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class OrderTracking {
  @Prop()
  carrier: string;

  @Prop()
  trackingNumber: string;
}

export const OrderTrackingSchema = SchemaFactory.createForClass(OrderTracking);
