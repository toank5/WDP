import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsObject } from 'class-validator';

/**
 * Shipping address for checkout
 */
export class CheckoutAddressDto {
  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '0123456789' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123 Street Name' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Ho Chi Minh City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'District 1' })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({ example: 'Ward 1', required: false })
  @IsString()
  @IsOptional()
  ward?: string;

  @ApiProperty({ example: '700000', required: false })
  @IsString()
  @IsOptional()
  zipCode?: string;
}

/**
 * Create checkout session request
 */
export class CreateCheckoutDto {
  @ApiProperty({
    description: 'Shipping address',
    type: CheckoutAddressDto,
  })
  @IsObject()
  @IsNotEmpty()
  shippingAddress: CheckoutAddressDto;

  @ApiProperty({
    description: 'Additional notes for the order',
    example: 'Please call before delivery',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Client IP address for VNPAY',
    example: '127.0.0.1',
    required: false,
  })
  @IsString()
  @IsOptional()
  clientIp?: string;
}

/**
 * Cart item for checkout validation
 */
export class CheckoutItemDto {
  productId: string;
  variantSku?: string;
  quantity: number;
  price: number;
  productName?: string;
  productImage?: string;
  variantDetails?: {
    size?: string;
    color?: string;
  };
  isPreorder?: boolean;
}

/**
 * Checkout calculation details
 */
export interface CheckoutCalculation {
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  items: CheckoutItemDto[];
}

/**
 * Create checkout response
 */
export class CreateCheckoutResponseDto {
  @ApiProperty({ description: 'Payment URL to redirect to' })
  paymentUrl: string;

  @ApiProperty({ description: 'Order ID' })
  orderId: string;

  @ApiProperty({ description: 'Order number' })
  orderNumber: string;

  @ApiProperty({ description: 'Transaction reference' })
  txnRef: string;

  @ApiProperty({ description: 'Total amount to pay' })
  amount: number;
}

/**
 * VNPAY IPN Response format (required by VNPAY)
 */
export class VNPayIpnResponseDto {
  @ApiProperty({ description: 'Response code: 00 = success' })
  RspCode: string;

  @ApiProperty({ description: 'Response message' })
  Message: string;
}

/**
 * Order created for checkout
 */
export interface CheckoutOrderInfo {
  orderId: string;
  orderNumber: string;
  customerId: string;
  totalAmount: number;
  items: Array<{
    productId: string;
    variantSku?: string;
    quantity: number;
    priceAtOrder: number;
    isPreorder: boolean;
  }>;
}
