import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false, timestamps: true })
export class ProductVariant extends Document {
  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
  })
  sku: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  size: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  })
  color: string;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  price: number;

  @Prop({
    type: Number,
    min: 0,
  })
  weight?: number;

  @Prop({
    type: [String],
    default: [],
  })
  images2D?: string[];

  @Prop({
    type: [String],
    default: [],
  })
  images3D?: string[];

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt?: Date;
}

export const ProductVariantSchema =
  SchemaFactory.createForClass(ProductVariant);
