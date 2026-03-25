// VNPay Payment API Types and Helpers

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
  TRANSACTION_TIMEOUT: '15',
  INVALID_CARD: '09',
  TRANSACTION_FAILED: '97',
  INVALID_REQUEST: '99',
} as const

export type VNPayResponseCode = (typeof VNPAY_RESPONSE_CODES)[keyof typeof VNPAY_RESPONSE_CODES]

/**
 * VNPay callback params (from URL query params after payment)
 */
export interface VNPayCallbackParams {
  vnp_Amount: string
  vnp_BankCode?: string
  vnp_BankTranNo?: string
  vnp_CardType?: string
  vnp_OrderInfo: string
  vnp_PayDate: string
  vnp_ResponseCode: string
  vnp_TmnCode: string
  vnp_TransactionNo?: string
  vnp_TxnRef: string
  vnp_SecureHash: string
  vnp_SecureHashType?: string
}

/**
 * VNPay verification result (returned by backend callback endpoint)
 */
export interface VNPayVerificationResult {
  success: boolean
  responseCode: string
  message: string
  transactionId?: string
  amount: number
  bankCode?: string
}

/**
 * VNPay helper functions
 */
export class VNPayHelpers {
  /**
   * Parse VNPay callback params from URL query string
   */
  static parseCallbackParams(url: string): VNPayCallbackParams | null {
    try {
      const urlObj = new URL(url)

      // Get all vnp_ params
      const getParam = (key: string): string | undefined => urlObj.searchParams.get(key) || undefined

      // Extract required params
      const vnp_Amount = getParam('vnp_Amount')
      const vnp_OrderInfo = getParam('vnp_OrderInfo')
      const vnp_PayDate = getParam('vnp_PayDate')
      const vnp_ResponseCode = getParam('vnp_ResponseCode')
      const vnp_TmnCode = getParam('vnp_TmnCode')
      const vnp_TxnRef = getParam('vnp_TxnRef')
      const vnp_SecureHash = getParam('vnp_SecureHash')

      // Validate required params
      if (!vnp_Amount || !vnp_OrderInfo || !vnp_PayDate || !vnp_ResponseCode || !vnp_TmnCode || !vnp_TxnRef || !vnp_SecureHash) {
        return null
      }

      // Build result with explicit type
      const result: VNPayCallbackParams = {
        vnp_Amount,
        vnp_OrderInfo,
        vnp_PayDate,
        vnp_ResponseCode,
        vnp_TmnCode,
        vnp_TxnRef,
        vnp_SecureHash,
        vnp_BankCode: getParam('vnp_BankCode'),
        vnp_BankTranNo: getParam('vnp_BankTranNo'),
        vnp_CardType: getParam('vnp_CardType'),
        vnp_TransactionNo: getParam('vnp_TransactionNo'),
        vnp_SecureHashType: getParam('vnp_SecureHashType'),
      }

      return result
    } catch {
      return null
    }
  }

  /**
   * Check if payment was successful based on response code
   */
  static isPaymentSuccessful(responseCode: string): boolean {
    return responseCode === VNPAY_RESPONSE_CODES.SUCCESS
  }

  /**
   * Get user-friendly message for response code
   */
  static getResponseMessage(code: string): string {
    const messages: Record<string, string> = {
      '00': 'Giao dịch thành công',
      '01': 'Giao dịch chưa hoàn tất',
      '02': 'Giao dịch bị lỗi',
      '04': 'Giao dịch đảo (khớp) ký tự không đúng',
      '05': 'Giao dịch đang xử lý',
      '06': 'Giao dịch chưa tìm thấy',
      '07': 'Giao dịch bị từ chối - số dư không đủ',
      '09': 'Giao dịch không hợp lệ',
      '15': 'Giao dịch đã quá thời gian chờ thanh toán. Quý khách vui lòng thực hiện lại giao dịch',
      '97': 'Giao dịch bị lỗi',
      '99': 'Lỗi hệ thống',
    }
    return messages[code] || 'Lỗi không xác định'
  }

  /**
   * Parse amount from VNPay format
   */
  static parseAmount(vnpayAmount: string): number {
    return parseInt(vnpayAmount, 10)
  }

  /**
   * Format date from VNPay format (yyyyMMddHHmmss) to JS Date
   */
  static parseDate(vnpayDate: string): Date {
    // Format: yyyyMMddHHmmss
    const year = vnpayDate.substring(0, 4)
    const month = vnpayDate.substring(4, 6)
    const day = vnpayDate.substring(6, 8)
    const hour = vnpayDate.substring(8, 10)
    const minute = vnpayDate.substring(10, 12)
    const second = vnpayDate.substring(12, 14)

    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`)
  }

  /**
   * Check if current URL contains VNPay callback params
   */
  static isVNPayCallback(url: string): boolean {
    return url.includes('vnp_TxnRef') && url.includes('vnp_SecureHash')
  }
}

/**
 * Redirect to VNPay payment URL
 */
export function redirectToVNPay(paymentUrl: string): void {
  window.location.href = paymentUrl
}

/**
 * Get VNPay callback params from current URL
 */
export function getCallbackParamsFromUrl(): VNPayCallbackParams | null {
  return VNPayHelpers.parseCallbackParams(window.location.href)
}

/**
 * Extract order ID from VNPay callback
 * The order ID should be passed as a query param by the backend
 */
export function extractOrderIdFromCallback(): string | null {
  const url = new URL(window.location.href)
  return url.searchParams.get('orderId')
}
