/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { z } from 'zod';
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

const variantSchema = z.object({
  sku: z
    .string()
    .min(3, 'SKU must be at least 3 characters')
    .max(50, 'SKU must not exceed 50 characters')
    .toUpperCase(),
  size: z
    .string()
    .min(1, 'Size is required')
    .max(50, 'Size must not exceed 50 characters'),
  color: z
    .string()
    .min(1, 'Color is required')
    .max(50, 'Color must not exceed 50 characters')
    .toLowerCase(),
  price: z.number().positive('Price must be greater than 0'),
  weight: z.number().nonnegative('Weight must be non-negative').optional(),
  images2D: z.array(z.string().url()).optional(),
  images3D: z.array(z.string().url()).optional(),
  isActive: z.boolean().optional().default(true),
});

// Prescription range schema
const prescriptionRangeSchema = z
  .object({
    minSPH: z.number().optional(),
    maxSPH: z.number().optional(),
    minCYL: z.number().optional(),
    maxCYL: z.number().optional(),
  })
  .optional();

// Base product schema (common fields)
const baseProductSchema = z.object({
  name: z
    .string()
    .min(3, 'Product name must be at least 3 characters')
    .max(200, 'Product name must not exceed 200 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  basePrice: z.number().positive('Base price must be greater than 0'),
  images2D: z
    .array(z.string().url('Invalid image URL'))
    .min(1, 'At least one 2D image is required'),
  images3D: z.array(z.string().url('Invalid 3D model URL')).optional(),
  tags: z.array(z.string().max(50)).optional().default([]),
});

// Frame product schema
export const createFrameProductSchema = baseProductSchema.extend({
  category: z.literal(PRODUCT_CATEGORIES.FRAMES),
  frameType: z.nativeEnum(FRAME_TYPE),
  shape: z.nativeEnum(FRAME_SHAPE),
  material: z.nativeEnum(FRAME_MATERIAL),
  gender: z.nativeEnum(FRAME_GENDER).optional(),
  bridgeFit: z.nativeEnum(BRIDGE_FIT).optional(),
  variants: z
    .array(variantSchema)
    .min(1, 'At least one variant is required')
    .max(50, 'Maximum 50 variants allowed per product'),
});

// Lens product schema
export const createLensProductSchema = baseProductSchema.extend({
  category: z.literal(PRODUCT_CATEGORIES.LENSES),
  lensType: z.nativeEnum(LENS_TYPE),
  index: z
    .number()
    .min(1.5, 'Lens index must be at least 1.5')
    .max(2.0, 'Lens index must not exceed 2.0'),
  coatings: z.array(z.string().max(50)).optional().default([]),
  suitableForPrescriptionRange: prescriptionRangeSchema,
  isPrescriptionRequired: z.boolean(),
  variants: z.array(variantSchema).optional(),
});

// Service product schema
export const createServiceProductSchema = baseProductSchema.extend({
  category: z.literal(PRODUCT_CATEGORIES.SERVICES),
  serviceType: z.nativeEnum(SERVICE_TYPE),
  durationMinutes: z
    .number()
    .int('Duration must be an integer')
    .positive('Duration must be greater than 0'),
  serviceNotes: z.string().max(1000).optional(),
});

// Generic create product schema (discriminated union)
export const createProductSchema = z.discriminatedUnion('category', [
  createFrameProductSchema,
  createLensProductSchema,
  createServiceProductSchema,
]);

// Update product schema
export const updateProductSchema = z.object({
  name: z
    .string()
    .min(3, 'Product name must be at least 3 characters')
    .max(200, 'Product name must not exceed 200 characters')
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must not exceed 2000 characters')
    .optional(),
  basePrice: z
    .number()
    .positive('Base price must be greater than 0')
    .optional(),
  images2D: z.array(z.string().url('Invalid image URL')).optional(),
  images3D: z.array(z.string().url('Invalid 3D model URL')).optional(),
  tags: z.array(z.string().max(50)).optional(),
  isActive: z.boolean().optional(),
  variants: z
    .array(variantSchema)
    .max(50, 'Maximum 50 variants allowed per product')
    .optional(),
  frameType: z.nativeEnum(FRAME_TYPE).optional(),
  shape: z.nativeEnum(FRAME_SHAPE).optional(),
  material: z.nativeEnum(FRAME_MATERIAL).optional(),
  gender: z.nativeEnum(FRAME_GENDER).optional(),
  bridgeFit: z.nativeEnum(BRIDGE_FIT).optional(),
  lensType: z.nativeEnum(LENS_TYPE).optional(),
  index: z.number().min(1.5).max(2.0).optional(),
  coatings: z.array(z.string().max(50)).optional(),
  suitableForPrescriptionRange: prescriptionRangeSchema,
  isPrescriptionRequired: z.boolean().optional(),
  serviceType: z.nativeEnum(SERVICE_TYPE).optional(),
  durationMinutes: z.number().int().positive().optional(),
  serviceNotes: z.string().max(1000).optional(),
});

// Types for TypeScript
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
