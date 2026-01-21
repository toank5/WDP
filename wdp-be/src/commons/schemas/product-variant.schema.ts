import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PRODUCT_VARIANT_TYPES } from '../enums/product.enum';
import { productValidation } from '../validations/product.validation';

@Schema({ _id: false })
export class ProductVariant {
  @Prop()
  sku: string;

  @Prop({
    type: String,
    enum: PRODUCT_VARIANT_TYPES,
    default: PRODUCT_VARIANT_TYPES.AVIATOR,
    required: true,
  })
  type: PRODUCT_VARIANT_TYPES;

  @Prop({
    type: String,
    required: productValidation.variants.size.presence,
    validate: {
      validator: productValidation.variants.size.validator,
      message: productValidation.variants.size.errorMsg,
    },
  })
  size: string;

  @Prop({
    type: String,
    required: productValidation.variants.color.presence,
    validate: {
      validator: productValidation.variants.color.validator,
      message: productValidation.variants.color.errorMsg,
    },
  })
  color: string;

  @Prop()
  images: string[];

  @Prop({
    type: Number,
    required: productValidation.variants.price.presence,
    validate: {
      validator: productValidation.variants.price.validator,
      message: productValidation.variants.price.errorMsg,
    },
  })
  price: number;

  @Prop({
    type: Number,
    required: productValidation.variants.weightInGrams.presence,
    validate: {
      validator: productValidation.variants.weightInGrams.validator,
      message: productValidation.variants.weightInGrams.errorMsg,
    },
  })
  weightInGrams: number;
}

export const ProductVariantSchema =
  SchemaFactory.createForClass(ProductVariant);
