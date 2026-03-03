import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  VNPayPaymentRequestDto,
  VNPayPaymentResponseDto,
  VNPayCallbackParamsDto,
  VNPayVerificationResultDto,
  VNPAY_RESPONSE_CODES,
  VNPayHelpers,
} from '../dtos/vnpay.dto';

@Injectable()
export class VNPayService {
  private readonly tmnCode: string;
  private readonly hashSecret: string;
  private readonly paymentUrl: string;
  private readonly isSandbox: boolean;

  constructor(private readonly configService: ConfigService) {
    this.tmnCode = this.configService.get('VNPAY_TMN_CODE') || 'VNPAYMERCHANT';
    this.hashSecret =
      this.configService.get('VNPAY_HASH_SECRET') || 'SECRET_KEY';
    this.paymentUrl =
      this.configService.get('VNPAY_PAYMENT_URL') ||
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.isSandbox = this.configService.get('VNPAY_SANDBOX') !== 'false';
  }

  /**
   * Generate VNPay payment URL
   */
  createPaymentUrl(
    request: VNPayPaymentRequestDto,
  ): Promise<VNPayPaymentResponseDto> {
    const {
      amount,
      orderDescription,
      clientIp,
      returnUrl,
      locale = 'vn',
    } = request;

    const txnRef = VNPayHelpers.generateTxnRef();
    const formattedAmount = VNPayHelpers.formatAmount(amount);
    const requestDate = VNPayHelpers.formatDate();

    // Build payment params
    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: orderDescription.substring(0, 255), // Max 255 chars
      vnp_OrderType: 'billpayment',
      vnp_Amount: formattedAmount.toString(),
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: clientIp || '127.0.0.1',
      vnp_CreateDate: requestDate,
    };

    // Sort params alphabetically by key
    const sortedParams = Object.keys(params).sort();
    const queryString = sortedParams
      .map((key) => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    // Generate hash
    const hash = this.generateHmacSha512(queryString);

    // Construct payment URL
    const paymentUrl = `${this.paymentUrl}?${queryString}&vnp_SecureHash=${hash}`;

    return Promise.resolve({
      paymentUrl,
      txnRef,
    });
  }

  /**
   * Verify VNPay callback
   */
  verifyCallback(
    callback: VNPayCallbackParamsDto,
  ): Promise<VNPayVerificationResultDto> {
    const {
      vnp_ResponseCode,
      vnp_TmnCode,
      vnp_Amount,
      vnp_BankCode,
      vnp_TransactionNo,
      vnp_TxnRef,
      vnp_SecureHash,
    } = callback;

    // Verify TMN code
    if (vnp_TmnCode !== this.tmnCode) {
      return Promise.resolve({
        success: false,
        responseCode: '99',
        message: 'Invalid merchant',
        amount: VNPayHelpers.parseAmount(vnp_Amount),
      });
    }

    // Verify signature
    const paramsToHash = { ...callback };

    // Remove hash fields before verification
    const sortedParams = Object.keys(paramsToHash)
      .filter((key) => key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType')
      .sort();
    const hashData = sortedParams
      .map(
        (key) => `${key}=${paramsToHash[key as keyof VNPayCallbackParamsDto]}`,
      )
      .join('&');

    const calculatedHash = this.generateHmacSha512(hashData);

    if (calculatedHash !== vnp_SecureHash) {
      return Promise.resolve({
        success: false,
        responseCode: '99',
        message: 'Invalid signature',
        amount: VNPayHelpers.parseAmount(vnp_Amount),
      });
    }

    // Check response code
    const success = vnp_ResponseCode === VNPAY_RESPONSE_CODES.SUCCESS;

    return Promise.resolve({
      success,
      responseCode: vnp_ResponseCode,
      message: VNPayHelpers.getResponseMessage(vnp_ResponseCode),
      transactionId: vnp_TransactionNo || vnp_TxnRef,
      amount: VNPayHelpers.parseAmount(vnp_Amount),
      bankCode: vnp_BankCode,
    });
  }

  /**
   * Query transaction status
   */
  queryTransaction(
    orderId: string,
    txnRef: string,
    clientIp: string,
  ): Promise<VNPayVerificationResultDto> {
    const requestDate = VNPayHelpers.formatDate();

    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'querydr',
      vnp_TmnCode: this.tmnCode,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Query transaction for order ${orderId}`,
      vnp_IpAddr: clientIp,
      vnp_CreateDate: requestDate,
    };

    const sortedParams = Object.keys(params).sort();
    const queryString = sortedParams
      .map((key) => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const hash = this.generateHmacSha512(queryString);

    // In production, make actual API call to VNPay query endpoint
    // For now, return mock response
    // TODO: Use queryString and hash for actual API call
    return Promise.resolve({
      success: false,
      responseCode: '99',
      message: 'Query not implemented in sandbox mode',
      amount: 0,
    });
  }

  /**
   * Process refund (future implementation)
   */
  processRefund(): Promise<{ success: boolean; message: string }> {
    // Refund requires additional VNPay configuration and API calls
    // This is a placeholder for future implementation
    return Promise.resolve({
      success: false,
      message: 'Refund not yet implemented',
    });
  }

  /**
   * Generate HMAC-SHA512 hash
   */
  private generateHmacSha512(data: string): string {
    return crypto
      .createHmac('sha512', this.hashSecret)
      .update(data, 'utf-8')
      .digest('hex');
  }

  /**
   * Check if service is in sandbox mode
   */
  isSandboxMode(): boolean {
    return this.isSandbox;
  }

  /**
   * Get VNPay configuration status
   */
  getConfigStatus(): {
    configured: boolean;
    isSandbox: boolean;
    tmnCode: string;
  } {
    return {
      configured: !!this.hashSecret && this.hashSecret !== 'SECRET_KEY',
      isSandbox: this.isSandbox,
      tmnCode: this.tmnCode,
    };
  }

  /**
   * Mock payment success (for testing without actual VNPay)
   * This can be used in development/testing environments
   */
  mockSuccessfulPayment(
    orderId: string,
    amount: number,
  ): VNPayVerificationResultDto {
    return {
      success: true,
      responseCode: VNPAY_RESPONSE_CODES.SUCCESS,
      message: 'Mock successful payment',
      transactionId: VNPayHelpers.generateTxnRef(),
      amount,
    };
  }

  /**
   * Mock payment failure (for testing error scenarios)
   */
  mockFailedPayment(
    orderId: string,
    amount: number,
  ): VNPayVerificationResultDto {
    return {
      success: false,
      responseCode: VNPAY_RESPONSE_CODES.TRANSACTION_FAILED,
      message: 'Mock failed payment',
      amount,
    };
  }
}
