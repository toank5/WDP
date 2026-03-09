import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import {
  FiCheckCircle,
  FiShoppingBag,
  FiTruck,
  FiArrowLeft,
  FiHome,
  FiFileText,
  FiLoader,
} from 'react-icons/fi'
import { orderApi, Order } from '@/lib/order-api'
import { formatImageUrl } from '@/lib/product-api'

// VND Price formatter
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

// Format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Status badge component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig: Record<string, { color: string; label: string }> = {
    PENDING: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
    PENDING_PAYMENT: { color: 'bg-orange-100 text-orange-700', label: 'Pending Payment' },
    PROCESSING: { color: 'bg-blue-100 text-blue-700', label: 'Processing' },
    CONFIRMED: { color: 'bg-green-100 text-green-700', label: 'Confirmed' },
    SHIPPED: { color: 'bg-purple-100 text-purple-700', label: 'Shipped' },
    DELIVERED: { color: 'bg-emerald-100 text-emerald-700', label: 'Delivered' },
    RETURNED: { color: 'bg-red-100 text-red-700', label: 'Returned' },
    CANCELLED: { color: 'bg-gray-100 text-gray-700', label: 'Cancelled' },
  }

  const config = statusConfig[status] || statusConfig.PENDING

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${config.color}`}>
      {config.label}
    </span>
  )
}

const OrderSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const orderNumberParam = searchParams.get('orderNumber')
  const effectiveOrderId = orderId || orderNumberParam

  useEffect(() => {
    if (effectiveOrderId) {
      loadOrder(effectiveOrderId)
    } else {
      navigate('/orders')
    }
  }, [effectiveOrderId])

  const loadOrder = async (id: string) => {
    try {
      // Try to get order by orderNumber first (for VNPAY callback), fallback to orderId
      let orderData: Order
      try {
        // First try getting by order number (for VNPAY redirect)
        orderData = await orderApi.getOrderByNumber(id)
      } catch {
        // Fallback to getting by ID (for existing flow)
        orderData = await orderApi.getOrderById(id)
      }
      setOrder(orderData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load order'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading your order...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <FiCheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-slate-600 mb-6">
            Thank you for your order. We've received your order and will begin processing it
            shortly.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/orders"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase tracking-wider rounded-xs transition-colors"
            >
              View Orders
            </Link>
            <Link
              to="/products"
              className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm uppercase tracking-wider rounded-xs transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Calculate estimated delivery
  const estimatedDelivery = new Date(order.createdAt)
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5) // Standard 5 days

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Header Bar */}
      <div className="bg-slate-100 border-b border-slate-300">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/products"
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-semibold"
          >
            <FiArrowLeft /> Continue Shopping
          </Link>
          <h1 className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Order Confirmation
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Message */}
        <div className="bg-white border-2 border-emerald-200 rounded-lg shadow-sm p-8 mb-8 text-center">
          <FiCheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-slate-600 mb-4">
            Thank you for your order. We've sent a confirmation email with your order details.
          </p>
          <p className="text-lg font-bold text-blue-700">
            Order Number: <span className="font-black">{order.orderNumber}</span>
          </p>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Order Status */}
          <div className="bg-white border border-slate-300 rounded-xs shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiFileText className="text-blue-600" />
              <h2 className="font-bold text-slate-900">Order Status</h2>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Status:</span>
                <StatusBadge status={order.orderStatus} />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Order Date:</span>
                <span className="text-sm font-semibold text-slate-900">
                  {formatDate(order.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Est. Delivery:</span>
                <span className="text-sm font-semibold text-slate-900">
                  {formatDate(estimatedDelivery.toISOString())}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white border border-slate-300 rounded-xs shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiTruck className="text-blue-600" />
              <h2 className="font-bold text-slate-900">Shipping Address</h2>
            </div>
            <div>
              <p className="font-bold text-slate-900">{order.shippingAddress.fullName}</p>
              <p className="text-sm text-slate-600">{order.shippingAddress.phone}</p>
              <p className="text-sm text-slate-600 mt-2">
                {order.shippingAddress.address}, {order.shippingAddress.ward ? `${order.shippingAddress.ward}, ` : ''}
                {order.shippingAddress.district}, {order.shippingAddress.city}
              </p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white border border-slate-300 rounded-xsadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiFileText className="text-blue-600" />
              <h2 className="font-bold text-slate-900">Payment</h2>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Method:</span>
                <span className="text-sm font-semibold text-slate-900">{order.payment?.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Status:</span>
                <span className={`text-sm font-semibold ${order.payment?.paidAt ? 'text-emerald-600' : 'text-yellow-600'}`}>
                  {order.payment?.paidAt ? 'Paid' : 'Pending'}
                </span>
              </div>
              {order.payment?.transactionId && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Transaction ID:</span>
                  <span className="text-sm font-semibold text-slate-900 truncate max-w-30">
                    {order.payment.transactionId}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white border border-slate-300 rounded-xs shadow-sm overflow-hidden mb-8">
          <div className="bg-slate-100 border-b border-slate-300 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FiShoppingBag className="text-blue-600" />
              Order Items ({order.items.length})
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {order.items.map((item, index) => (
              <div key={item._id || index} className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {item.productImage ? (
                    <img
                      src={formatImageUrl(item.productImage)}
                      alt={item.productName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">
                    {item.productName || 'Product'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.variantDetails?.size && `Size: ${item.variantDetails.size}`}
                    {item.variantDetails?.size && item.variantDetails?.color && ' | '}
                    {item.variantDetails?.color && `Color: ${item.variantDetails.color}`}
                  </p>
                  <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-bold text-slate-900">
                  {formatPrice(item.priceAtOrder * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white border border-slate-300 rounded-xs shadow-sm overflow-hidden mb-8">
          <div className="bg-slate-100 border-b border-slate-300 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-900">Order Summary</h2>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Shipping Fee</span>
              <span>{formatPrice(order.shippingFee)}</span>
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-base font-bold text-slate-900">Total</span>
              <span className="text-2xl font-bold text-blue-700">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={`/orders/${order._id}`}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase tracking-wider rounded-xs transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <FiFileText />
            Track Order
          </Link>
          <Link
            to="/orders"
            className="px-8 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm uppercase tracking-wider rounded-xs transition-colors flex items-center justify-center gap-2"
          >
            View All Orders
          </Link>
          <Link
            to="/products"
            className="px-8 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm uppercase tracking-wider rounded-xs transition-colors flex items-center justify-center gap-2"
          >
            <FiHome />
            Continue Shopping
          </Link>
        </div>

        {/* Order Notes */}
        {order.notes && (
          <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> {order.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderSuccessPage
