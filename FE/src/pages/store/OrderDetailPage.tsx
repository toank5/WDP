import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  FiArrowLeft,
  FiMapPin,
  FiTruck,
  FiCreditCard,
  FiShoppingBag,
  FiFileText,
  FiXCircle,
  FiLoader,
  FiBox,
  FiCheckCircle,
} from 'react-icons/fi'
import { orderApi, Order, OrderStatus } from '@/lib/order-api'
import { formatImageUrl } from '@/lib/product-api'
import { reviewApi, Review, UnreviewedProduct } from '@/lib/review-api'
import { ReviewFormModal } from '@/components/review'
import { FiStar } from 'react-icons/fi'

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
  const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    PENDING: {
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      label: 'Pending',
      icon: <FiFileText className="w-4 h-4" />,
    },
    PENDING_PAYMENT: {
      color: 'bg-orange-100 text-orange-700 border-orange-200',
      label: 'Pending Payment',
      icon: <FiFileText className="w-4 h-4" />,
    },
    PAID: {
      color: 'bg-teal-100 text-teal-700 border-teal-200',
      label: 'Paid',
      icon: <FiCheckCircle className="w-4 h-4" />,
    },
    PROCESSING: {
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      label: 'Processing',
      icon: <FiLoader className="w-4 h-4" />,
    },
    CONFIRMED: {
      color: 'bg-green-100 text-green-700 border-green-200',
      label: 'Confirmed',
      icon: <FiCheckCircle className="w-4 h-4" />,
    },
    SHIPPED: {
      color: 'bg-purple-100 text-purple-700 border-purple-200',
      label: 'Shipped',
      icon: <FiTruck className="w-4 h-4" />,
    },
    DELIVERED: {
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      label: 'Delivered',
      icon: <FiCheckCircle className="w-4 h-4" />,
    },
    RETURNED: {
      color: 'bg-rose-100 text-rose-700 border-rose-200',
      label: 'Returned',
      icon: <FiXCircle className="w-4 h-4" />,
    },
    CANCELLED: {
      color: 'bg-gray-100 text-gray-700 border-gray-200',
      label: 'Cancelled',
      icon: <FiXCircle className="w-4 h-4" />,
    },
  }

  const config = statusConfig[status] || statusConfig.PENDING

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase border ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  )
}

