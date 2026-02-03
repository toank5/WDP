import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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

const CartPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([])
  const [notification, setNotification] = useState<string>('')

  useEffect(() => {
    loadCart()
    window.addEventListener('cartUpdated', loadCart)
    return () => window.removeEventListener('cartUpdated', loadCart)
  }, [])

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    setItems(cart)
  }

  const handleUpdateQty = (itemId: string, newQty: number) => {
    if (newQty < 1) {
      handleRemove(itemId)
      return
    }

    const updatedCart = items.map((item) => (item.id === itemId ? { ...item, qty: newQty } : item))
    setItems(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
    window.dispatchEvent(new CustomEvent('cartUpdated'))
  }

  const handleRemove = (itemId: string) => {
    const updatedCart = items.filter((item) => item.id !== itemId)
    setItems(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
    setNotification('Item removed from cart')
    setTimeout(() => setNotification(''), 3000)
    window.dispatchEvent(new CustomEvent('cartUpdated'))
  }

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0)

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
            Shopping Bag
          </h1>
        </div>
      </div>

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
            <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden">
              <div className="bg-slate-100 border-b border-slate-300 px-6 py-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                  <FiShoppingCart className="text-slate-400" /> Items in Bag ({items.length})
                </h2>
              </div>

              {items.length === 0 ? (
                <div className="p-16 text-center space-y-4">
                  <FiShoppingCart className="mx-auto w-16 h-16 text-slate-200" />
                  <p className="text-slate-500 font-medium">
                    Your shopping bag is currently empty.
                  </p>
                  <Link
                    to="/products"
                    className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest rounded-[2px] transition-colors"
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
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-slate-50 border border-slate-200 flex items-center justify-center text-3xl">
                                {item.image || '📦'}
                              </div>
                              <div>
                                <Link
                                  to={`/products/${item.id}`}
                                  className="text-sm font-bold text-slate-900 hover:text-blue-600 block"
                                >
                                  {item.name}
                                </Link>
                                <span className="text-[10px] text-slate-400 uppercase font-bold">
                                  {item.variantName || 'Standard'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-slate-700">${item.price}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center border border-slate-300 rounded-[2px] bg-white w-fit overflow-hidden">
                              <button
                                onClick={() => handleUpdateQty(item.id, item.qty - 1)}
                                className="p-1.5 hover:bg-slate-100 border-r border-slate-300 text-slate-600"
                              >
                                <FiMinus size={12} />
                              </button>
                              <span className="w-8 text-center text-xs font-bold">{item.qty}</span>
                              <button
                                onClick={() => handleUpdateQty(item.id, item.qty + 1)}
                                className="p-1.5 hover:bg-slate-100 border-l border-slate-300 text-slate-600"
                              >
                                <FiPlus size={12} />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-slate-900">
                              ${(item.price * item.qty).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleRemove(item.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors rounded-[2px]"
                              title="Remove item"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="flex justify-between items-center p-4 bg-blue-50/50 border border-blue-100 rounded-[2px] text-xs">
                <div className="flex items-center gap-2 text-blue-700">
                  <FiInfo />
                  <span className="font-semibold italic">
                    Free shipping applied to all orders over $100.00
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="w-full lg:w-80 space-y-6">
            <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden sticky top-20">
              <div className="bg-slate-100 border-b border-slate-300 px-6 py-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                  Order Summary
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span className="uppercase">Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span className="uppercase">Shipping</span>
                  <span className="text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span className="uppercase">Est. Tax (10%)</span>
                  <span>${(total * 0.1).toFixed(2)}</span>
                </div>
                <div className="pt-4 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold uppercase text-slate-900 tracking-wider">
                    Total
                  </span>
                  <span className="text-xl font-bold text-blue-700">
                    ${(total * 1.1).toFixed(2)}
                  </span>
                </div>

                <div className="pt-6 space-y-3">
                  <Link
                    to="/checkout"
                    className={`w-full h-11 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-[2px] transition-all shadow-sm ${
                      items.length === 0 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                    }`}
                  >
                    <FiLock size={14} /> Checkout
                  </Link>
                  <Link
                    to="/products"
                    className="w-full h-11 flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 font-bold text-xs uppercase tracking-[0.1em] rounded-[2px] transition-all"
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
