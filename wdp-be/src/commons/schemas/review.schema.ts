import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  @ApiProperty({ description: 'Review ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'User ID who wrote the review' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Product ID being reviewed' })
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  productId: Types.ObjectId;

  @ApiProperty({ description: 'Order ID that verifies the purchase' })
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @ApiProperty({ description: 'Product variant SKU (if applicable)' })
  @Prop({ type: String })
  variantSku?: string;

  @ApiProperty({ description: 'Rating from 1 to 5 stars' })
  @Prop({ type: Number, required: true, min: 1, max: 5 })
  rating: number;

  @ApiProperty({ description: 'Review comment' })
  @Prop({ type: String, required: true, minlength: 10, maxlength: 1000 })
  comment: string;

  @ApiProperty({ description: 'Review title/headline' })
  @Prop({ type: String, maxlength: 200 })
  title?: string;

  @ApiProperty({ description: 'Array of image URLs' })
  @Prop({ type: [String], default: [] })
  images: string[];

  @ApiProperty({ description: 'Indicates if this is a verified purchase' })
  @Prop({ type: Boolean, default: true })
  isVerifiedPurchase: boolean;

  @ApiProperty({ description: 'Number of helpful votes' })
  @Prop({ type: Number, default: 0 })
  helpfulCount: number;

  @ApiProperty({ description: 'Is review visible (for moderation)' })
  @Prop({ type: Boolean, default: true })
  isVisible: boolean;

  @ApiProperty({ description: 'Review response from admin/staff' })
  @Prop({ type: String })
  response?: string;

  @ApiProperty({ description: 'Response date' })
  @Prop({ type: Date })
  responseDate?: Date;

  @ApiProperty({ description: 'User display name (cached for performance)' })
  @Prop({ type: String })
  userName?: string;

  @ApiProperty({ description: 'User avatar URL (cached for performance)' })
  @Prop({ type: String })
  userAvatar?: string;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;

  // Virtual property for populated fields
  user?: any;
  product?: any;
  order?: any;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Index for efficient queries
ReviewSchema.index({ userId: 1, productId: 1, orderId: 1 }, { unique: true });
ReviewSchema.index({ productId: 1, isVisible: 1, createdAt: -1 });
ReviewSchema.index({ rating: 1 });
