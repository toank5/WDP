import { IsString, MinLength, MaxLength, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { PRODUCT_CATEGORIES } from '../enums/product.enum';

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
}
