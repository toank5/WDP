import {
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
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

export class ProductVariantDto {
  @IsString()
  @MinLength(3)
  sku: string;

  @IsString()
  size: string;

  @IsString()
  color: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsArray()
  images2D?: string[];

  @IsOptional()
  @IsArray()
  images3D?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PrescriptionRangeDto {
  @IsOptional()
  @IsNumber()
  minSPH?: number;

  @IsOptional()
  @IsNumber()
  maxSPH?: number;

  @IsOptional()
  @IsNumber()
  minCYL?: number;

  @IsOptional()
  @IsNumber()
  maxCYL?: number;
}

// Frame Product DTO
export class CreateFrameProductDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @IsString()
  @MaxLength(2000)
  description: string;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsArray()
  images2D: string[];

  @IsOptional()
  @IsArray()
  images3D?: string[];

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsEnum(FRAME_TYPE)
  frameType: FRAME_TYPE;

  @IsEnum(FRAME_SHAPE)
  shape: FRAME_SHAPE;

  @IsEnum(FRAME_MATERIAL)
  material: FRAME_MATERIAL;

  @IsOptional()
  @IsEnum(FRAME_GENDER)
  gender?: FRAME_GENDER;

  @IsOptional()
  @IsEnum(BRIDGE_FIT)
  bridgeFit?: BRIDGE_FIT;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants: ProductVariantDto[];
}

// Lens Product DTO
export class CreateLensProductDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @IsString()
  @MaxLength(2000)
  description: string;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsArray()
  images2D: string[];

  @IsOptional()
  @IsArray()
  images3D?: string[];

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsEnum(LENS_TYPE)
  lensType: LENS_TYPE;

  @IsNumber()
  @Min(1.5)
  index: number;

  @IsOptional()
  @IsArray()
  coatings?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PrescriptionRangeDto)
  suitableForPrescriptionRange?: PrescriptionRangeDto;

  @IsBoolean()
  isPrescriptionRequired: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
}

// Service Product DTO
export class CreateServiceProductDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @IsString()
  @MaxLength(2000)
  description: string;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsArray()
  images2D: string[];

  @IsOptional()
  @IsArray()
  images3D?: string[];

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsEnum(SERVICE_TYPE)
  serviceType: SERVICE_TYPE;

  @IsNumber()
  @Min(1)
  durationMinutes: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  serviceNotes?: string;
}

// Generic create product DTO that accepts any type
export class CreateProductDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @IsEnum(PRODUCT_CATEGORIES)
  category: PRODUCT_CATEGORIES;

  @IsString()
  @MaxLength(2000)
  description: string;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsArray()
  images2D: string[];

  @IsOptional()
  @IsArray()
  images3D?: string[];

  @IsOptional()
  @IsArray()
  tags?: string[];

  // Frame-specific
  @IsOptional()
  @IsEnum(FRAME_TYPE)
  frameType?: FRAME_TYPE;

  @IsOptional()
  @IsEnum(FRAME_SHAPE)
  shape?: FRAME_SHAPE;

  @IsOptional()
  @IsEnum(FRAME_MATERIAL)
  material?: FRAME_MATERIAL;

  @IsOptional()
  @IsEnum(FRAME_GENDER)
  gender?: FRAME_GENDER;

  @IsOptional()
  @IsEnum(BRIDGE_FIT)
  bridgeFit?: BRIDGE_FIT;

  // Lens-specific
  @IsOptional()
  @IsEnum(LENS_TYPE)
  lensType?: LENS_TYPE;

  @IsOptional()
  @IsNumber()
  index?: number;

  @IsOptional()
  @IsArray()
  coatings?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PrescriptionRangeDto)
  suitableForPrescriptionRange?: PrescriptionRangeDto;

  @IsOptional()
  @IsBoolean()
  isPrescriptionRequired?: boolean;

  // Service-specific
  @IsOptional()
  @IsEnum(SERVICE_TYPE)
  serviceType?: SERVICE_TYPE;

  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  serviceNotes?: string;

  // Variants
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @IsArray()
  images2D?: string[];

  @IsOptional()
  @IsArray()
  images3D?: string[];

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // All optional category-specific fields for updates
  @IsOptional()
  @IsEnum(FRAME_TYPE)
  frameType?: FRAME_TYPE;

  @IsOptional()
  @IsEnum(FRAME_SHAPE)
  shape?: FRAME_SHAPE;

  @IsOptional()
  @IsEnum(FRAME_MATERIAL)
  material?: FRAME_MATERIAL;

  @IsOptional()
  @IsEnum(FRAME_GENDER)
  gender?: FRAME_GENDER;

  @IsOptional()
  @IsEnum(BRIDGE_FIT)
  bridgeFit?: BRIDGE_FIT;

  @IsOptional()
  @IsEnum(LENS_TYPE)
  lensType?: LENS_TYPE;

  @IsOptional()
  @IsNumber()
  index?: number;

  @IsOptional()
  @IsArray()
  coatings?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PrescriptionRangeDto)
  suitableForPrescriptionRange?: PrescriptionRangeDto;

  @IsOptional()
  @IsBoolean()
  isPrescriptionRequired?: boolean;

  @IsOptional()
  @IsEnum(SERVICE_TYPE)
  serviceType?: SERVICE_TYPE;

  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  serviceNotes?: string;
}

