import {
  IsString,
  IsNumber,
  IsOptional,
  IsMongoId,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for adding an item to cart
 */
export class AddToCartDto {
  @ApiProperty({
    description: 'Product ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  @IsString()
  productId: string;

  @ApiProperty({
    description: 'Variant SKU (for products with variants like frames)',
    example: 'FRAME-BLK-52',
    required: false,
  })
  @IsOptional()
  @IsString()
  variantSku?: string;

  @ApiProperty({
    description: 'Quantity to add',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}

/**
 * DTO for updating cart item quantity
 */
export class UpdateCartItemDto {
  @ApiProperty({
    description: 'New quantity',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}

/**
 * DTO for cart item response (enriched with product details)
 */
export class CartItemResponseDto {
  @ApiProperty({
    description: 'Cart item ID',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'Product ID',
    example: '507f1f77bcf86cd799439011',
  })
  productId: string;

  @ApiProperty({
    description: 'Variant SKU',
    example: 'FRAME-BLK-52',
    required: false,
  })
  variantSku?: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Designer Round Eyeglasses',
  })
  productName?: string;

  @ApiProperty({
    description: 'Product image URL',
    example: 'http://localhost:3000/uploads/eyeglasses.jpg',
    required: false,
  })
  productImage?: string;

  @ApiProperty({
    description: 'Price at current time',
    example: 150000,
  })
  price?: number;

  @ApiProperty({
    description: 'Quantity',
    example: 1,
  })
  quantity: number;

  @ApiProperty({
    description: 'Variant details (size, color)',
    required: false,
  })
  variantDetails?: {
    size?: string;
    color?: string;
  };

  @ApiProperty({
    description: 'When item was added',
    example: '2024-01-15T10:30:00.000Z',
  })
  addedAt: Date;
}

/**
 * DTO for cart response
 */
export class CartResponseDto {
  @ApiProperty({
    description: 'Cart ID',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'Customer ID',
    example: '507f1f77bcf86cd799439011',
  })
  customerId: string;

  @ApiProperty({
    description: 'Cart items',
    type: [CartItemResponseDto],
  })
  items: CartItemResponseDto[];

  @ApiProperty({
    description: 'Total number of items',
    example: 3,
  })
  totalItems: number;

  @ApiProperty({
    description: 'Subtotal (before shipping and tax)',
    example: 450000,
  })
  subtotal: number;

  @ApiProperty({
    description: 'Cart created date',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Cart updated date',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}

/**
 * DTO for clearing cart response
 */
export class ClearCartResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Cart cleared successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Number of items removed',
    example: 3,
  })
  itemsRemoved: number;
}

/**
 * DTO for merge cart request (merge guest cart to user cart)
 */
export class MergeCartDto {
  @ApiProperty({
    description: 'Items from guest cart to merge',
    type: [AddToCartDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddToCartDto)
  items: AddToCartDto[];
}

/**
 * DTO for bulk add to cart
 */
export class BulkAddToCartDto {
  @ApiProperty({
    description: 'Items to add to cart',
    type: [AddToCartDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddToCartDto)
  items: AddToCartDto[];
}