// Order Timeline Component
const OrderTimeline: React.FC<{ history?: Array<{ status: string; timestamp: Date; note?: string }> }> = ({
  history,
}) => {
  if (!history || history.length === 0) return null

  return (
    <div className="space-y-4">
      {history.map((item, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
              <FiCheckCircle size={16} />
            </div>
            {index < history.length - 1 && <div className="w-0.5 h-full bg-slate-200 mt-2" />}
          </div>
          <div className="flex-1 pb-6">
            <StatusBadge status={item.status} />
            <p className="text-sm text-slate-600 mt-1">{formatDate(item.timestamp.toString())}</p>
            {item.note && <p className="text-sm text-slate-500 mt-1">{item.note}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const [userReviews, setUserReviews] = useState<Review[]>([])
  const [unreviewedItems, setUnreviewedItems] = useState<UnreviewedProduct[]>([])
  const [reviewModal, setReviewModal] = useState<{
    open: boolean
    productId: string
    productName: string
    productImage?: string
    orderId: string
    variantSku?: string
    orderNumber: string
  } | null>(null)

  useEffect(() => {
    if (id) {
      loadOrder(id)
      loadReviewsData()
    }
  }, [id])

  const loadReviewsData = async () => {
    try {
      const [reviewsRes, unreviewedRes] = await Promise.all([
        reviewApi.getMyReviews(1, 50),
        reviewApi.getUnreviewedProducts(),
      ])

      setUserReviews(Array.isArray(reviewsRes?.reviews) ? reviewsRes.reviews : [])
      setUnreviewedItems(Array.isArray(unreviewedRes) ? unreviewedRes : [])
    } catch (err) {
      console.error('Failed to load review data', err)
    }
  }

  const handleOpenReviewModal = (
    productId: string,
    productName: string,
    productImage: string | undefined,
    orderId: string,
    variantSku: string | undefined,
    orderNumber: string,
  ) => {
    setReviewModal({
      open: true,
      productId,
      productName,
      productImage,
      orderId,
      variantSku,
      orderNumber,
    })
  }

  const handleCloseReviewModal = () => {
    setReviewModal(null)
    loadReviewsData()
  }

  const loadOrder = async (orderId: string) => {
    setLoading(true)
    try {
      const orderData = await orderApi.getOrderById(orderId)
      setOrder(orderData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load order'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!order) return

    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return
    }

    setCancelling(true)
    try {
      const reason = prompt('Please provide a reason for cancellation:')
      if (!reason) {
        setCancelling(false)
        return
      }

      const updatedOrder = await orderApi.cancelOrder(order._id, { reason })
      setOrder(updatedOrder)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel order'
      alert(message)
    } finally {
      setCancelling(false)
    }
  }

  const handleConfirmReceipt = async () => {
    if (!order) return

    if (!confirm('Mark this order as delivered? This will finalize the inventory.')) {
      return
    }

    setConfirming(true)
    try {
      const updatedOrder = await orderApi.confirmReceipt(order._id)
      setOrder(updatedOrder)
      setToastMessage({ text: 'Order marked as delivered successfully', type: 'success' })
      setTimeout(() => setToastMessage(null), 3000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to confirm receipt'
      setToastMessage({ text: message, type: 'error' })
      setTimeout(() => setToastMessage(null), 5000)
    } finally {
      setConfirming(false)
    }
  }

  // Check if order can be cancelled
  const canCancelOrder = order && [OrderStatus.PENDING, OrderStatus.PROCESSING].includes(order.orderStatus as OrderStatus)

  // Check if order can have receipt confirmed
  const canConfirmReceipt = order && order.orderStatus === OrderStatus.SHIPPED

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <FiXCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Order Not Found</h1>
          <p className="text-slate-600 mb-6">{error || 'The order you are looking for does not exist.'}</p>
          <Link
            to="/orders"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase tracking-wider rounded-[2px] transition-colors"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg font-semibold shadow-lg z-50 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {toastMessage.text}
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-slate-100 border-b border-slate-300">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-semibold"
          >
            <FiArrowLeft /> Back
          </button>
          <h1 className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Order Details
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Order Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">{order.orderNumber}</h1>
              <p className="text-slate-600">Placed on {formatDate(order.createdAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={order.orderStatus} />
              {canCancelOrder && (
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-[2px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden">
              <div className="bg-slate-100 border-b border-slate-300 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FiShoppingBag className="text-blue-600" />
                  Order Items ({order.items.length})
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {order.items.map((item, index) => (
                  <div key={item._id || index} className="flex items-center gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="w-16 h-16 bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.productImage ? (
                        <img
                          src={formatImageUrl(item.productImage)}
                          alt={item.productName}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <FiBox className="w-8 h-8 text-slate-300" />
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
                      <p className="text-xs text-slate-500 mt-1">Qty: {item.quantity}</p>
                      
                      {/* Review Actions Per Item */}
                      <div className="mt-2">
                        {(() => {
                          const existingReview = (userReviews || []).find(
                            (r) =>
                              r.orderId === order._id &&
                              r.productId === item.productId &&
                              (r.variantSku || '') === (item.variantSku || '')
                          )

                          if (existingReview) {
                            return (
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center text-yellow-500 text-xs">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <FiStar
                                      key={i}
                                      className={i < existingReview.rating ? 'fill-current' : ''}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs font-semibold text-emerald-600">Review Submitted</span>
                              </div>
                            )
                          }

                          const isUnreviewed = (unreviewedItems || []).some(
                            (u) =>
                              u.orderId === order._id &&
                              u.productId === item.productId &&
                              (u.variantSku || '') === (item.variantSku || '')
                          )

                          if (isUnreviewed && order.orderStatus === OrderStatus.DELIVERED) {
                            return (
                              <button
                                onClick={() =>
                                  handleOpenReviewModal(
                                    item.productId || '',
                                    item.productName || 'Product',
                                    item.productImage,
                                    order._id,
                                    item.variantSku,
                                    order.orderNumber,
                                  )
                                }
                                className="mt-1 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-[2px] transition-colors"
                              >
                                <FiStar className="text-sm" />
                                Write Review
                              </button>
                            )
                          }

                          return null
                        })()}
                      </div>
                    </div>
                    <p className="font-bold text-slate-900 self-start">
                      {formatPrice(item.priceAtOrder * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Timeline */}
            {order.history && order.history.length > 0 && (
              <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-300 px-6 py-4">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FiFileText className="text-blue-600" />
                    Order History
                  </h2>
                </div>
                <div className="p-6">
                  <OrderTimeline history={order.history} />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden">
              <div className="bg-slate-100 border-b border-slate-300 px-6 py-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                  Order Summary
                </h2>
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
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Tax (10%)</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-base font-bold text-slate-900">Total</span>
                  <span className="text-xl font-bold text-blue-700">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden">
              <div className="bg-slate-100 border-b border-slate-300 px-6 py-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                  <FiMapPin className="text-blue-600" />
                  Shipping Address
                </h2>
              </div>
              <div className="p-6">
                <p className="font-bold text-slate-900">{order.shippingAddress.fullName}</p>
                <p className="text-sm text-slate-600">{order.shippingAddress.phone}</p>
                <p className="text-sm text-slate-600 mt-2">
                  {order.shippingAddress.address}, {order.shippingAddress.ward ? `${order.shippingAddress.ward}, ` : ''}
                  {order.shippingAddress.district}, {order.shippingAddress.city}
                </p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden">
              <div className="bg-slate-100 border-b border-slate-300 px-6 py-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                  <FiCreditCard className="text-blue-600" />
                  Payment
                </h2>
              </div>
              <div className="p-6 space-y-2">
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
                    <span className="text-sm font-semibold text-slate-900 text-right">
                      {order.payment.transactionId}
                    </span>
                  </div>
                )}
                {order.payment?.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Paid At:</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatDate(order.payment.paidAt.toString())}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tracking Info */}
            {order.tracking && (
              <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-300 px-6 py-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                    <FiTruck className="text-blue-600" />
                    Tracking
                  </h2>
                </div>
                <div className="p-6 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Carrier:</span>
                    <span className="text-sm font-semibold text-slate-900">{order.tracking.carrier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Tracking Number:</span>
                    <span className="text-sm font-semibold text-blue-600">{order.tracking.trackingNumber}</span>
                  </div>
                  {order.tracking.estimatedDelivery && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Est. Delivery:</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {formatDate(order.tracking.estimatedDelivery.toString())}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Notes */}
            {order.notes && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> {order.notes}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {canConfirmReceipt && (
                <button
                  onClick={handleConfirmReceipt}
                  disabled={confirming}
                  className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm uppercase tracking-wider rounded-[2px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FiCheckCircle size={16} />
                  {confirming ? 'Confirming...' : 'Confirm Received'}
                </button>
              )}
              <Link
                to="/orders"
                className="w-full px-6 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm uppercase tracking-wider rounded-[2px] transition-colors flex items-center justify-center gap-2"
              >
                <FiArrowLeft size={16} />
                Back to Orders
              </Link>
              <Link
                to="/products"
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase tracking-wider rounded-[2px] transition-colors flex items-center justify-center gap-2"
              >
                <FiShoppingBag size={16} />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Review Form Modal */}
      {reviewModal && order && (
        <ReviewFormModal
          open={reviewModal.open}
          onClose={handleCloseReviewModal}
          productId={reviewModal.productId}
          productName={reviewModal.productName}
          productImage={reviewModal.productImage}
          orderId={reviewModal.orderId}
          variantSku={reviewModal.variantSku}
          orderNumber={reviewModal.orderNumber}
          onReviewSubmitted={handleCloseReviewModal}
        />
      )}
    </div>
  )
}

export default OrderDetailPage
