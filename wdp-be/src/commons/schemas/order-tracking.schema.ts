import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class OrderTracking {
  @Prop()
  carrier: string;

  @Prop()
  trackingNumber: string;

  @Prop({ type: Date })
  estimatedDelivery?: Date;

  @Prop({ type: Date })
  actualDelivery?: Date;
}

export const OrderTrackingSchema = SchemaFactory.createForClass(OrderTracking);
