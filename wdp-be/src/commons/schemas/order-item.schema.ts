import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { PREORDER_STATUS } from '../enums/preorder.enum';
import { PRESCRIPTION_STATUS } from '../enums/order.enum';
import { OrderPrescriptionSchema } from './order-prescription.schema';

@Schema({ _id: false })
export class OrderItem {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  })
  productId: mongoose.Types.ObjectId;

  @Prop()
  variantSku: string;

  @Prop()
  quantity: number;

  @Prop()
  priceAtOrder: number;

  // Pre-order fields
  @Prop({
    type: Boolean,
    default: false,
  })
  isPreorder: boolean;

  @Prop({
    type: String,
    enum: PREORDER_STATUS,
    default: null,
  })
  preorderStatus?: PREORDER_STATUS;

  @Prop({
    type: Date,
    default: null,
  })
  expectedShipDate?: Date;

  @Prop({
    type: Number,
    default: 0,
  })
  reservedQuantity?: number; // How much has been reserved from incoming stock

  // Prescription fields
  @Prop({
    type: Boolean,
    default: false,
  })
  isPrescription: boolean;

  @Prop({
    type: String,
    enum: PRESCRIPTION_STATUS,
    default: null,
  })
  prescriptionStatus?: PRESCRIPTION_STATUS;

  @Prop({
    type: OrderPrescriptionSchema,
    default: null,
  })
  prescriptionData?: {
    pd: number;
    sph: { right: number; left: number };
    cyl: { right: number; left: number };
    axis: { right: number; left: number };
    add: { right: number; left: number };
  };

  @Prop({
    type: String,
    default: null,
  })
  prescriptionUrl?: string; // URL to uploaded prescription image
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
