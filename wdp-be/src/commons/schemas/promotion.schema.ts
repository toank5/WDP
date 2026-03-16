import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Promotion type enum
 */
export enum PromotionType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
}

/**
 * Promotion status enum
 */
export enum PromotionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SCHEDULED = 'scheduled',
  EXPIRED = 'expired',
}

/**
 * Promotion scope enum - what the promotion applies to
 */
export enum PromotionScope {
  ALL_ORDERS = 'all_orders',
  SPECIFIC_CATEGORIES = 'specific_categories',
  SPECIFIC_PRODUCTS = 'specific_products',
  FIRST_ORDER = 'first_order',
}

@Schema({ timestamps: true })
export class Promotion extends Document {
  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({
    type: String,
    enum: PromotionType,
    required: true,
  })
  type: PromotionType;

  @Prop({ required: true, min: 0 })
  value: number;

  @Prop({ required: true, min: 0, default: 0 })
  minOrderValue: number;

  @Prop({
    type: String,
    enum: PromotionScope,
    default: PromotionScope.ALL_ORDERS,
  })
  scope: PromotionScope;

  @Prop({ type: [String], default: [] })
  applicableCategories?: string[];

  @Prop({ type: [String], default: [] })
  applicableProductIds?: string[];

  @Prop({ required: true, type: Date })
  startDate: Date;

  @Prop({ required: true, type: Date })
  endDate: Date;

  @Prop({
    type: Number,
    default: 0,
  })
  usageLimit?: number;

  @Prop({
    type: Number,
    default: 0,
  })
  usageCount?: number;

  @Prop({
    type: Number,
    default: 1,
    min: 1,
  })
  maxUsesPerCustomer?: number;

  @Prop({
    type: String,
    enum: PromotionStatus,
    default: PromotionStatus.ACTIVE,
  })
  status: PromotionStatus;

  @Prop({ default: false })
  isStackable?: boolean;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ default: false })
  isFeatured?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);

// Indexes for efficient queries
// Note: code field already has unique index from @Prop decorator
PromotionSchema.index({ status: 1, startDate: 1, endDate: 1 });
PromotionSchema.index({ isFeatured: 1, status: 1 });

// Pre-save hook to validate dates and set status
PromotionSchema.pre('save', async function (this: Promotion) {
  const now = new Date();

  if (this.endDate <= this.startDate) {
    throw new Error('End date must be after start date');
  }

  // Auto-update status based on dates
  if (this.status !== PromotionStatus.INACTIVE) {
    if (now < this.startDate) {
      this.status = PromotionStatus.SCHEDULED;
    } else if (now > this.endDate) {
      this.status = PromotionStatus.EXPIRED;
    } else {
      this.status = PromotionStatus.ACTIVE;
    }
  }
});
