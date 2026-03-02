import { IsString, IsNumber, IsOptional, Min, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Supplier information DTO
 */
export class SupplierInfoDto {
  @ApiProperty({
    description: 'Supplier name',
    example: 'Acme Eyewear Supplies',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: 'Supplier contact email',
    example: 'contact@acme.com',
  })
  @IsString()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Supplier contact phone',
    example: '+1-555-123-4567',
  })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the supplier',
    example: 'Primary supplier for frames',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

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

  @ApiProperty({
    description: 'Supplier information',
    type: SupplierInfoDto,
  })
  @IsObject()
  supplierInfo!: SupplierInfoDto;
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

  @ApiPropertyOptional({
    description: 'Supplier information',
    type: SupplierInfoDto,
  })
  @IsObject()
  @IsOptional()
  supplierInfo?: SupplierInfoDto;
}

/**
 * Stock adjustment DTO
 */
export class StockAdjustmentDto {
  @ApiProperty({
    description: 'Change in stock quantity (positive for increase, negative for decrease)',
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
