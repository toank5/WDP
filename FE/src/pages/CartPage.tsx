import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from "lucide-react";

const CartPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [notification, setNotification] = useState<string>("");

  useEffect(() => {
    loadCart();
    // Listen for cart updates from other components
    window.addEventListener('cartUpdated', loadCart);
    return () => window.removeEventListener('cartUpdated', loadCart);
  }, []);

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setItems(cart);
  };

  const handleUpdateQty = (itemId: string, newQty: number) => {
    if (newQty < 1) {
      handleRemove(itemId);
      return;
    }

    const updatedCart = items.map(item =>
      item.id === itemId ? { ...item, qty: newQty } : item
    );
    setItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  const handleRemove = (itemId: string) => {
    const updatedCart = items.filter(item => item.id !== itemId);
    setItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setNotification("Item removed from cart");
    setTimeout(() => setNotification(""), 2000);
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse z-50">
          ✓ {notification}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Link to="/products" className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <ArrowLeft size={20} /> Back to Shopping
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-6">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ShoppingCart size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600 text-lg mb-4">Your cart is empty</p>
            <Link to="/products" className="text-blue-600 hover:underline font-semibold">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 pb-4 border-b last:border-b-0 last:pb-0"
                  >
                    {/* Product Image Placeholder */}
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">
                      {item.image || '📦'}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <Link
                        to={`/products/${item.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600 block mb-1"
                      >
                        {item.name}
                      </Link>
                      <p className="text-sm text-slate-600 capitalize mb-2">
                        {item.type} {item.variantName && `• ${item.variantName}`}
                      </p>
                      <p className="text-lg font-bold text-blue-600">${item.price}</p>
                    </div>

                    {/* Quantity Control */}
                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-2">
                      <button
                        onClick={() => handleUpdateQty(item.id, item.qty - 1)}
                        className="p-1 hover:bg-slate-200 rounded transition"
                        title="Decrease quantity"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="px-3 font-semibold">{item.qty}</span>
                      <button
                        onClick={() => handleUpdateQty(item.id, item.qty + 1)}
                        className="p-1 hover:bg-slate-200 rounded transition"
                        title="Increase quantity"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right">
                      <p className="text-sm text-slate-600 mb-2">Subtotal</p>
                      <p className="text-lg font-bold text-slate-900">
                        ${(item.price * item.qty).toFixed(2)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Remove item"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6 h-fit sticky top-20">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Order Summary</h2>

              <div className="space-y-3 pb-4 border-b mb-4">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-semibold">Free</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax</span>
                  <span>${(total * 0.1).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold text-slate-900">Total</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${(total * 1.1).toFixed(2)}
                </span>
              </div>

              <Link
                to="/checkout"
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 mb-3"
              >
                <ShoppingCart size={20} /> Proceed to Checkout
              </Link>

              <Link
                to="/products"
                className="w-full py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition text-center"
              >
                Continue Shopping
              </Link>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-900">
                <p className="font-semibold mb-1">💳 Secure Checkout</p>
                <p>Free shipping on orders over $100</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
