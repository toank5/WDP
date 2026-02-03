import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';
import {
  PRODUCT_CATEGORIES,
  FRAME_TYPE,
  FRAME_SHAPE,
  FRAME_MATERIAL,
  FRAME_GENDER,
  BRIDGE_FIT,
  LENS_TYPE,
  SERVICE_TYPE,
} from '../enums/product.enum';
import { ProductVariant, ProductVariantSchema } from './product-variant.schema';

// Prescription range sub-schema
@Schema({ _id: false })
export class PrescriptionRange {
  @Prop({ type: Number })
  minSPH?: number;

  @Prop({ type: Number })
  maxSPH?: number;

  @Prop({ type: Number })
  minCYL?: number;

  @Prop({ type: Number })
  maxCYL?: number;
}

export const PrescriptionRangeSchema =
  SchemaFactory.createForClass(PrescriptionRange);

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({
    type: String,
    required: true,
    minlength: 3,
    maxlength: 200,
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
    unique: true,
    lowercase: true,
    sparse: true,
    index: true,
  })
  slug?: string;

  @Prop({
    type: String,
    enum: Object.values(PRODUCT_CATEGORIES),
    required: true,
    index: true,
  })
  category: PRODUCT_CATEGORIES;

  @Prop({
    type: String,
    required: true,
    maxlength: 2000,
    trim: true,
  })
  description: string;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  basePrice: number;

  @Prop({
    type: [String],
    default: [],
  })
  images2D: string[];

  @Prop({
    type: [String],
    default: [],
  })
  images3D: string[];

  @Prop({
    type: [String],
    default: [],
    lowercase: true,
  })
  tags: string[];

  @Prop({
    type: Boolean,
    default: true,
    index: true,
  })
  isActive: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  isDeleted: boolean;

  // Frame-specific fields
  @Prop({
    type: String,
    enum: Object.values(FRAME_TYPE),
  })
  frameType?: FRAME_TYPE;

  @Prop({
    type: String,
    enum: Object.values(FRAME_SHAPE),
    index: true,
  })
  shape?: FRAME_SHAPE;

  @Prop({
    type: String,
    enum: Object.values(FRAME_MATERIAL),
    index: true,
  })
  material?: FRAME_MATERIAL;

  @Prop({
    type: String,
    enum: Object.values(FRAME_GENDER),
  })
  gender?: FRAME_GENDER;

  @Prop({
    type: String,
    enum: Object.values(BRIDGE_FIT),
  })
  bridgeFit?: BRIDGE_FIT;

  @Prop({ type: [ProductVariantSchema], default: [] })
  variants: ProductVariant[];

  // Lens-specific fields
  @Prop({
    type: String,
    enum: Object.values(LENS_TYPE),
    index: true,
  })
  lensType?: LENS_TYPE;

  @Prop({
    type: Number,
    min: 1.5,
    max: 2.0,
  })
  index?: number;

  @Prop({
    type: [String],
    default: [],
    lowercase: true,
  })
  coatings?: string[];

  @Prop({ type: PrescriptionRangeSchema })
  suitableForPrescriptionRange?: PrescriptionRange;

  @Prop({
    type: Boolean,
    default: false,
  })
  isPrescriptionRequired?: boolean;

  // Service-specific fields
  @Prop({
    type: String,
    enum: Object.values(SERVICE_TYPE),
    index: true,
  })
  serviceType?: SERVICE_TYPE;

  @Prop({
    type: Number,
    min: 1,
  })
  durationMinutes?: number;

  @Prop({
    type: String,
    maxlength: 1000,
  })
  serviceNotes?: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Indexes for search and filtering
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ shape: 1, material: 1 });
ProductSchema.index({ 'variants.sku': 1 }, { sparse: true });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ lensType: 1 });
ProductSchema.index({ serviceType: 1 });

// Pre-save hook to generate slug if missing
ProductSchema.pre('save', async function () {
  if (!this.slug) {
    let baseSlug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]/g, '')
      .replace(/\-+/g, '-');

    let slug = baseSlug;
    const existingProduct = await (this.constructor as Model<Product>).findOne({
      slug,
    });
    if (existingProduct) {
      const timestamp = Date.now().toString().slice(-6);
      slug = `${baseSlug}-${timestamp}`;
    }
    this.slug = slug;
  }
});
