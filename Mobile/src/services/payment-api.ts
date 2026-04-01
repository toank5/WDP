import { API_ENDPOINTS, get, post } from './api'

/**
 * Payment configuration types
 */
export interface PaymentConfig {
  vnpay: {
    enabled: boolean
    qrCode?: string
    paymentUrl?: string
    merchantCode?: string
  }
  momo: {
    enabled: boolean
    phoneNumber?: string
  }
  bankTransfer: {
    enabled: boolean
    bankName: string
    accountNumber: string
    accountHolder: string
    branch: string
    swiftCode?: string
  }
}

/**
 * VNPay payment request types
 */
export interface VnpayPaymentRequest {
  orderId: string
  amount: number
  orderInfo?: string
  returnUrl?: string
  ipAddress?: string
}

export interface VnpayPaymentResponse {
  paymentUrl: string
  qrCode: string
  txnRef: string
  expiryTime: string
}

/**
 * Get payment configuration from backend
 */
export async function getPaymentConfig(): Promise<PaymentConfig> {
  return get<PaymentConfig>('/payment/config')
}

/**
 * Create VNPay payment and get payment URL
 */
export async function getVnpayPaymentUrl(
  request: VnpayPaymentRequest
): Promise<VnpayPaymentResponse> {
  return post<VnpayPaymentResponse>('/payment/vnpay/create', request)
}

/**
 * Verify VNPay payment callback
 */
export interface VnpayVerifyRequest {
  vnp_TmnCode: string
  vnp_Amount: string
  vnp_BankCode: string
  vnp_BankTranNo: string
  vnp_CardType: string
  vnp_OrderInfo: string
  vnp_PayDate: string
  vnp_ResponseCode: string
  vnp_TransactionNo: string
  vnp_TxnRef: string
  vnp_SecureHash: string
}

export async function verifyVnpayPayment(
  request: VnpayVerifyRequest
): Promise<{ success: boolean; message: string; orderId?: string }> {
  return post<{ success: boolean; message: string; orderId?: string }>(
    '/payment/vnpay/verify',
    request
  )
}
