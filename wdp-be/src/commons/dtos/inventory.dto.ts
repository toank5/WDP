import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Create inventory item DTO
 */
export class CreateInventoryDto {
  @ApiProperty({
    description: 'SKU of the variant',
    example: 'FR-ROUND-52-BLK',
  })
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @ApiProperty({
    description: 'Total stock on hand for this SKU',
    example: 120,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  stockQuantity!: number;

  @ApiProperty({
    description: 'Quantity reserved in open orders',
    example: 5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  reservedQuantity!: number;

  @ApiProperty({
    description: 'Stock level at which to trigger reorder',
    example: 20,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  reorderLevel!: number;
}

/**
 * Update inventory item DTO
 */
export class UpdateInventoryDto {
  @ApiPropertyOptional({
    description: 'Total stock on hand for this SKU',
    example: 120,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @ApiPropertyOptional({
    description: 'Quantity reserved in open orders',
    example: 5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reservedQuantity?: number;

  @ApiPropertyOptional({
    description: 'Stock level at which to trigger reorder',
    example: 20,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderLevel?: number;
}

/**
 * Stock adjustment DTO
 * Used for all stock changes (receive, adjust, issue)
 */
export class StockAdjustmentDto {
  @ApiProperty({
    description:
      'Change in stock quantity (positive for increase, negative for decrease)',
    example: 10,
  })
  @IsNumber()
  delta!: number;

  @ApiProperty({
    description: 'Reason for the adjustment',
    example: 'Restock from supplier',
  })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({
    description: 'Reference number (e.g., PO number, receipt number)',
    example: 'PO-2024-12345',
  })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Additional notes about the adjustment',
  })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({
    description: 'Supplier ID (when receiving from supplier)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsOptional()
  supplierId?: string;

  @ApiPropertyOptional({
    description: 'Supplier reference (invoice/delivery order number)',
    example: 'INV-2024-001',
  })
  @IsString()
  @IsOptional()
  supplierRef?: string;
}

/**
 * Bulk stock update item DTO
 */
export class BulkStockUpdateItemDto {
  @ApiProperty({
    description: 'SKU of the variant',
    example: 'FR-ROUND-52-BLK',
  })
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @ApiProperty({
    description: 'Total stock on hand for this SKU',
    example: 120,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  stockQuantity!: number;

  @ApiPropertyOptional({
    description: 'Quantity reserved in open orders',
    example: 5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reservedQuantity?: number;
}

/**
 * Bulk stock update DTO
 */
export class BulkStockUpdateDto {
  @ApiProperty({
    description: 'Array of stock updates to apply',
    type: [BulkStockUpdateItemDto],
  })
  items!: BulkStockUpdateItemDto[];
}

/**
 * Reserve inventory DTO
 */
export class ReserveInventoryDto {
  @ApiProperty({
    description: 'Quantity to reserve',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({
    description: 'Associated order ID',
    example: 'ORD-12345',
  })
  @IsString()
  @IsOptional()
  orderId?: string;
}

/**
 * Release reservation DTO
 */
export class ReleaseReservationDto {
  @ApiProperty({
    description: 'Quantity to release from reservation',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({
    description: 'Associated order ID',
    example: 'ORD-12345',
  })
  @IsString()
  @IsOptional()
  orderId?: string;
}
