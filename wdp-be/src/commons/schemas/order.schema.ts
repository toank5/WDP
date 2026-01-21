import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { ORDER_STATUS, ORDER_TYPES } from '../enums/order.enum';
import { OrderItem, OrderItemSchema } from './order-item.schema';
import { orderValidation } from '../validations/order.validation';
import { OrderPayment, OrderPaymentSchema } from './order-payment.schema';
import { OrderTracking, OrderTrackingSchema } from './order-tracking.schema';
import { OrderHistory, OrderHistorySchema } from './order-history.schema';

@Schema({ timestamps: true })
export class Order {
  @Prop({
    type: String,
    required: orderValidation.number.presence,
    unique: orderValidation.number.uniqueness,
    validate: {
      validator: orderValidation.number.validator,
      message: orderValidation.number.errorMsg,
    },
  })
  orderNumber: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
  })
  customerId: mongoose.ObjectId;

  @Prop({
    type: String,
    enum: ORDER_TYPES,
    default: ORDER_TYPES.READY,
    required: orderValidation.type.presence,
    validate: {
      validator: orderValidation.type.validator,
      message: orderValidation.type.errorMsg,
    },
  })
  orderType: ORDER_TYPES;

  @Prop({
    type: String,
    enum: ORDER_STATUS,
    default: ORDER_STATUS.PENDING,
    required: orderValidation.status.presence,
    validate: {
      validator: orderValidation.status.validator,
      message: orderValidation.status.errorMsg,
    },
  })
  orderStatus: ORDER_STATUS;

  @Prop({
    type: [OrderItemSchema],
    default: [],
  })
  items: OrderItem[];

  @Prop({
    type: Number,
    required: true,
  })
  totalAmount: number;

  @Prop({
    type: Object,
    required: true,
  })
  shippingAddress: Object;

  @Prop({
    type: OrderPaymentSchema,
    default: null,
  })
  payment: OrderPayment;

  @Prop({
    type: OrderTrackingSchema,
    default: null,
  })
  tracking: OrderTracking;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  })
  assignedStaffId: mongoose.ObjectId;

  @Prop({
    type: String,
    default: '',
  })
  notes: string;

  @Prop({
    type: [OrderHistorySchema],
    default: [],
  })
  history: OrderHistory[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);
