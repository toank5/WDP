import { IsString, IsNumber, IsOptional, Min, IsObject, IsNotEmpty } from 'class-validator';

/**
 * Supplier information DTO
 */
export class SupplierInfoDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * Create inventory item DTO
 */
export class CreateInventoryDto {
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsNumber()
  @Min(0)
  stockQuantity!: number;

  @IsNumber()
  @Min(0)
  reservedQuantity!: number;

  @IsNumber()
  @Min(0)
  reorderLevel!: number;

  @IsObject()
  supplierInfo!: SupplierInfoDto;
}

/**
 * Update inventory item DTO
 */
export class UpdateInventoryDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reservedQuantity?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderLevel?: number;

  @IsObject()
  @IsOptional()
  supplierInfo?: SupplierInfoDto;
}

/**
 * Stock adjustment DTO
 */
export class StockAdjustmentDto {
  @IsNumber()
  delta!: number;

  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsString()
  @IsOptional()
  reference?: string;
}

/**
 * Bulk stock update item DTO
 */
export class BulkStockUpdateItemDto {
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsNumber()
  @Min(0)
  stockQuantity!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reservedQuantity?: number;
}

/**
 * Bulk stock update DTO
 */
export class BulkStockUpdateDto {
  items!: BulkStockUpdateItemDto[];
}

/**
 * Reserve inventory DTO
 */
export class ReserveInventoryDto {
  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsString()
  @IsOptional()
  orderId?: string;
}

/**
 * Release reservation DTO
 */
export class ReleaseReservationDto {
  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsString()
  @IsOptional()
  orderId?: string;
}
