import {
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_VARIANT_TYPES,
} from '../enums/product.enum';

export class ProductVariantDto {
  @IsString()
  sku: string;

  @IsEnum(PRODUCT_VARIANT_TYPES)
  type: PRODUCT_VARIANT_TYPES;

  @IsString()
  size: string;

  @IsString()
  color: string;

  @IsOptional()
  @IsArray()
  images?: string[]; // File paths stored after upload
}

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEnum(PRODUCT_CATEGORIES)
  category: PRODUCT_CATEGORIES;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  description: string;

  @IsNumber()
  basePrice: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEnum(PRODUCT_CATEGORIES)
  category?: PRODUCT_CATEGORIES;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsNumber()
  basePrice?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
}
