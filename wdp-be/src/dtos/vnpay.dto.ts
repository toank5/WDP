import { ApiProperty } from '@nestjs/swagger';

/**
 * VNPay configuration DTO
 */
export class VNPayConfigDto {
  @ApiProperty({
    description: 'VNPay TMN Code (Merchant ID)',
    example: 'VNPAY123',
  })
  tmnCode: string;

  @ApiProperty({
    description: 'VNPay Secret Key (Hash secret)',
    example: 'SECRET_KEY',
  })
  hashSecret: string;

  @ApiProperty({
    description: 'VNPay Payment URL',
    example: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  })
  paymentUrl: string;

  @ApiProperty({
    description: 'Return URL after payment',
    example: 'http://localhost:5173/order-success',
  })
  returnUrl: string;
}

/**
 * VNPay payment request
 */
export class VNPayPaymentRequestDto {
  @ApiProperty({ description: 'Order ID', example: '507f1f77bcf86cd799439011' })
  orderId: string;

  @ApiProperty({
    description: 'Order number (user-friendly)',
    example: 'ORD-2024-001234',
  })
  orderNumber: string;

  @ApiProperty({ description: 'Payment amount in VND', example: 150000 })
  amount: number;

  @ApiProperty({
    description: 'Order description',
    example: 'Payment for order ORD-2024-001234',
  })
  orderDescription: string;

  @ApiProperty({ description: 'Customer IP address', example: '127.0.0.1' })
  clientIp: string;

  @ApiProperty({
    description: 'Return URL after payment',
    example: 'http://localhost:5173/order-success',
  })
  returnUrl: string;

  @ApiProperty({
    description: 'Payment language',
    example: 'vn',
    required: false,
  })
  locale?: string;
}

/**
 * VNPay payment response
 */
export class VNPayPaymentResponseDto {
  @ApiProperty({
    description: 'Payment URL to redirect user to',
    example:
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Params=...',
  })
  paymentUrl: string;

  @ApiProperty({ description: 'Transaction reference', example: '1234567890' })
  txnRef: string;
}

/**
 * VNPay callback params (from VNPay redirect)
 */
export class VNPayCallbackParamsDto {
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

  @ApiProperty({ required: false })
  vnp_SecureHashType?: string;
}

/**
 * VNPay verification result
 */
export class VNPayVerificationResultDto {
  @ApiProperty({ description: 'Whether payment was successful', example: true })
  success: boolean;

  @ApiProperty({ description: 'Response code from VNPay', example: '00' })
  responseCode: string;

  @ApiProperty({
    description: 'Response message',
    example: 'Transaction successful',
  })
  message: string;

  @ApiProperty({
    description: 'Transaction ID',
    example: '1234567890',
    required: false,
  })
  transactionId?: string;

  @ApiProperty({ description: 'Payment amount (in VND)', example: '150000' })
  amount: number;

  @ApiProperty({ description: 'Bank code', example: 'VCB', required: false })
  bankCode?: string;
}

/**
 * VNPay query transaction request
 */
export class VNPayQueryRequestDto {
  @ApiProperty({ description: 'Transaction reference', example: '1234567890' })
  txnRef: string;

  @ApiProperty({ description: 'Order ID', example: '507f1f77bcf86cd799439011' })
  orderId: string;

  @ApiProperty({ description: 'Request date/time', example: '20240115103000' })
  requestDate: string;

  @ApiProperty({ description: 'Client IP address', example: '127.0.0.1' })
  clientIp: string;
}

/**
 * VNPay refund request
 */
export class VNPayRefundRequestDto {
  @ApiProperty({
    description: 'Transaction reference to refund',
    example: '1234567890',
  })
  txnRef: string;

  @ApiProperty({ description: 'Refund amount in VND', example: 150000 })
  amount: number;

  @ApiProperty({
    description: 'Refund reason',
    example: 'Customer requested refund',
  })
  reason: string;

  @ApiProperty({ description: 'Request date/time', example: '20240115103000' })
  requestDate: string;

  @ApiProperty({ description: 'Client IP address', example: '127.0.0.1' })
  clientIp: string;
}

/**
 * VNPay response codes
 */
export const VNPAY_RESPONSE_CODES = {
  SUCCESS: '00',
  INVALID_AMOUNT: '01',
  INVALID_ORDER: '02',
  INVALID_SIGNATURE: '04',
  DUPLICATE_TRANSACTION: '05',
  TRANSACTION_NOT_FOUND: '06',
  INSUFFICIENT_BALANCE: '07',
  INVALID_CARD: '09',
  TRANSACTION_FAILED: '97',
  INVALID_REQUEST: '99',
} as const;

/**
 * VNPay helper functions
 */
export class VNPayHelpers {
  /**
   * Format amount for VNPay (multiply by 100, no decimals)
   */
  static formatAmount(amount: number): number {
    return Math.round(amount);
  }

  /**
   * Parse amount from VNPay (divide by 100)
   */
  static parseAmount(vnpayAmount: string): number {
    return parseInt(vnpayAmount, 10) / 100;
  }

  /**
   * Generate transaction reference
   */
  static generateTxnRef(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${timestamp}${random}`;
  }

  /**
   * Format date for VNPay (yyyyMMddHHmmss)
   */
  static formatDate(date: Date = new Date()): string {
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
  }

  /**
   * Get response code message
   */
  static getResponseMessage(code: string): string {
    const messages: Record<string, string> = {
      '00': 'Giao dịch thành công',
      '01': 'Giao dịch chưa hoàn tất',
      '02': 'Giao dịch bị lỗi',
      '04': 'Giao dịch đảo (khớp) ký tự không đúng',
      '05': 'Giao dịch đang xử lý',
      '06': 'Giao dịch chưa tìm thấy',
      '07': 'Giao dịch bị từ chối',
      '09': 'Giao dịch không hợp lệ',
      '97': 'Giao dịch bị lỗi',
      '99': 'Lỗi không xác định',
    };
    return messages[code] || 'Unknown error';
  }
}
