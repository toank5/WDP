import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth-store'
import {
  FiChevronLeft,
  FiStar,
  FiShoppingCart,
  FiMinus,
  FiPlus,
  FiSearch,
  FiLogIn,
  FiArrowRight,
  FiCheckCircle,
  FiPackage,
  FiX,
} from 'react-icons/fi'

const mockProducts: Record<string, any> = {
  p1: {
    id: 'p1',
    name: 'Classic Black Frame',
    type: 'frame',
    price: 120,
    rating: 4.5,
    reviews: 24,
    description: 'Timeless black acetate frame with metal hinges. Perfect for everyday wear.',
    images: ['👓', '👓', '👓'],
    variants: [
      { id: 'v1', size: 'Small', color: 'Black' },
      { id: 'v2', size: 'Medium', color: 'Black' },
      { id: 'v3', size: 'Large', color: 'Black' },
    ],
    specs: {
      material: 'Acetate',
      hinge: 'Metal',
      width: '140mm',
      height: '40mm',
    },
    features: [
      'UV Protection',
      'Anti-scratch coating',
      'Lightweight design',
      'Adjustable nose pads',
    ],
    inStock: true,
  },
  p2: {
    id: 'p2',
    name: 'UV Protection Lens',
    type: 'lens',
    price: 80,
    rating: 4.8,
    reviews: 156,
    description: 'Premium UV protection lenses that block 100% of harmful UV rays.',
    images: ['🔍', '🔍', '🔍'],
    variants: [
      { id: 'v1', size: 'Single Vision', coating: 'UV' },
      { id: 'v2', size: 'Bifocal', coating: 'UV' },
    ],
    specs: {
      uvProtection: '100%',
      material: 'Polycarbonate',
      thickness: '1.6mm',
      transmission: 'High clarity',
    },
    features: [
      '100% UV Block',
      'High impact resistant',
      'Anti-glare option available',
      'Scratch resistant',
    ],
    inStock: true,
  },
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [product, setProduct] = useState<any | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<string>('')
  const [qty, setQty] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [notification, setNotification] = useState<string>('')
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  useEffect(() => {
    if (id && mockProducts[id]) {
      const prod = mockProducts[id]
      setProduct(prod)
      if (prod.variants.length > 0) {
        setSelectedVariant(prod.variants[0].id)
      }
    }
  }, [id])

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true)
      return
    }

    if (!selectedVariant) {
      return
    }

    setIsAdding(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      const cart = JSON.parse(localStorage.getItem('cart') || '[]')

      const existingItem = cart.find(
        (item: any) => item.id === product.id && item.variantId === selectedVariant
      )
      if (existingItem) {
        existingItem.qty += qty
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          variantId: selectedVariant,
          variantName: product.variants.find((v: any) => v.id === selectedVariant).size || '',
          qty,
          image: product.images[0],
        })
      }

      localStorage.setItem('cart', JSON.stringify(cart))
      window.dispatchEvent(new CustomEvent('cartUpdated'))

      setNotification(`${product.name} added to cart!`)
      setTimeout(() => {
        setNotification('')
      }, 3000)
    } finally {
      setIsAdding(false)
    }
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white border border-slate-300 p-8 shadow-sm text-center space-y-4 max-w-sm">
          <FiSearch className="mx-auto w-12 h-12 text-slate-400" />
          <h2 className="text-xl font-bold text-slate-800">Item Not Found</h2>
          <p className="text-sm text-slate-600">
            The product you are looking for does not exist in our catalog.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-[2px] text-xs font-bold transition-colors"
          >
            <FiChevronLeft /> Back to Catalog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Header / Nav */}
      <div className="bg-slate-100 border-b border-slate-300 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/products"
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-semibold"
          >
            <FiChevronLeft /> Back to Products
          </Link>
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
        <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Images Section */}
            <div className="p-8 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/30">
              <div className="aspect-square bg-white border border-slate-200 flex items-center justify-center text-9xl">
                {product.images[0]}
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                {product.images.map((img: string, i: number) => (
                  <div
                    key={i}
                    className="aspect-square bg-white border border-slate-200 flex items-center justify-center text-3xl cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    {img}
                  </div>
                ))}
              </div>
            </div>

            {/* Info Section */}
            <div className="p-8 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold uppercase rounded-[2px]">
                  {product.type}
                </span>
                {!product.inStock && (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold uppercase rounded-[2px]">
                    Out of Stock
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-slate-900 mb-2">{product.name}</h1>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1 text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  {product.reviews} customer reviews
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-blue-700">${product.price}</span>
                  <span className="text-sm text-slate-500 uppercase font-bold">USD</span>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-8 leading-relaxed">{product.description}</p>

              {/* Variant Selection */}
              <div className="space-y-4 mb-8">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Available Options
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.variants.map((variant: any) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant.id)}
                      className={`flex flex-col p-3 border rounded-[2px] text-left transition-all ${
                        selectedVariant === variant.id
                          ? 'border-blue-600 bg-blue-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-400'
                      }`}
                    >
                      <span className="text-sm font-bold">{variant.size}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">
                        {variant.color || variant.coating || 'Standard'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cart Actions */}
              <div className="flex items-center gap-4 pt-6 border-t border-slate-100 mt-auto">
                <div className="flex items-center border border-slate-300 rounded-[2px] bg-white overflow-hidden">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="p-2 hover:bg-slate-100 border-r border-slate-300 text-slate-600"
                  >
                    <FiMinus size={14} />
                  </button>
                  <span className="w-10 text-center text-sm font-bold">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="p-2 hover:bg-slate-100 border-l border-slate-300 text-slate-600"
                  >
                    <FiPlus size={14} />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock || isAdding}
                  className={`flex-1 flex items-center justify-center gap-2 h-10 px-6 rounded-[2px] font-bold text-sm uppercase tracking-wider transition-all shadow-sm ${
                    product.inStock
                      ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow active:scale-[0.98]'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isAdding ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiShoppingCart />
                      {product.inStock ? 'Add to Bag' : 'Sold Out'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Specifications & Features */}
          <div className="grid md:grid-cols-2 border-t border-slate-300">
            {/* Specs Table */}
            <div className="p-8 border-b md:border-b-0 md:border-r border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                <FiPackage className="text-slate-400" /> Technical Data
              </h3>
              <div className="border border-slate-200 rounded-[2px] overflow-hidden">
                <div className="grid grid-cols-2 bg-slate-100 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  <div className="p-2 border-r border-slate-200">Specification</div>
                  <div className="p-2">Details</div>
                </div>
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-2 border-t border-slate-200 text-xs">
                    <div className="p-2 border-r border-slate-200 bg-slate-50/50 font-semibold capitalize">
                      {key}
                    </div>
                    <div className="p-2 font-medium">{String(value)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features List */}
            <div className="p-8 bg-slate-50/30 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                <FiArrowRight className="text-slate-400" /> Key Features
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {product.features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-slate-600 font-semibold">
                    <FiCheckCircle className="text-emerald-500 w-3.5 h-3.5" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white border border-slate-300 shadow-2xl max-w-sm w-full relative">
            <div className="bg-slate-100 border-b border-slate-300 px-6 py-3 flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600">
                Login Required
              </h2>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FiX />
              </button>
            </div>
            <div className="p-6 text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-slate-50 border border-slate-200 flex items-center justify-center">
                <FiLogIn className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Please sign in to your account to add items to your shopping bag.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest rounded-[2px] transition-colors"
                >
                  Login Now
                </button>
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-[2px] transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetailPage
