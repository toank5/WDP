import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  Min,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ComboStatus } from '../schemas/combo.schema';

export class CreateComboDto {
  @ApiProperty({
    description: 'Combo name',
    example: 'Student Package - Round Frame + Single Vision Lens',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Combo description',
    example: 'Perfect package for students with high-index lenses',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Frame Product ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  frameProductId: string;

  @ApiProperty({
    description: 'Lens Product ID',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  lensProductId: string;

  @ApiProperty({
    description: 'Combo price (discounted price)',
    example: 250000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  comboPrice: number;

  @ApiProperty({
    description: 'Original price (sum of individual prices)',
    example: 350000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  originalPrice: number;

  @ApiPropertyOptional({
    description: 'Combo start date (for scheduled combos)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Combo end date',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Maximum purchase quantity per customer',
    example: 5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPurchaseQuantity?: number;

  @ApiPropertyOptional({
    description: 'Combo tags for categorization',
    type: [String],
    example: ['student', 'back-to-school', 'budget'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Whether this combo is featured',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Combo status',
    enum: ComboStatus,
    example: ComboStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ComboStatus)
  status?: ComboStatus;
}

export class UpdateComboDto {
  @ApiPropertyOptional({
    description: 'Combo name',
    example: 'Updated Student Package',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Combo description',
    example: 'Updated description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Frame Product ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  frameProductId?: string;

  @ApiPropertyOptional({
    description: 'Lens Product ID',
    example: '507f1f77bcf86cd799439012',
  })
  @IsOptional()
  @IsString()
  lensProductId?: string;

  @ApiPropertyOptional({
    description: 'Combo price',
    example: 275000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  comboPrice?: number;

  @ApiPropertyOptional({
    description: 'Original price',
    example: 350000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @ApiPropertyOptional({
    description: 'Start date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Maximum purchase quantity',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPurchaseQuantity?: number;

  @ApiPropertyOptional({
    description: 'Tags',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Whether this combo is featured',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Combo status',
    enum: ComboStatus,
  })
  @IsOptional()
  @IsEnum(ComboStatus)
  status?: ComboStatus;
}

export class ListCombosQueryDto {
  @ApiPropertyOptional({
    description: 'Search by name',
    example: 'student',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ComboStatus,
  })
  @IsOptional()
  @IsEnum(ComboStatus)
  status?: ComboStatus;

  @ApiPropertyOptional({
    description: 'Filter by frame product ID',
  })
  @IsOptional()
  @IsString()
  frameProductId?: string;

  @ApiPropertyOptional({
    description: 'Filter by lens product ID',
  })
  @IsOptional()
  @IsString()
  lensProductId?: string;

  @ApiPropertyOptional({
    description: 'Filter by featured status',
  })
  @IsOptional()
  @IsString()
  isFeatured?: 'true' | 'false';

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}

export class ComboListItemDto {
  @ApiProperty({
    description: 'Combo ID',
  })
  id: string;

  @ApiProperty({
    description: 'Combo name',
  })
  name: string;

  @ApiProperty({
    description: 'Combo description',
  })
  description: string;

  @ApiProperty({
    description: 'Frame Product ID',
  })
  frameProductId: string;

  @ApiProperty({
    description: 'Lens Product ID',
  })
  lensProductId: string;

  @ApiProperty({
    description: 'Frame name (populated)',
  })
  frameName?: string;

  @ApiProperty({
    description: 'Lens name (populated)',
  })
  lensName?: string;

  @ApiProperty({
    description: 'Combo price',
  })
  comboPrice: number;

  @ApiProperty({
    description: 'Original price',
  })
  originalPrice: number;

  @ApiProperty({
    description: 'Discount amount',
  })
  discountAmount: number;

  @ApiProperty({
    description: 'Discount percentage',
  })
  discountPercentage: number;

  @ApiProperty({
    description: 'Combo status',
  })
  status: ComboStatus;

  @ApiProperty({
    description: 'Start date',
  })
  startDate?: Date;

  @ApiProperty({
    description: 'End date',
  })
  endDate?: Date;

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

export class ValidateComboDto {
  @ApiProperty({
    description: 'Array of frame and lens product IDs to check for combo',
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  @IsArray()
  @IsString({ each: true })
  productIds: string[];
}

export class ComboValidationResponseDto {
  @ApiProperty({
    description: 'Whether a valid combo exists',
  })
  hasCombo: boolean;

  @ApiProperty({
    description: 'Combo details if found',
    required: false,
  })
  combo?: {
    id: string;
    name: string;
    comboPrice: number;
    originalPrice: number;
    discountAmount: number;
    discountPercentage: number;
  };

  @ApiProperty({
    description: 'Applicable combo price',
    required: false,
  })
  comboPrice?: number;
}
