import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FiShoppingCart,
  FiTrash2,
  FiPlus,
  FiMinus,
  FiArrowLeft,
  FiCheckCircle,
  FiLock,
  FiInfo,
} from 'react-icons/fi'
import { formatImageUrl } from '@/lib/product-api'
import { useCart } from '@/store/cart.store'
import type { CartItem } from '@/lib/cart-api'
import { normalizeCartItemPrice } from '@/lib/cart-api'

// VND Price formatter
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

const CartPage: React.FC = () => {
  const cart = useCart()
  const {
    items,
    totalItems,
    subtotal,
    loading,
    error,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart,
    loadCart,
  } = cart

  const [notification, setNotification] = React.useState<string>('')
  const [updating, setUpdating] = React.useState<Set<string>>(new Set())

  const navigate = useNavigate()

  // Load cart on mount
  useEffect(() => {
    loadCart()
  }, [loadCart])

  // Listen for cart updates from other components (e.g., add to cart from product page)
  useEffect(() => {
    const handleCartUpdate = () => {
      console.log('[CartPage] cartUpdated event received, refreshing...')
      refreshCart()
    }

    window.addEventListener('cartUpdated', handleCartUpdate)
    return () => window.removeEventListener('cartUpdated', handleCartUpdate)
  }, [refreshCart])

  // Show error notification if any
  useEffect(() => {
    if (error) {
      setNotification(`Cart error: ${error}`)
      setTimeout(() => setNotification(''), 5000)
    }
  }, [error])

  const handleUpdateQty = async (itemId: string, newQty: number) => {
    if (newQty < 1) {
      await handleRemove(itemId)
      return
    }

    setUpdating((prev) => new Set(prev).add(itemId))
    try {
      await updateQuantity(itemId, newQty)
    } catch (err) {
      console.error('Failed to update quantity:', err)
      await refreshCart()
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const handleRemove = async (itemId: string) => {
    setUpdating((prev) => new Set(prev).add(itemId))
    try {
      await removeItem(itemId)
      setNotification('Item removed from cart')
      setTimeout(() => setNotification(''), 3000)
    } catch (err) {
      console.error('Failed to remove item:', err)
      await refreshCart()
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="mt-4 text-slate-600">Loading cart...</p>
        </div>
      </div>
    )
  }

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
            Shopping Cart
          </h1>
        </div>
      </div>

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-xs">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <span className="font-semibold">Debug:</span>
            <span>Items: {items.length}</span>
            <button
              onClick={refreshCart}
              className="px-2 py-1 bg-blue-200 hover:bg-blue-300 rounded"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 bg-white border border-slate-300 shadow-md p-4 z-50 flex items-center gap-3 border-l-4 border-l-emerald-500 animate-in slide-in-from-right-4">
          <FiCheckCircle className="text-emerald-500 w-5 h-5" />
          <span className="text-sm font-bold text-slate-700">{notification}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            <div className="bg-white border border-slate-300 rounded-xs shadow-sm overflow-hidden">
              <div className="bg-slate-100 border-b border-slate-300 px-6 py-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                  <FiShoppingCart className="text-slate-400" /> Items in Cart ({items.length})
                </h2>
              </div>

              {items.length === 0 ? (
                <div className="p-16 text-center space-y-4">
                  <FiShoppingCart className="mx-auto w-16 h-16 text-slate-200" />
                  <p className="text-slate-500 font-medium">
                    Your shopping cart is currently empty.
                  </p>
                  <Link
                    to="/products"
                    className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest rounded-xs transition-colors"
                  >
                    Go to Shop
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Product</th>
                        <th className="px-6 py-3">Price</th>
                        <th className="px-6 py-3">Quantity</th>
                        <th className="px-6 py-3">Total</th>
                        <th className="px-6 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item) => {
                        const isUpdating = updating.has(item._id)
                        return (
                          <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                                  {item.productImage ? (
                                    <img
                                      src={formatImageUrl(item.productImage)}
                                      alt={item.productName}
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTZweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Qm94PSIwIDAgMTYgMTYiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0NDhCMjUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiLz4KPHJlY3QgeD0iOCIgd2lkdGg9IjYiIGhlaWdodD0iNiIgcng9IjQiIGZpbGw9IndoaXRlIi8+PC9zdmc+'
                                      }}
                                    />
                                  ) : (
                                    <span className="text-2xl">📦</span>
                                  )}
                                </div>
                                <div>
                                  <Link
                                    to={`/product/${item.productId}`}
                                    className="text-sm font-bold text-slate-900 hover:text-blue-600 block"
                                  >
                                    {item.productName || 'Product'}
                                  </Link>
                                  {item.variantDetails?.isPreorder && (
                                    <span className="inline-block ml-2 px-2 py-0.5 text-[10px] font-bold uppercase bg-blue-100 text-blue-700 rounded">
                                      Pre-order
                                    </span>
                                  )}
                                  {item.variantDetails && (
                                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                                      {item.variantDetails.size && `Size: ${item.variantDetails.size}`}
                                      {item.variantDetails.size && item.variantDetails.color && ' | '}
                                      {item.variantDetails.color && `Color: ${item.variantDetails.color}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-bold text-slate-700">
                                {formatPrice(normalizeCartItemPrice(item))}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center border border-slate-300 rounded-xs bg-white w-fit overflow-hidden disabled:opacity-50">
                                <button
                                  onClick={() => handleUpdateQty(item._id, item.quantity - 1)}
                                  disabled={isUpdating}
                                  className="p-1.5 hover:bg-slate-100 border-r border-slate-300 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <FiMinus size={12} />
                                </button>
                                <span className="w-8 text-center text-xs font-bold">
                                  {isUpdating ? '...' : item.quantity}
                                </span>
                                <button
                                  onClick={() => handleUpdateQty(item._id, item.quantity + 1)}
                                  disabled={isUpdating}
                                  className="p-1.5 hover:bg-slate-100 border-l border-slate-300 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <FiPlus size={12} />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-bold text-slate-900">
                                {formatPrice(normalizeCartItemPrice(item) * item.quantity)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleRemove(item._id)}
                                disabled={isUpdating}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors rounded-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Remove item"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="flex justify-between items-center p-4 bg-blue-50/50 border border-blue-100 rounded-xs text-xs">
                <div className="flex items-center gap-2 text-blue-700">
                  <FiInfo />
                  <span className="font-semibold italic">
                    Free shipping applied to all orders over 2.000.000 ₫
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="w-full lg:w-80 space-y-6">
            <div className="bg-white border border-slate-300 rounded-xs shadow-sm overflow-hidden sticky top-20">
              <div className="bg-slate-100 border-b border-slate-300 px-6 py-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                  Order Summary
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span className="uppercase">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span className="uppercase">Shipping</span>
                  <span className="text-emerald-600">FREE</span>
                </div>
                <div className="pt-4 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold uppercase text-slate-900 tracking-wider">
                    Total
                  </span>
                  <span className="text-xl font-bold text-blue-700">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="pt-6 space-y-3">
                  <Link
                    to="/checkout"
                    className={`w-full h-11 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xs transition-all shadow-sm ${
                      items.length === 0 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                    }`}
                  >
                    <FiLock size={14} /> Checkout
                  </Link>
                  <Link
                    to="/products"
                    className="w-full h-11 flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 font-bold text-xs uppercase tracking-widest rounded-xs transition-all"
                  >
                    Shop More
                  </Link>
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                  <FiCheckCircle className="text-slate-300" /> Secure Payment
                  <br />
                  <FiCheckCircle className="text-slate-300" /> SSL Encrypted
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage
