import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PRODUCT_CATEGORIES } from '../../shared';

/**
 * Request to add item to favorites
 */
export class AddFavoriteDto {
  @ApiProperty({
    description: 'Product ID to add to favorites',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  productId: string;

  @ApiPropertyOptional({
    description: 'Variant ID (optional)',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiPropertyOptional({
    description: 'Variant SKU (optional)',
    example: 'FR-ROUND-52-BLK',
  })
  @IsString()
  @IsOptional()
  variantSku?: string;
}

/**
 * Product summary embedded in favorite response
 */
export class FavoriteProductSummaryDto {
  @ApiProperty({
    description: 'Product ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Designer Round Eyeglasses',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Product category',
    enum: PRODUCT_CATEGORIES,
    example: PRODUCT_CATEGORIES.FRAMES,
  })
  @IsEnum(PRODUCT_CATEGORIES)
  category: PRODUCT_CATEGORIES;

  @ApiPropertyOptional({
    description: 'Product slug/URL path',
    example: 'designer-round-eyeglasses',
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({
    description: 'Product price',
    example: 199.99,
  })
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'Product image URL',
    example: 'https://cdn.example.com/product.jpg',
  })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({
    description: 'Product tag/category label',
    example: 'Frames',
  })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiProperty({
    description: 'Whether product has 3D media',
    example: true,
  })
  @IsBoolean()
  has3D: boolean;

  @ApiProperty({
    description: 'Whether product is active',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Available variants for this product',
    type: 'array',
    example: [
      { sku: 'FR-ROUND-52-BLK', color: 'Black', size: '52', price: 199.99 },
    ],
  })
  @IsArray()
  @IsOptional()
  variants?: Array<{
    sku: string;
    color: string;
    size: string;
    price: number;
  }>;
}

/**
 * Favorite item in response
 */
export class FavoriteItemDto {
  @ApiProperty({
    description: 'Favorite item ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Product ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  productId: string;

  @ApiPropertyOptional({
    description: 'Variant ID',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiPropertyOptional({
    description: 'Variant SKU',
    example: 'FR-ROUND-52-BLK',
  })
  @IsString()
  @IsOptional()
  variantSku?: string;

  @ApiProperty({
    description: 'When the item was added to favorites',
    example: '2024-01-15T10:30:00.000Z',
  })
  addedAt: string;

  @ApiProperty({
    description: 'Product details',
    type: FavoriteProductSummaryDto,
  })
  product: FavoriteProductSummaryDto;
}

/**
 * Response for getting favorites list
 */
export class FavoritesListResponseDto {
  @ApiProperty({
    description: 'List of favorite items',
    type: [FavoriteItemDto],
  })
  items: FavoriteItemDto[];

  @ApiProperty({
    description: 'Total number of favorite items',
    example: 5,
  })
  total: number;

  @ApiProperty({
    description: 'Count of active (available) products',
    example: 4,
  })
  activeCount: number;
}

/**
 * Response for removing favorite
 */
export class RemoveFavoriteResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Item removed from favorites',
  })
  message: string;
}

/**
 * Response for adding favorite
 */
export class AddFavoriteResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Item added to favorites',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Created favorite item',
    type: FavoriteItemDto,
  })
  item?: FavoriteItemDto;
}

/**
 * Query params for checking if product is favorited
 */
export class CheckFavoriteQueryDto {
  @ApiProperty({
    description: 'Product ID to check',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  productId: string;

  @ApiPropertyOptional({
    description: 'Variant ID to check',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  @IsOptional()
  variantId?: string;
}

/**
 * Response for checking if product is favorited
 */
export class CheckFavoriteResponseDto {
  @ApiProperty({
    description: 'Whether the product is in favorites',
    example: true,
  })
  isFavorited: boolean;

  @ApiPropertyOptional({
    description: 'Favorite item ID if favorited',
    example: '507f1f77bcf86cd799439011',
  })
  favoriteId?: string;
}

/**
 * Response for favorites count
 */
export class FavoritesCountResponseDto {
  @ApiProperty({
    description: 'Number of favorite items',
    example: 5,
  })
  count: number;
}
