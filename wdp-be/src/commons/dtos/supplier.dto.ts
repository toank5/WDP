import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsNotEmpty,
  IsArray,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupplierStatus } from '../schemas/supplier.schema';

/**
 * Create supplier DTO
 */
export class CreateSupplierDto {
  @ApiProperty({
    description: 'Unique supplier code',
    example: 'SPL-001',
  })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({
    description: 'Supplier display name',
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
  email?: string;

  @ApiPropertyOptional({
    description: 'Supplier contact phone',
    example: '+1-555-123-4567',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'VAT / tax number',
    example: '123456789',
  })
  @IsString()
  @IsOptional()
  taxCode?: string;

  @ApiPropertyOptional({
    description: 'Default currency',
    example: 'VND',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Address line 1',
    example: '123 Main Street',
  })
  @IsString()
  @IsOptional()
  addressLine1?: string;

  @ApiPropertyOptional({
    description: 'Address line 2',
    example: 'Suite 100',
  })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Ho Chi Minh City',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'State/Province',
    example: 'HCM',
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({
    description: 'Postal code',
    example: '700000',
  })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Country',
    example: 'Vietnam',
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({
    description: 'Linked product IDs',
    type: [String],
  })
  @IsArray()
  @IsString()
  @IsOptional()
  linkedProductIds?: string[];

  @ApiPropertyOptional({
    description: 'Supplier status',
    example: SupplierStatus.ACTIVE,
    enum: SupplierStatus,
  })
  @IsEnum(SupplierStatus)
  @IsOptional()
  status?: SupplierStatus;
}

/**
 * Update supplier DTO
 */
export class UpdateSupplierDto {
  @ApiPropertyOptional({
    description: 'Supplier display name',
    example: 'Acme Eyewear Supplies',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Supplier contact email',
    example: 'contact@acme.com',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Supplier contact phone',
    example: '+1-555-123-4567',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'VAT / tax number',
    example: '123456789',
  })
  @IsString()
  @IsOptional()
  taxCode?: string;

  @ApiPropertyOptional({
    description: 'Default currency',
    example: 'VND',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Address line 1',
    example: '123 Main Street',
  })
  @IsString()
  @IsOptional()
  addressLine1?: string;

  @ApiPropertyOptional({
    description: 'Address line 2',
    example: 'Suite 100',
  })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Ho Chi Minh City',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'State/Province',
    example: 'HCM',
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({
    description: 'Postal code',
    example: '700000',
  })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Country',
    example: 'Vietnam',
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({
    description: 'Linked product IDs',
    type: [String],
  })
  @IsArray()
  @IsString()
  @IsOptional()
  linkedProductIds?: string[];

  @ApiPropertyOptional({
    description: 'Supplier status',
    example: SupplierStatus.INACTIVE,
    enum: SupplierStatus,
  })
  @IsEnum(SupplierStatus)
  @IsOptional()
  status?: SupplierStatus;
}

/**
 * Query parameters for supplier list
 */
export class ListSuppliersQueryDto {
  @ApiPropertyOptional({
    description: 'Search by name or code',
    example: 'ACME',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: SupplierStatus,
    example: SupplierStatus.ACTIVE,
  })
  @IsEnum(SupplierStatus)
  @IsOptional()
  status?: SupplierStatus;

  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    example: 1,
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;
}

/**
 * @deprecated Use ListSuppliersQueryDto instead
 */
export class SupplierQueryParams {
  search?: string;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Stock adjustment DTO with supplier info
 */
export class StockAdjustmentWithSupplierDto {
  @ApiProperty({
    description:
      'Change in stock quantity (positive for increase, negative for decrease)',
    example: 10,
  })
  @IsNumber()
  @Min(1)
  quantity!: number;

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
    description: 'Note for the adjustment',
    example: 'Additional notes',
  })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({
    description: 'Supplier ID',
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
