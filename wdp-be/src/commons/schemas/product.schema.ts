import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PRODUCT_CATEGORIES } from '../enums/product.enum';
import { ProductVariant, ProductVariantSchema } from './product-variant.schema';
import { productValidation } from '../validations/product.validation';

@Schema({ timestamps: true })
export class Product {
  @Prop({
    type: String,
    required: productValidation.name.presence,
    minLength: productValidation.name.length.min,
    maxLength: productValidation.name.length.max,
  })
  name: string;

  @Prop({
    type: String,
    enum: PRODUCT_CATEGORIES,
    default: PRODUCT_CATEGORIES.SERVICES,
    required: productValidation.category.presence,
  })
  category: PRODUCT_CATEGORIES;

  @Prop({
    type: String,
    required: productValidation.description.presence,
    minLength: productValidation.description.length.min,
    maxLength: productValidation.description.length.max,
  })
  description: string;

  @Prop({
    type: Number,
    required: productValidation.basePrice.presence,
  })
  basePrice: number;

  @Prop({ type: [ProductVariantSchema], default: [] })
  variants: ProductVariant[];

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  isDeleted: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
