import {
  IsEnum,
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  IsObject,
  IsBoolean,
  Min,
  ArrayNotEmpty,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Import enums from shared package
import {
  RETURN_STATUS as ReturnStatus,
  RETURN_TYPE as ReturnType,
  RETURN_REASON as ReturnReason,
  RETURN_ITEM_CONDITION as ReturnItemCondition,
} from '../../shared';

/**
 * Return Line Item DTO
 */
export class ReturnLineItemDto {
  @ApiProperty()
  @IsString()
  orderItemId: string;

  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsString()
  variantId: string;

  @ApiProperty()
  @IsString()
  productName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productImage?: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPrescription?: boolean;

  @ApiPropertyOptional({ enum: ReturnItemCondition })
  @IsEnum(ReturnItemCondition)
  @IsOptional()
  condition?: ReturnItemCondition;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  inventoryProcessed?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  inspectionNotes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  inspectedBy?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  inspectedAt?: Date;
}

/**
 * Staff Verification DTO
 */
export class StaffVerificationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  staffNotes?: string;

  @ApiPropertyOptional({
    enum: ['EXCELLENT', 'GOOD', 'ACCEPTABLE', 'POOR', 'UNACCEPTABLE'],
  })
  @IsString()
  @IsOptional()
  conditionRating?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantityVerified: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  packagingIntact?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  allAccessoriesPresent?: boolean;
}

/**
 * Refund/Exchange Details DTO
 */
export class RefundExchangeDetailsDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  refundAmount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  refundMethod?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  refundTransactionId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  exchangeOrderId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * Create Return Request DTO (Customer)
 */
export class CreateReturnRequestDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty({ enum: ReturnType })
  @IsEnum(ReturnType)
  returnType: ReturnType;

  @ApiProperty({ enum: ReturnReason })
  @IsEnum(ReturnReason)
  reason: ReturnReason;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reasonDetails?: string;

  @ApiProperty({ type: [ReturnLineItemDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReturnLineItemDto)
  items: ReturnLineItemDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerNotes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerEmail?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerPhone?: string;
}

/**
 * Update Return Status DTO (Staff/Manager)
 */
export class UpdateReturnStatusDto {
  @ApiProperty({
    enum: ReturnStatus,
    description: 'Target status to transition to',
  })
  @IsEnum(ReturnStatus)
  status: ReturnStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  rejectionReason?: string; // Required when rejecting

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  approvedRefundAmount?: number; // For approval status

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  restockingFee?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  restockingFeePercent?: number;
}

/**
 * Verify Returned Item DTO (Staff)
 *
 * Used by Sale/Operation Staff to verify item condition when received
 */
export class VerifyReturnedItemDto {
  @ApiProperty({ type: StaffVerificationDto })
  @IsObject()
  @ValidateNested()
  @Type(() => StaffVerificationDto)
  verification: StaffVerificationDto;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * Process Refund/Exchange DTO (Staff)
 *
 * Used to finalize refund or create exchange order after verification
 */
export class ProcessRefundExchangeDto {
  @ApiProperty({ type: RefundExchangeDetailsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => RefundExchangeDetailsDto)
  details: RefundExchangeDetailsDto;
}

/**
 * Inspect Return Item DTO (Sale Staff)
 *
 * Used by Sale Staff to set condition on individual items during inspection
 */
export class InspectReturnItemDto {
  @ApiProperty()
  @IsString()
  orderItemId: string;

  @ApiProperty({
    enum: ReturnItemCondition,
    description: 'Condition of the returned item',
  })
  @IsEnum(ReturnItemCondition)
  condition: ReturnItemCondition;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantityReceived: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  inspectionNotes?: string;
}

/**
 * Inspect Return DTO (Sale Staff)
 *
 * Used by Sale Staff to inspect all returned items and decide resolution
 * Transition: AWAITING_ITEMS → IN_REVIEW → APPROVED
 */
export class InspectReturnDto {
  @ApiProperty({
    type: [InspectReturnItemDto],
    description: 'List of items with their conditions',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InspectReturnItemDto)
  items: InspectReturnItemDto[];

  @ApiProperty({
    enum: ReturnType,
    description: 'Resolution type: REFUND or EXCHANGE',
  })
  @IsEnum(ReturnType)
  resolutionType: ReturnType;

  @ApiProperty({
    description: 'Approved refund amount (for REFUND type)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  approvedRefundAmount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  restockingFee?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * Approve Return Resolution DTO (Sale Staff)
 *
 * Used to approve a return after inspection and set resolution details
 * Transition: IN_REVIEW → APPROVED
 */
export class ApproveReturnResolutionDto {
  @ApiProperty({ enum: ReturnType })
  @IsEnum(ReturnType)
  resolutionType: ReturnType;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  approvedRefundAmount: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  restockingFee?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  refundMethod?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * Process Return Inventory DTO (Operation Staff)
 *
 * Used by Operation Staff to update inventory based on item conditions
 * Creates RETURN_IN or SCRAP inventory movements
 */
export class ProcessReturnInventoryDto {
  @ApiProperty({
    description: 'Array of inventory movements created',
    type: [Object],
  })
  inventoryMovements: Array<{
    sku: string;
    type: 'RETURN_IN' | 'SCRAP';
    quantity: number;
    reason: string;
  }>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * Return Query DTO (Staff/Manager)
 */
export class ReturnQueryDto {
  @ApiPropertyOptional()
  @IsEnum(ReturnStatus)
  @IsOptional()
  status?: ReturnStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  returnNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string; // search by return number, order number, customer email

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fromDate?: string; // ISO date string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  toDate?: string; // ISO date string

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * Return Response DTO
 */
export class ReturnResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  returnNumber: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: ReturnStatus })
  status: ReturnStatus;

  @ApiProperty({ enum: ReturnType })
  returnType: ReturnType;

  @ApiProperty({ enum: ReturnReason })
  reason: ReturnReason;

  @ApiPropertyOptional()
  reasonDetails?: string;

  @ApiProperty({ type: [ReturnLineItemDto] })
  items: ReturnLineItemDto[];

  @ApiProperty()
  requestedRefundAmount: number;

  @ApiPropertyOptional()
  approvedRefundAmount?: number;

  @ApiPropertyOptional()
  restockingFee?: number;

  @ApiPropertyOptional()
  restockingFeePercent?: number;

  @ApiPropertyOptional()
  staffVerification?: {
    receivedAt?: Date;
    receivedBy?: string;
    conditionRating?: string;
    quantityVerified?: number;
    packagingIntact?: boolean;
    allAccessoriesPresent?: boolean;
    warehouseNotes?: string;
    itemDisposition?: string;
    inventoryMovementId?: string;
  };

  @ApiPropertyOptional()
  refundDetails?: {
    initiatedAt?: Date;
    initiatedBy?: string;
    refundAmount?: number;
    refundMethod?: string;
    refundTransactionId?: string;
    completedAt?: Date;
    completedBy?: string;
    notes?: string;
    originalPaymentId?: string;
    originalPaymentMethod?: string;
  };

  @ApiPropertyOptional()
  exchangeDetails?: {
    processedAt?: Date;
    processedBy?: string;
    exchangeOrderId?: string;
    notes?: string;
  };

  @ApiPropertyOptional()
  customerNotes?: string;

  @ApiPropertyOptional()
  customerEmail?: string;

  @ApiPropertyOptional()
  customerPhone?: string;

  @ApiPropertyOptional()
  rejectionReason?: string;

  @ApiPropertyOptional()
  returnTrackingNumber?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  requiresManagerApproval: boolean;

  @ApiPropertyOptional()
  statusHistory?: {
    status: ReturnStatus;
    changedBy: string;
    changedAt: Date;
    notes?: string;
  }[];

  // New fields for enhanced return flow
  @ApiPropertyOptional()
  @IsBoolean()
  inventoryProcessed?: boolean;

  @ApiPropertyOptional()
  @IsDateString()
  inventoryProcessedAt?: Date;

  @ApiPropertyOptional()
  @IsString()
  inventoryProcessedBy?: string;

  @ApiPropertyOptional()
  revenueImpact?: {
    originalRevenue: number;
    refundAmount: number;
    netRevenue: number;
    recordedAt?: Date;
  };
}

/**
 * Return Statistics DTO (for Manager Dashboard)
 */
export class ReturnStatsDto {
  @ApiProperty()
  totalReturns: number;

  @ApiProperty()
  pendingApproval: number;

  @ApiProperty()
  awaitingItem: number;

  @ApiProperty()
  verifiedPendingAction: number;

  @ApiProperty()
  totalRefundAmount: number;

  @ApiProperty()
  approvedReturns: number;

  @ApiProperty()
  rejectedReturns: number;

  @ApiProperty()
  avgProcessingTimeDays: number;

  @ApiProperty()
  returnsByReason: Record<string, number>;
}

/**
 * Return Eligibility Check DTO
 */
export class ReturnEligibilityRequestDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty({ type: [ReturnLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnLineItemDto)
  items: ReturnLineItemDto[];
}

/**
 * Return Eligibility Response DTO
 */
export class ReturnEligibilityResponseDto {
  @ApiProperty()
  eligible: boolean;

  @ApiPropertyOptional()
  returnWindowDays?: number;

  @ApiPropertyOptional()
  daysSinceDelivery?: number;

  @ApiPropertyOptional()
  daysRemaining?: number;

  @ApiPropertyOptional()
  reason?: string;

  @ApiPropertyOptional()
  estimatedRefundAmount?: number;

  @ApiPropertyOptional()
  restockingFee?: number;

  @ApiPropertyOptional()
  restockingFeePercent?: number;

  @ApiPropertyOptional({ type: [ReturnLineItemDto] })
  eligibleItems?: ReturnLineItemDto[];

  @ApiPropertyOptional({ type: [ReturnLineItemDto] })
  ineligibleItems?: { item: ReturnLineItemDto; reason: string }[];
}

/**
 * Exchange Order Item DTO
 *
 * Represents an item in the exchange order
 */
export class CreateExchangeOrderItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsString()
  variantId: string;

  @ApiProperty()
  @IsString()
  productName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productImage?: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sku?: string;
}

/**
 * Create Exchange Order DTO (Staff operation)
 *
 * Used by Operation Staff to create a new exchange order
 * for replacement products when processing an exchange return
 */
export class CreateExchangeOrderDto {
  @ApiProperty()
  @IsString()
  returnId: string; // ID of the return request

  @ApiProperty({ type: [CreateExchangeOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExchangeOrderItemDto)
  items: CreateExchangeOrderItemDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string; // Additional notes for the exchange order
}

/**
 * Exchange Order Response DTO
 */
export class ExchangeOrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  returnId: string;

  @ApiProperty()
  returnNumber: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  orderType: string;

  @ApiProperty()
  orderStatus: string;

  @ApiProperty({ type: [CreateExchangeOrderItemDto] })
  items: CreateExchangeOrderItemDto[];

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  notes?: string;
}
