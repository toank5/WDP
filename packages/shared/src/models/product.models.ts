/**
 * Product-related type definitions shared between frontend and backend
 */

import { PRODUCT_CATEGORIES, FRAME_TYPE, FRAME_SHAPE, FRAME_MATERIAL, FRAME_GENDER, BRIDGE_FIT, LENS_TYPE, SERVICE_TYPE } from '../enums/product.enums';

/**
 * Prescription Range
 */
export interface PrescriptionRange {
  minSPH?: number;
  maxSPH?: number;
  minCYL?: number;
  maxCYL?: number;
}

/**
 * Product Variant
 */
export interface ProductVariant {
  sku: string;
  size: string;
  color: string;
  price: number;
  weight?: number;
  images2D?: string[];
  images3D?: string[];
  isActive?: boolean;
  // Pre-order configuration
  isPreorderEnabled?: boolean;
  preorderExpectedShipStart?: string;
  preorderExpectedShipEnd?: string;
  preorderLimit?: number;
}

/**
 * Base Product fields
 */
export interface BaseProduct {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  images2D: string[];
  images3D?: string[];
  tags?: string[];
  category: PRODUCT_CATEGORIES;
  variants?: ProductVariant[];
  isActive?: boolean;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Frame Product
 */
export interface FrameProduct extends BaseProduct {
  category: PRODUCT_CATEGORIES.FRAMES;
  frameType: FRAME_TYPE;
  shape: FRAME_SHAPE;
  material: FRAME_MATERIAL;
  gender?: FRAME_GENDER;
  bridgeFit?: BRIDGE_FIT;
  variants: ProductVariant[];
}

/**
 * Lens Product
 */
export interface LensProduct extends BaseProduct {
  category: PRODUCT_CATEGORIES.LENSES;
  lensType: LENS_TYPE;
  index: number;
  coatings?: string[];
  suitableForPrescriptionRange?: PrescriptionRange;
  isPrescriptionRequired: boolean;
  variants?: ProductVariant[];
}

/**
 * Service Product
 */
export interface ServiceProduct extends BaseProduct {
  category: PRODUCT_CATEGORIES.SERVICES;
  serviceType: SERVICE_TYPE;
  durationMinutes: number;
  serviceNotes?: string;
}

/**
 * Union type for all products
 */
export type Product = FrameProduct | LensProduct | ServiceProduct;
