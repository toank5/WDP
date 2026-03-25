import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FiCheckCircle, FiXCircle, FiLoader, FiArrowLeft, FiCreditCard } from 'react-icons/fi'

const VNPayReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    // Parse VNPay response parameters
    const vnp_ResponseCode = searchParams.get('vnp_ResponseCode')
    const vnp_TxnRef = searchParams.get('vnp_TxnRef')
    const vnp_OrderInfo = searchParams.get('vnp_OrderInfo')
    const vnp_TransactionNo = searchParams.get('vnp_TransactionNo')
    const vnp_Amount = searchParams.get('vnp_Amount')

    console.log('VNPay return params:', {
      vnp_ResponseCode,
      vnp_TxnRef,
      vnp_OrderInfo,
      vnp_TransactionNo,
      vnp_Amount,
    })

    // Check response code
    if (vnp_ResponseCode === '00') {
      setStatus('success')
      // Redirect to order success after 3 seconds
      setTimeout(() => {
        // Extract order ID from vnp_OrderInfo or vnp_TxnRef
        navigate('/orders')
      }, 3000)
    } else {
      setStatus('failed')
      setErrorMessage(getVNPayErrorMessage(vnp_ResponseCode || ''))
    }
  }, [searchParams, navigate])

  const getVNPayErrorMessage = (code: string): string => {
    const messages: Record<string, string> = {
      '07': 'Giao dịch bị nghi ngờ gian lận',
      '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ Internet Banking',
      '10': 'Thẻ/Tài khoản chưa được kích hoạt',
      '11': 'Thẻ/Tài khoản đã hết hạn',
      '12': 'Thẻ/Tài khoản bị khóa',
      '13': 'Bạn đã nhập sai mật khẩu quá số lần quy định',
      '15': 'Giao dịch đã quá thời gian chờ thanh toán. Quý khách vui lòng thực hiện lại giao dịch',
      '24': 'Giao dịch bị hủy',
      '51': 'Tài khoản không đủ số dư để thanh toán',
      '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
      '75': 'Ngân hàng thanh toán đang bảo trì',
      '79': 'Giao dịch vượt quá số lần thanh toán cho phép',
      default: 'Giao dịch thất bại. Vui lòng thử lại sau.',
    }
    return messages[code] || messages.default
  }

  const formatAmount = (amount: string | null): string => {
    if (!amount) return '0₫'
    const parsedAmount = parseInt(amount, 10)
    if (Number.isNaN(parsedAmount)) return '0₫'
    const amountNumber = parsedAmount / 100 // VNPay returns amount * 100
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amountNumber)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {status === 'loading' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <FiLoader className="w-16 h-16 mx-auto text-blue-600 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Đang xử lý thanh toán...
            </h2>
            <p className="text-slate-600">Vui lòng đợi trong giây lát</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Thanh toán thành công!
            </h2>
            <p className="text-slate-600 mb-4">
              Đơn hàng của bạn đã được thanh toán thành công
            </p>

            {searchParams.get('vnp_Amount') && (
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-500 mb-1">Số tiền</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatAmount(searchParams.get('vnp_Amount'))}
                </p>
              </div>
            )}

            <div className="space-y-2 text-sm text-slate-600 mb-6">
              {searchParams.get('vnp_TransactionNo') && (
                <p>
                  <span className="font-semibold">Mã giao dịch:</span>{' '}
                  {searchParams.get('vnp_TransactionNo')}
                </p>
              )}
              {searchParams.get('vnp_TxnRef') && (
                <p>
                  <span className="font-semibold">Mã tham chiếu:</span>{' '}
                  {searchParams.get('vnp_TxnRef')}
                </p>
              )}
            </div>

            <p className="text-sm text-slate-500 mb-4">
              Bạn sẽ được chuyển đến trang đơn hàng sau 3 giây...
            </p>

            <button
              onClick={() => navigate('/orders')}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <FiCreditCard />
              Xem đơn hàng
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <FiXCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Thanh toán thất bại
            </h2>
            <p className="text-slate-600 mb-6">{errorMessage}</p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/cart')}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
              >
                Thử lại
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FiArrowLeft />
                Về trang chủ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VNPayReturnPage
