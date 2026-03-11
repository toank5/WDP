import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  Min,
  IsDateString,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PromotionType, PromotionStatus, PromotionScope } from '../schemas/promotion.schema';

export class CreatePromotionDto {
  @ApiProperty({
    description: 'Unique promotion code',
    example: 'EYEWEAR20',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Promotion name',
    example: 'Summer Sale 20% Off',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Promotion description',
    example: 'Get 20% off on all orders this summer',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Promotion type',
    enum: PromotionType,
    example: PromotionType.PERCENTAGE,
  })
  @IsEnum(PromotionType)
  type: PromotionType;

  @ApiProperty({
    description: 'Discount value (percentage or fixed amount)',
    example: 20,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({
    description: 'Minimum order value to apply promotion',
    example: 500000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  minOrderValue: number;

  @ApiPropertyOptional({
    description: 'Promotion scope',
    enum: PromotionScope,
    example: PromotionScope.ALL_ORDERS,
    default: PromotionScope.ALL_ORDERS,
  })
  @IsOptional()
  @IsEnum(PromotionScope)
  scope?: PromotionScope;

  @ApiPropertyOptional({
    description: 'Applicable categories (when scope is SPECIFIC_CATEGORIES)',
    type: [String],
    example: ['frame', 'lens'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableCategories?: string[];

  @ApiPropertyOptional({
    description: 'Applicable product IDs (when scope is SPECIFIC_PRODUCTS)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableProductIds?: string[];

  @ApiProperty({
    description: 'Promotion start date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Promotion end date',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Total usage limit',
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  usageLimit?: number;

  @ApiPropertyOptional({
    description: 'Maximum uses per customer',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsesPerCustomer?: number;

  @ApiPropertyOptional({
    description: 'Whether this promotion can stack with others',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isStackable?: boolean;

  @ApiPropertyOptional({
    description: 'Promotion tags',
    type: [String],
    example: ['summer', 'sale', '2024'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Whether this promotion is featured',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Promotion status',
    enum: PromotionStatus,
    example: PromotionStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(PromotionStatus)
  status?: PromotionStatus;
}

export class UpdatePromotionDto {
  @ApiPropertyOptional({
    description: 'Promotion name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Promotion description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Promotion code',
    example: 'EYEWEAR20',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Discount value',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional({
    description: 'Minimum order value',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiPropertyOptional({
    description: 'Start date',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Usage limit',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  usageLimit?: number;

  @ApiPropertyOptional({
    description: 'Max uses per customer',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsesPerCustomer?: number;

  @ApiPropertyOptional({
    description: 'Whether stackable',
  })
  @IsOptional()
  @IsBoolean()
  isStackable?: boolean;

  @ApiPropertyOptional({
    description: 'Tags',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Whether featured',
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Promotion status',
    enum: PromotionStatus,
  })
  @IsOptional()
  @IsEnum(PromotionStatus)
  status?: PromotionStatus;
}

export class ListPromotionsQueryDto {
  @ApiPropertyOptional({
    description: 'Search by name or code',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: PromotionStatus,
  })
  @IsOptional()
  @IsEnum(PromotionStatus)
  status?: PromotionStatus;

  @ApiPropertyOptional({
    description: 'Filter by type',
    enum: PromotionType,
  })
  @IsOptional()
  @IsEnum(PromotionType)
  type?: PromotionType;

  @ApiPropertyOptional({
    description: 'Filter by featured status',
  })
  @IsOptional()
  @IsString()
  isFeatured?: 'true' | 'false';

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}

export class PromotionListItemDto {
  @ApiProperty({
    description: 'Promotion ID',
  })
  id: string;

  @ApiProperty({
    description: 'Promotion code',
  })
  code: string;

  @ApiProperty({
    description: 'Promotion name',
  })
  name: string;

  @ApiProperty({
    description: 'Description',
  })
  description?: string;

  @ApiProperty({
    description: 'Promotion type',
  })
  type: PromotionType;

  @ApiProperty({
    description: 'Discount value',
  })
  value: number;

  @ApiProperty({
    description: 'Minimum order value',
  })
  minOrderValue: number;

  @ApiProperty({
    description: 'Start date',
  })
  startDate: Date;

  @ApiProperty({
    description: 'End date',
  })
  endDate: Date;

  @ApiProperty({
    description: 'Usage limit',
  })
  usageLimit?: number;

  @ApiProperty({
    description: 'Current usage count',
  })
  usageCount: number;

  @ApiProperty({
    description: 'Remaining uses',
  })
  remainingUses?: number;

  @ApiProperty({
    description: 'Promotion status',
  })
  status: PromotionStatus;

  @ApiProperty({
    description: 'Whether featured',
  })
  isFeatured: boolean;

  @ApiProperty({
    description: 'Creation date',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
  })
  updatedAt: Date;
}

export class ValidatePromotionDto {
  @ApiProperty({
    description: 'Promotion code to validate',
    example: 'EYEWEAR20',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Cart total amount',
    example: 500000,
  })
  @IsNumber()
  @Min(0)
  cartTotal: number;

  @ApiPropertyOptional({
    description: 'Product IDs in cart (for category/product-specific promotions)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];

  @ApiPropertyOptional({
    description: 'Customer ID (for usage tracking)',
  })
  @IsOptional()
  @IsString()
  customerId?: string;
}

export class PromotionValidationResponseDto {
  @ApiProperty({
    description: 'Whether the promotion is valid',
  })
  isValid: boolean;

  @ApiProperty({
    description: 'Promotion details if valid',
    required: false,
  })
  promotion?: {
    id: string;
    code: string;
    name: string;
    type: PromotionType;
    value: number;
    discountAmount: number;
  };

  @ApiProperty({
    description: 'Calculated discount amount',
    required: false,
  })
  discountAmount?: number;

  @ApiProperty({
    description: 'Error message if invalid',
    required: false,
  })
  message?: string;
}
