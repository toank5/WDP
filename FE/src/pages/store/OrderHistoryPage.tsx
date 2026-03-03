import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FiShoppingBag,
  FiArrowLeft,
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiBox,
} from 'react-icons/fi'
import { orderApi, Order, OrderStatus } from '@/lib/order-api'
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
    month: 'short',
    day: 'numeric',
  })
}

// Status badge component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig: Record<string, { color: string; label: string }> = {
    PENDING: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Pending' },
    PROCESSING: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Processing' },
    CONFIRMED: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Confirmed' },
    SHIPPED: { color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Shipped' },
    DELIVERED: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Delivered' },
    RETURNED: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Cancelled' },
  }

  const config = statusConfig[status] || statusConfig.PENDING

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${config.color}`}>
      {config.label}
    </span>
  )
}

const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadOrders()
  }, [page, statusFilter])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const response = await orderApi.getMyOrders({
        page,
        limit: 10,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      setOrders(response.orders)
      setTotalPages(response.totalPages)
      setTotal(response.total)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load orders'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadOrders()
  }

  const handleStatusFilter = (status: OrderStatus | '') => {
    setStatusFilter(status)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Header Bar */}
      <div className="bg-slate-100 border-b border-slate-300">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-semibold"
          >
            <FiArrowLeft /> Back to Home
          </Link>
          <h1 className="text-sm font-bold uppercase tracking-widest text-slate-500">
            My Orders
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Orders</h1>
          <p className="text-slate-600">
            Track and manage your orders ({total} {total === 1 ? 'order' : 'orders'})
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by order number..."
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-[2px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase tracking-wider rounded-[2px] transition-colors shadow-sm"
            >
              Search
            </button>
          </form>

          {/* Status Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
              <FiFilter /> Filter:
            </span>
            <button
              onClick={() => handleStatusFilter('')}
              className={`px-4 py-2 rounded-[2px] text-sm font-bold uppercase transition-colors ${
                statusFilter === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-white hover:bg-slate-50 border border-slate-300 text-slate-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleStatusFilter(OrderStatus.PENDING)}
              className={`px-4 py-2 rounded-[2px] text-sm font-bold uppercase transition-colors ${
                statusFilter === OrderStatus.PENDING
                  ? 'bg-yellow-500 text-white'
                  : 'bg-white hover:bg-slate-50 border border-slate-300 text-slate-700'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => handleStatusFilter(OrderStatus.CONFIRMED)}
              className={`px-4 py-2 rounded-[2px] text-sm font-bold uppercase transition-colors ${
                statusFilter === OrderStatus.CONFIRMED
                  ? 'bg-green-600 text-white'
                  : 'bg-white hover:bg-slate-50 border border-slate-300 text-slate-700'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => handleStatusFilter(OrderStatus.SHIPPED)}
              className={`px-4 py-2 rounded-[2px] text-sm font-bold uppercase transition-colors ${
                statusFilter === OrderStatus.SHIPPED
                  ? 'bg-purple-600 text-white'
                  : 'bg-white hover:bg-slate-50 border border-slate-300 text-slate-700'
              }`}
            >
              Shipped
            </button>
            <button
              onClick={() => handleStatusFilter(OrderStatus.DELIVERED)}
              className={`px-4 py-2 rounded-[2px] text-sm font-bold uppercase transition-colors ${
                statusFilter === OrderStatus.DELIVERED
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-slate-50 border border-slate-300 text-slate-700'
              }`}
            >
              Delivered
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="mt-4 text-slate-600">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 bg-white border border-slate-300 rounded-[2px] shadow-sm">
            <FiShoppingBag className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">No orders found</h2>
            <p className="text-slate-600 mb-6">
              {searchQuery || statusFilter
                ? 'Try adjusting your search or filter criteria'
                : 'You haven\'t placed any orders yet'}
            </p>
            <Link
              to="/products"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase tracking-wider rounded-[2px] transition-colors shadow-sm"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          /* Orders List */
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-4 border-b border-slate-200">
                    <div>
                      <Link
                        to={`/orders/${order._id}`}
                        className="text-lg font-bold text-blue-600 hover:text-blue-700"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="text-sm text-slate-500">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={order.orderStatus} />
                      <p className="text-lg font-bold text-slate-900">
                        {formatPrice(order.totalAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex -space-x-2">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div
                          key={item._id || index}
                          className="w-12 h-12 bg-slate-50 border-2 border-white rounded-lg flex items-center justify-center overflow-hidden"
                        >
                          {item.productImage ? (
                            <img
                              src={formatImageUrl(item.productImage)}
                              alt={item.productName}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <FiBox className="w-6 h-6 text-slate-300" />
                          )}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="w-12 h-12 bg-slate-100 border-2 border-white rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-600">
                            +{order.items.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-600">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.items[0]?.productName}
                        {order.items.length > 1 && ' and more...'}
                      </p>
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                      {order.payment?.method} • {order.items.length} items
                    </div>
                    <Link
                      to={`/orders/${order._id}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-[2px] transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && orders.length > 0 && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-slate-300 rounded-[2px] hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiChevronLeft />
            </button>
            <span className="text-sm font-semibold text-slate-600 px-4">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 border border-slate-300 rounded-[2px] hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderHistoryPage
