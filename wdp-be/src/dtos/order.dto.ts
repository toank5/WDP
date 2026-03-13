import {
  IsString,
  IsNumber,
  IsOptional,
  IsMongoId,
  Min,
  IsEnum,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ORDER_TYPES, ORDER_STATUS } from '@eyewear/shared';

/**
 * Shipping address DTO
 */
export class ShippingAddressDto {
  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '0123456789' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123 Main Street' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Ho Chi Minh City' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'District 1' })
  @IsString()
  district: string;

  @ApiProperty({ example: 'Ward 1', required: false })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiProperty({ example: '700000', required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;
}

/**
 * Order item DTO (for creating order from cart)
 */
export class OrderItemDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsString()
  productId: string;

  @ApiProperty({ example: 'FRAME-BLK-52', required: false })
  @IsOptional()
  @IsString()
  variantSku?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 150000 })
  @IsNumber()
  @Min(0)
  priceAtOrder: number;
}

/**
 * Payment info DTO
 */
export class PaymentInfoDto {
  @ApiProperty({ enum: ['VNPAY', 'CASH', 'BANK_TRANSFER'], example: 'VNPAY' })
  @IsString()
  @IsEnum(['VNPAY', 'CASH', 'BANK_TRANSFER'])
  method: string;

  @ApiProperty({ example: 150000, required: false })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({ example: 'VNPAY_1234567890', required: false })
  @IsOptional()
  @IsString()
  transactionId?: string;
}

/**
 * Create order request (checkout)
 */
export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ type: ShippingAddressDto })
  @IsObject()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ example: 'STANDARD', enum: ['STANDARD', 'EXPRESS'] })
  @IsString()
  @IsEnum(['STANDARD', 'EXPRESS'])
  shippingMethod: string;

  @ApiProperty({ type: PaymentInfoDto })
  @IsObject()
  @ValidateNested()
  @Type(() => PaymentInfoDto)
  payment: PaymentInfoDto;

  @ApiProperty({ example: 'READY', enum: ORDER_TYPES, required: false })
  @IsOptional()
  @IsEnum(ORDER_TYPES)
  orderType?: ORDER_TYPES;

  @ApiProperty({ example: 'Please deliver between 9AM-5PM', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'SUMMER2025', required: false, description: 'Promotion code to apply' })
  @IsOptional()
  @IsString()
  promotionCode?: string;
}

/**
 * Prescription data DTO (for OD/OS values)
 */
export class PrescriptionDataDto {
  @ApiProperty({ example: 62.5, description: 'Pupillary Distance' })
  @IsNumber()
  pd: number;

  @ApiProperty({
    example: { right: -2.0, left: -1.5 },
    description: 'Sphere (OD/OS)',
  })
  @IsObject()
  sph: {
    right: number;
    left: number;
  };

  @ApiProperty({
    example: { right: -0.5, left: -0.75 },
    description: 'Cylinder (OD/OS)',
  })
  @IsObject()
  cyl: {
    right: number;
    left: number;
  };

  @ApiProperty({
    example: { right: 90, left: 85 },
    description: 'Axis (OD/OS)',
  })
  @IsObject()
  axis: {
    right: number;
    left: number;
  };

  @ApiProperty({
    example: { right: 1.0, left: 1.0 },
    description: 'Addition (OD/OS)',
  })
  @IsObject()
  add: {
    right: number;
    left: number;
  };
}

/**
 * Order item response
 */
export class OrderItemResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty({ required: false })
  variantSku?: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  priceAtOrder: number;

  @ApiProperty({ required: false })
  productName?: string;

  @ApiProperty({ required: false })
  productImage?: string;

  @ApiProperty({ required: false })
  variantDetails?: {
    size?: string;
    color?: string;
  };

  // Pre-order fields
  @ApiProperty({ required: false })
  isPreorder?: boolean;

  @ApiProperty({ required: false, enum: ['PENDING_STOCK', 'PARTIALLY_RESERVED', 'READY_TO_FULFILL', 'FULFILLED', 'CANCELED'] })
  preorderStatus?: string;

  @ApiProperty({ required: false })
  expectedShipDate?: Date;

  @ApiProperty({ required: false })
  reservedQuantity?: number;

  // Prescription fields
  @ApiProperty({ required: false })
  isPrescription?: boolean;

  @ApiProperty({
    required: false,
    enum: ['PENDING_REVIEW', 'NEEDS_UPDATE', 'APPROVED', 'IN_MANUFACTURING', 'READY_TO_SHIP', 'COMPLETED'],
  })
  prescriptionStatus?: string;

  @ApiProperty({ required: false, type: PrescriptionDataDto })
  prescriptionData?: PrescriptionDataDto;

  @ApiProperty({ required: false })
  prescriptionUrl?: string;
}

/**
 * Order payment response
 */
export class OrderPaymentResponseDto {
  @ApiProperty({ enum: ['VNPAY', 'CASH', 'BANK_TRANSFER'] })
  method: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ required: false })
  transactionId?: string;

  @ApiProperty({ required: false })
  paidAt?: Date;

  @ApiProperty({ required: false })
  status?: 'PENDING' | 'PAID' | 'FAILED';
}

/**
 * Order tracking response
 */
export class OrderTrackingResponseDto {
  @ApiProperty({ required: false })
  carrier?: string;

  @ApiProperty({ required: false })
  trackingNumber?: string;

  @ApiProperty({ required: false })
  estimatedDelivery?: Date;

  @ApiProperty({ required: false })
  actualDelivery?: Date;
}

/**
 * Order history item
 */
export class OrderHistoryItemDto {
  @ApiProperty()
  status: ORDER_STATUS;

  @ApiProperty({ required: false })
  changedBy?: string;

  @ApiProperty()
  timestamp: Date;

  @ApiProperty({ required: false })
  note?: string;
}

/**
 * Order response
 */
export class OrderResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty({ enum: ORDER_TYPES })
  orderType: ORDER_TYPES;

  @ApiProperty({ enum: ORDER_STATUS })
  orderStatus: ORDER_STATUS;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  shippingFee: number;

  @ApiProperty()
  tax: number;

  @ApiProperty({ required: false })
  comboDiscount?: number;

  @ApiProperty({ required: false })
  comboId?: string;

  @ApiProperty({ required: false })
  promotionDiscount?: number;

  @ApiProperty({ required: false })
  promotionId?: string;

  @ApiProperty({ required: false })
  promotionCode?: string;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ required: false })
  payment?: OrderPaymentResponseDto;

  @ApiProperty({ required: false })
  tracking?: OrderTrackingResponseDto;

  @ApiProperty({ required: false })
  assignedStaffId?: string;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty({ type: [OrderHistoryItemDto], required: false })
  history?: OrderHistoryItemDto[];

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;
}

/**
 * Update order status DTO (admin)
 */
export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ORDER_STATUS })
  @IsEnum(ORDER_STATUS)
  status: ORDER_STATUS;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

/**
 * Sales approval DTO
 */
export class ApproveOrderDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

/**
 * Approve prescription DTO (Sales staff)
 */
export class ApprovePrescriptionDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsMongoId()
  itemId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

/**
 * Request prescription update DTO (Sales staff)
 */
export class RequestPrescriptionUpdateDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsMongoId()
  itemId: string;

  @ApiProperty({ example: 'PD value is missing or incorrect' })
  @IsString()
  message: string;
}

/**
 * Update manufacturing status DTO (Operations staff)
 */
export class UpdateManufacturingStatusDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsMongoId()
  itemId: string;

  @ApiProperty({
    enum: ['IN_MANUFACTURING', 'READY_TO_SHIP', 'COMPLETED'],
    example: 'IN_MANUFACTURING',
  })
  @IsEnum(['IN_MANUFACTURING', 'READY_TO_SHIP', 'COMPLETED'])
  status: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

/**
 * Cancel order DTO
 */
export class CancelOrderDto {
  @ApiProperty({ example: 'Changed my mind' })
  @IsString()
  reason: string;
}

/**
 * Order list query params
 */
export class OrderListQueryDto {
  @ApiProperty({ required: false, enum: ORDER_STATUS })
  @IsOptional()
  @IsEnum(ORDER_STATUS)
  status?: ORDER_STATUS;

  @ApiProperty({ required: false, description: 'Set to true to show all orders regardless of status' })
  @IsOptional()
  @IsString()
  showAll?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, example: '1' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiProperty({ required: false, example: '10' })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiProperty({ required: false, example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ required: false, enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

/**
 * Order list response
 */
export class OrderListResponseDto {
  @ApiProperty({ type: [OrderResponseDto] })
  orders: OrderResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

/**
 * Checkout response
 */
export class CheckoutResponseDto {
  @ApiProperty()
  order: OrderResponseDto;

  @ApiProperty({
    required: false,
    description: 'VNPay payment URL if payment method is VNPAY',
  })
  paymentUrl?: string;
}

/**
 * VNPay callback DTO
 */
export class VNPayCallbackDto {
  @ApiProperty()
  vnp_Amount: string;

  @ApiProperty()
  vnp_BankCode: string;

  @ApiProperty()
  vnp_BankTranNo: string;

  @ApiProperty()
  vnp_CardType: string;

  @ApiProperty()
  vnp_OrderInfo: string;

  @ApiProperty()
  vnp_PayDate: string;

  @ApiProperty()
  vnp_ResponseCode: string;

  @ApiProperty()
  vnp_TmnCode: string;

  @ApiProperty()
  vnp_TransactionNo: string;

  @ApiProperty()
  vnp_TxnRef: string;

  @ApiProperty()
  vnp_SecureHash: string;
}

/**
 * Shipping methods
 */
export const SHIPPING_METHODS = {
  STANDARD: {
    name: 'Standard',
    displayName: 'Standard Delivery',
    fee: 30000,
    estimatedDays: '3-5 business days',
  },
  EXPRESS: {
    name: 'Express',
    displayName: 'Express Delivery',
    fee: 50000,
    estimatedDays: '1-2 business days',
  },
};
