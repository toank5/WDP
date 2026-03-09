import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { VNPay } from 'vnpay';
import { HashAlgorithm, ProductCode, VnpLocale } from 'vnpay/enums';
import type { ReturnQueryFromVNPay } from 'vnpay/types';
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
  private readonly logger = new Logger(VNPayService.name);
  private readonly tmnCode: string;
  private readonly hashSecret: string;
  private readonly paymentUrl: string;
  private readonly isSandbox: boolean;
  private readonly returnUrl: string;
  private readonly ipnUrl: string;
  private readonly vnpayClient: VNPay;

  constructor(private readonly configService: ConfigService) {
    this.tmnCode = this.configService.get('VNPAY_TMN_CODE') || 'VNPAYMERCHANT';
    this.hashSecret =
      this.configService.get('VNPAY_HASH_SECRET') || 'SECRET_KEY';
    this.paymentUrl =
      this.configService.get('VNPAY_PAYMENT_URL') ||
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.isSandbox = this.configService.get('VNPAY_SANDBOX') !== 'false';
    this.returnUrl =
      this.configService.get('VNPAY_RETURN_URL') ||
      'http://localhost:8386/checkout/vnpay-return';
    this.ipnUrl =
      this.configService.get('VNPAY_IPN_URL') ||
      'http://localhost:8386/checkout/vnpay-ipn';

    const vnpayHost = this.resolveVnpayHost(this.paymentUrl);
    this.vnpayClient = new VNPay({
      tmnCode: this.tmnCode,
      secureSecret: this.hashSecret,
      vnpayHost,
      testMode: this.isSandbox,
      hashAlgorithm: HashAlgorithm.SHA512,
      enableLog: false,
    });

    this.logger.log(
      `VNPay config loaded | sandbox=${this.isSandbox} tmnCode=${this.tmnCode} host=${vnpayHost} returnUrl=${this.returnUrl} ipnUrl=${this.ipnUrl}`,
    );
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
      locale = 'vn',
      returnUrl,
    } = request;
    this.logger.log(
      `Creating VNPay payment URL for orderNumber=${request.orderNumber} orderId=${request.orderId}`,
    );

    const txnRef = this.buildTxnRef(request.orderNumber, request.orderId);
    const requestDate = Number(VNPayHelpers.formatDate());
    const expireDate = Number(
      VNPayHelpers.formatDate(new Date(Date.now() + 15 * 60 * 1000)),
    );

    const paymentUrl = this.vnpayClient.buildPaymentUrl({
      vnp_Amount: amount,
      vnp_IpAddr: clientIp || '127.0.0.1',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: orderDescription.substring(0, 255),
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: returnUrl || this.returnUrl,
      vnp_Locale: locale === 'en' ? VnpLocale.EN : VnpLocale.VN,
      vnp_CreateDate: requestDate,
      vnp_ExpireDate: expireDate,
    });

    this.logger.log(
      `VNPay payment URL generated successfully | txnRef=${txnRef}`,
    );
    this.logger.debug(
      `VNPay params | txnRef=${txnRef} amountVnd=${amount} ip=${clientIp || '127.0.0.1'} locale=${locale} createDate=${requestDate} expireDate=${expireDate}`,
    );

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
    const { vnp_TxnRef, vnp_ResponseCode } = callback;

    this.logger.log(
      `Verifying VNPay callback | txnRef=${vnp_TxnRef} responseCode=${vnp_ResponseCode}`,
    );

    const verification = this.vnpayClient.verifyIpnCall(
      callback as unknown as ReturnQueryFromVNPay,
    );
    const responseCode = String(callback.vnp_ResponseCode ?? '99');
    const success =
      verification.isVerified &&
      verification.isSuccess &&
      responseCode === VNPAY_RESPONSE_CODES.SUCCESS;

    if (!verification.isVerified) {
      this.logger.warn(
        `VNPay callback signature invalid | txnRef=${vnp_TxnRef} message=${verification.message}`,
      );
    }

    this.logger.log(
      `VNPay callback verified | txnRef=${vnp_TxnRef} success=${success}`,
    );

    return Promise.resolve({
      success,
      responseCode,
      message: verification.message,
      transactionId: String(verification.vnp_TransactionNo || '') || vnp_TxnRef,
      amount: this.toAmountInVnd(verification.vnp_Amount),
      bankCode: String(verification.vnp_BankCode || ''),
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

  private buildQueryString(params: Record<string, string>): string {
    return Object.keys(params)
      .sort()
      .map((key) => {
        const encodedValue = encodeURIComponent(params[key]).replace(
          /%20/g,
          '+',
        );
        return `${key}=${encodedValue}`;
      })
      .join('&');
  }

  private buildTxnRef(orderNumber?: string, orderId?: string): string {
    const raw = (orderNumber || orderId || VNPayHelpers.generateTxnRef())
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 34);

    return raw || VNPayHelpers.generateTxnRef().slice(0, 34);
  }

  private toAmountInVnd(value: unknown): number {
    if (typeof value === 'number') {
      return value > 1000 ? value / 100 : value;
    }

    if (typeof value === 'string' && value.trim()) {
      return VNPayHelpers.parseAmount(value);
    }

    return 0;
  }

  private resolveVnpayHost(paymentUrl: string): string {
    try {
      return new URL(paymentUrl).origin;
    } catch {
      return 'https://sandbox.vnpayment.vn';
    }
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
