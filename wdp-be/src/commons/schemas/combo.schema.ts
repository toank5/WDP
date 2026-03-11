import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Combo status enum
 */
export enum ComboStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SCHEDULED = 'scheduled',
}

@Schema({ timestamps: true })
export class Combo extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  frameProductId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  lensProductId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  comboPrice: number;

  @Prop({ required: true, min: 0 })
  originalPrice: number;

  @Prop({ type: Number, default: 0 })
  discountAmount?: number;

  @Prop({ type: Number, default: 0 })
  discountPercentage?: number;

  @Prop({
    type: String,
    enum: ComboStatus,
    default: ComboStatus.ACTIVE,
  })
  status: ComboStatus;

  @Prop({ type: Date, default: null })
  startDate?: Date;

  @Prop({ type: Date, default: null })
  endDate?: Date;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  maxPurchaseQuantity?: number;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ default: false })
  isFeatured?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ComboSchema = SchemaFactory.createForClass(Combo);

// Indexes for efficient queries
ComboSchema.index({ frameProductId: 1, lensProductId: 1 }, { unique: true });
ComboSchema.index({ status: 1, startDate: 1, endDate: 1 });
ComboSchema.index({ isFeatured: 1, status: 1 });

// Pre-save hook to calculate discount
ComboSchema.pre('save', async function () {
  if ((this as any).originalPrice > 0 && (this as any).comboPrice >= 0) {
    (this as any).discountAmount = (this as any).originalPrice - (this as any).comboPrice;
    (this as any).discountPercentage = ((this as any).discountAmount / (this as any).originalPrice) * 100;
  }
});
