import React from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  FiXCircle,
  FiArrowLeft,
  FiRefreshCw,
  FiHome,
  FiShoppingBag,
} from 'react-icons/fi'

const OrderFailedPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderNumber = searchParams.get('orderNumber')
  const reason = searchParams.get('reason') || 'Payment processing failed'

  const handleRetryPayment = () => {
    if (orderNumber) {
      navigate('/checkout')
    } else {
      navigate('/cart')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Header Bar */}
      <div className="bg-slate-100 border-b border-slate-300">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-semibold"
          >
            <FiArrowLeft /> Go Back
          </button>
          <h1 className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Payment Failed
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Failed Message */}
        <div className="bg-white border-2 border-red-200 rounded-lg shadow-sm p-8 mb-8 text-center">
          <FiXCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Failed</h1>
          <p className="text-slate-600 mb-4">
            We couldn't process your payment. Please try again or contact support if the
            problem persists.
          </p>

          {orderNumber && (
            <p className="text-lg text-slate-700 mb-4">
              Order Number: <span className="font-bold">{orderNumber}</span>
            </p>
          )}

          {reason && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 mt-4">
              <p className="text-sm text-red-700">
                <strong>Reason:</strong> {decodeURIComponent(reason)}
              </p>
            </div>
          )}
        </div>

        {/* Help Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="font-bold text-slate-900 mb-3">What you can do:</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>
                <strong>Try Again:</strong> Your order is saved. Click "Retry Payment" to try
                again with a different payment method.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>
                <strong>Check Your Account:</strong> Make sure you have sufficient funds and
                your payment details are correct.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>
                <strong>Contact Support:</strong> If the problem persists, contact our support
                team with your order number.
              </span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRetryPayment}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase tracking-wider rounded-[2px] transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <FiRefreshCw />
            Retry Payment
          </button>
          <Link
            to="/orders"
            className="px-8 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm uppercase tracking-wider rounded-[2px] transition-colors flex items-center justify-center gap-2"
          >
            <FiShoppingBag />
            View My Orders
          </Link>
          <Link
            to="/products"
            className="px-8 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm uppercase tracking-wider rounded-[2px] transition-colors flex items-center justify-center gap-2"
          >
            <FiHome />
            Continue Shopping
          </Link>
        </div>

        {/* Contact Support Section */}
        <div className="mt-8 bg-white border border-slate-300 rounded-[2px] shadow-sm p-6">
          <h3 className="font-bold text-slate-900 mb-3">Need Help?</h3>
          <p className="text-sm text-slate-600 mb-4">
            Our customer support team is available to assist you with any payment issues.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <strong>Hotline:</strong>
              <span className="text-blue-600">1900-xxxx</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <strong>Email:</strong>
              <span className="text-blue-600">support@eyewear.com</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <strong>Hours:</strong>
              <span>Mon-Fri: 8:00 AM - 6:00 PM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderFailedPage
