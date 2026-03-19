import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { ORDER_STATUS, ORDER_TYPES } from '@eyewear/shared';
import { OrderItem, OrderItemSchema } from './order-item.schema';
import { orderValidation } from '../validations/order.validation';
import { OrderPayment, OrderPaymentSchema } from './order-payment.schema';
import { OrderTracking, OrderTrackingSchema } from './order-tracking.schema';
import { OrderHistory, OrderHistorySchema } from './order-history.schema';

@Schema({ timestamps: true })
export class Order {
  _id?: string;

  @Prop({
    type: String,
    required: orderValidation.number.presence,
    unique: orderValidation.number.uniqueness,
    validate: {
      validator: function (this: void, value: string) {
        return orderValidation.number.validator(value);
      },
      message: orderValidation.number.errorMsg,
    },
  })
  orderNumber: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
  })
  customerId: mongoose.Types.ObjectId;

  @Prop({
    type: String,
    enum: ORDER_TYPES,
    default: ORDER_TYPES.READY,
    required: orderValidation.type.presence,
    validate: {
      validator: function (this: void, value: string) {
        return orderValidation.type.validator(value);
      },
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
      validator: function (this: void, value: string) {
        return orderValidation.status.validator(value);
      },
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
    type: Number,
    default: 0,
  })
  subtotal: number;

  @Prop({
    type: Number,
    default: 0,
  })
  shippingFee: number;

  @Prop({
    type: Number,
    default: 0,
  })
  tax: number;

  @Prop({
    type: Number,
    default: 0,
  })
  prescriptionLensFeeTotal: number;

  @Prop({
    type: Number,
    default: 0,
  })
  comboDiscount: number;

  @Prop({
    type: String,
    default: null,
  })
  comboId?: string;

  @Prop({
    type: Number,
    default: 0,
  })
  promotionDiscount: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Promotion',
    default: null,
  })
  promotionId?: mongoose.Types.ObjectId;

  @Prop({
    type: String,
    default: null,
  })
  promotionCode?: string;

  @Prop({
    type: Object,
    required: true,
  })
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    ward?: string;
    zipCode?: string;
  };

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
  assignedStaffId: mongoose.Types.ObjectId;

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

  createdAt?: Date;
  updatedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
