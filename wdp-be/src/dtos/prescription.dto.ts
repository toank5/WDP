import {
  IsString,
  IsNumber,
  IsOptional,
  IsDate,
  IsBoolean,
  IsObject,
  IsNotEmpty,
  Min,
  Max,
  ValidateNested,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Eye data DTO (OD/OS values)
 */
export class EyeDataDto {
  @ApiPropertyOptional({ description: 'Sphere (SPH)', example: -2.0 })
  @IsNumber()
  @IsOptional()
  sph?: number;

  @ApiPropertyOptional({ description: 'Cylinder (CYL)', example: -0.5 })
  @IsNumber()
  @IsOptional()
  cyl?: number;

  @ApiPropertyOptional({ description: 'Axis (0-180)', example: 90 })
  @IsNumber()
  @Min(0)
  @Max(180)
  @IsOptional()
  axis?: number;

  @ApiPropertyOptional({ description: 'Addition (ADD)', example: 1.0 })
  @IsNumber()
  @IsOptional()
  add?: number;
}

/**
 * Pupillary Distance DTO
 */
export class PDDto {
  @ApiPropertyOptional({ description: 'Left PD', example: 31 })
  @IsNumber()
  @IsOptional()
  left?: number;

  @ApiPropertyOptional({ description: 'Right PD', example: 31 })
  @IsNumber()
  @IsOptional()
  right?: number;

  @ApiPropertyOptional({ description: 'Total PD', example: 62 })
  @IsNumber()
  @IsOptional()
  total?: number;
}

/**
 * Create Prescription DTO
 */
export class CreatePrescriptionDto {
  @ApiProperty({ example: 'My Daily Glasses' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Prescription date', example: '2024-01-15' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  prescriptionDate?: Date;

  @ApiPropertyOptional({ description: 'Right Eye (OD) data', type: EyeDataDto })
  @IsObject()
  @ValidateNested()
  @Type(() => EyeDataDto)
  @IsOptional()
  rightEye?: EyeDataDto;

  @ApiPropertyOptional({ description: 'Left Eye (OS) data', type: EyeDataDto })
  @IsObject()
  @ValidateNested()
  @Type(() => EyeDataDto)
  @IsOptional()
  leftEye?: EyeDataDto;

  @ApiPropertyOptional({ description: 'Pupillary Distance', type: PDDto })
  @IsObject()
  @ValidateNested()
  @Type(() => PDDto)
  @IsOptional()
  pd?: PDDto;

  @ApiPropertyOptional({ description: 'URL to uploaded prescription image' })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}

/**
 * Update Prescription DTO
 */
export class UpdatePrescriptionDto {
  @ApiPropertyOptional({ example: 'My Daily Glasses' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Prescription date', example: '2024-01-15' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  prescriptionDate?: Date;

  @ApiPropertyOptional({ description: 'Right Eye (OD) data', type: EyeDataDto })
  @IsObject()
  @ValidateNested()
  @Type(() => EyeDataDto)
  @IsOptional()
  rightEye?: EyeDataDto;

  @ApiPropertyOptional({ description: 'Left Eye (OS) data', type: EyeDataDto })
  @IsObject()
  @ValidateNested()
  @Type(() => EyeDataDto)
  @IsOptional()
  leftEye?: EyeDataDto;

  @ApiPropertyOptional({ description: 'Pupillary Distance', type: PDDto })
  @IsObject()
  @ValidateNested()
  @Type(() => PDDto)
  @IsOptional()
  pd?: PDDto;

  @ApiPropertyOptional({ description: 'URL to uploaded prescription image' })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}

/**
 * Verify Prescription DTO (Staff only)
 */
export class VerifyPrescriptionDto {
  @ApiProperty({ description: 'Whether the prescription is verified', example: true })
  @IsBoolean()
  isVerified: boolean;

  @ApiPropertyOptional({ description: 'Verification notes' })
  @IsString()
  @IsOptional()
  verificationNotes?: string;
}

/**
 * Prescription Response DTO
 */
export class PrescriptionResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty({ example: 'My Daily Glasses' })
  name: string;

  @ApiPropertyOptional({ description: 'Prescription date' })
  prescriptionDate?: Date;

  @ApiPropertyOptional({ description: 'Right Eye data', type: EyeDataDto })
  rightEye?: EyeDataDto;

  @ApiPropertyOptional({ description: 'Left Eye data', type: EyeDataDto })
  leftEye?: EyeDataDto;

  @ApiPropertyOptional({ description: 'Pupillary Distance', type: PDDto })
  pd?: PDDto;

  @ApiPropertyOptional({ description: 'Uploaded prescription image URL' })
  imageUrl?: string;

  @ApiProperty({ description: 'Verification status', example: false })
  isVerified: boolean;

  @ApiPropertyOptional({ description: 'Verification date' })
  verifiedAt?: Date;

  @ApiPropertyOptional({ description: 'Verified by staff user ID' })
  verifiedBy?: string;

  @ApiPropertyOptional({ description: 'Verification notes' })
  verificationNotes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Prescription List Query DTO
 */
export class PrescriptionListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by verification status', example: 'false' })
  @IsString()
  @IsOptional()
  isVerified?: string;

  @ApiPropertyOptional({ description: 'Search by name', example: 'daily' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', example: '1' })
  @IsString()
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({ description: 'Items per page', example: '10' })
  @IsString()
  @IsOptional()
  limit?: string;

  @ApiPropertyOptional({ description: 'Sort by field', example: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', example: 'desc' })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

/**
 * Eye Data for Verification (Editable by Staff)
 */
export class EyeDataVerificationDto {
  @ApiPropertyOptional({ description: 'Sphere (SPH)' })
  @IsNumber()
  @IsOptional()
  sph?: number;

  @ApiPropertyOptional({ description: 'Cylinder (CYL)' })
  @IsNumber()
  @IsOptional()
  cyl?: number;

  @ApiPropertyOptional({ description: 'Axis in degrees' })
  @IsNumber()
  @IsOptional()
  axis?: number;

  @ApiPropertyOptional({ description: 'Addition (ADD)' })
  @IsNumber()
  @IsOptional()
  add?: number;
}

/**
 * PD Data for Verification (Editable by Staff)
 */
export class PDDataVerificationDto {
  @ApiPropertyOptional({ description: 'Total PD' })
  @IsNumber()
  @IsOptional()
  total?: number;

  @ApiPropertyOptional({ description: 'Right PD' })
  @IsNumber()
  @IsOptional()
  right?: number;

  @ApiPropertyOptional({ description: 'Left PD' })
  @IsNumber()
  @IsOptional()
  left?: number;
}

/**
 * Prescription Verification Request (Sales Staff)
 * Allows editing prescription values during verification
 */
export class VerifyOrderPrescriptionDto {
  @ApiPropertyOptional({ description: 'Right eye data' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => EyeDataVerificationDto)
  rightEye?: EyeDataVerificationDto;

  @ApiPropertyOptional({ description: 'Left eye data' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => EyeDataVerificationDto)
  leftEye?: EyeDataVerificationDto;

  @ApiPropertyOptional({ description: 'PD data' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PDDataVerificationDto)
  pd?: PDDataVerificationDto;

  @ApiPropertyOptional({ description: 'Corrected prescription image URL' })
  @IsString()
  @IsOptional()
  prescriptionUrl?: string;
}

/**
 * Request Update Prescription DTO
 */
export class RequestPrescriptionUpdateDto {
  @ApiProperty({ description: 'Reason for update request' })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason: string;

  @ApiProperty({
    description: 'Update request reason',
    enum: ['Image Blurry', 'PD Missing', 'Prescription Expired', 'Values Unclear', 'Other']
  })
  @IsString()
  @IsOptional()
  reasonCategory?: string;
}

/**
 * Prescription Audit Log DTO
 */
export class PrescriptionAuditLogDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  orderItemId: string;

  @ApiProperty()
  field: string;

  @ApiProperty({ description: 'Original value before change' })
  oldValue: string;

  @ApiProperty({ description: 'New value after change' })
  newValue: string;

  @ApiProperty({ description: 'Action performed' })
  action: 'EDIT' | 'APPROVE' | 'REQUEST_UPDATE';

  @ApiProperty()
  staffId: string;

  @ApiProperty()
  staffName: string;

  @ApiProperty({ description: 'When the change was made' })
  createdAt: Date;
}

/**
 * Order Prescription Verification Response
 */
export class OrderPrescriptionVerificationResponseDto {
  @ApiProperty({ description: 'Order ID' })
  orderId: string;

  @ApiProperty({ description: 'Order Number' })
  orderNumber: string;

  @ApiProperty({ description: 'Customer Name' })
  customerName: string;

  @ApiProperty({ description: 'Customer Email' })
  customerEmail: string;

  @ApiProperty({ description: 'Order Item ID' })
  orderItemId: string;

  @ApiProperty({ description: 'Product Name' })
  productName: string;

  @ApiProperty({ description: 'Product Image' })
  productImage?: string;

  @ApiProperty({ description: 'Prescription URL' })
  prescriptionUrl?: string;

  @ApiProperty({ description: 'Prescription Data' })
  prescriptionData?: {
    pd: number;
    sph: { right: number; left: number };
    cyl: { right: number; left: number };
    axis: { right: number; left: number };
    add: { right: number; left: number };
  };

  @ApiProperty({ description: 'Prescription Status' })
  prescriptionStatus: string;

  @ApiProperty({ description: 'Order Status' })
  orderStatus: string;
}

/**
 * Orders Awaiting Verification Response
 */
export class OrdersAwaitingVerificationResponse {
  @ApiProperty({ description: 'List of orders awaiting verification' })
  orders: OrderPrescriptionVerificationResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;
}

/**
 * Complete Manufacturing DTO
 */
export class CompleteManufacturingDto {
  @ApiProperty({ description: 'Manufacturing proof image file' })
  @IsNotEmpty()
  file: any;

  @ApiPropertyOptional({ description: 'Additional notes about the manufacturing' })
  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * Prescription List Response DTO
 */
export class PrescriptionListResponseDto {
  @ApiProperty({ type: [PrescriptionResponseDto] })
  prescriptions: PrescriptionResponseDto[];

  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}
