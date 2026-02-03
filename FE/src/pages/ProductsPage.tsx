import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth-store'
import {
  FiShoppingCart,
  FiEye,
  FiSearch,
  FiSliders,
  FiRotateCcw,
  FiLogIn,
  FiStar,
  FiFilter,
  FiArrowRight,
  FiX,
  FiGrid,
} from 'react-icons/fi'

const mockProducts = [
  {
    id: 'p1',
    name: 'Classic Black Frame',
    type: 'frame',
    price: 120,
    rating: 4.5,
    reviews: 24,
    image: '👓',
  },
  {
    id: 'p2',
    name: 'UV Protection Lens',
    type: 'lens',
    price: 80,
    rating: 4.8,
    reviews: 156,
    image: '🔍',
  },
  {
    id: 'p3',
    name: 'Golden Aviator',
    type: 'frame',
    price: 250,
    rating: 4.9,
    reviews: 89,
    image: '🕶️',
  },
  {
    id: 'p4',
    name: 'Blue Light Filter',
    type: 'lens',
    price: 60,
    rating: 4.2,
    reviews: 210,
    image: '💎',
  },
  {
    id: 'p5',
    name: 'Retro Tortoise',
    type: 'frame',
    price: 180,
    rating: 4.6,
    reviews: 45,
    image: '👓',
  },
  {
    id: 'p6',
    name: 'Progressive Lens',
    type: 'lens',
    price: 150,
    rating: 4.4,
    reviews: 67,
    image: '🔍',
  },
]

const ProductsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const filteredProducts = useMemo(() => {
    return mockProducts
      .filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType = selectedType === 'all' || p.type === selectedType
        return matchesSearch && matchesType
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price
        if (sortBy === 'price-high') return b.price - a.price
        if (sortBy === 'rating') return b.rating - a.rating
        return a.name.localeCompare(b.name)
      })
  }, [searchQuery, selectedType, sortBy])

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      setShowLoginPrompt(true)
      return
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existingItem = cart.find((item: any) => item.id === product.id)
    if (existingItem) {
      existingItem.qty += 1
    } else {
      cart.push({ ...product, qty: 1 })
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new CustomEvent('cartUpdated'))
    navigate('/cart')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Page Header */}
      <div className="bg-slate-100 border-b border-slate-300">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FiGrid className="text-slate-400" />
            <h1 className="text-sm font-bold uppercase tracking-widest text-slate-600">
              Product Inventory
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-[2px] text-xs focus:outline-none focus:border-blue-500 w-64 placeholder:text-slate-300 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                >
                  <FiX size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full md:w-64 space-y-6">
            <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm">
              <div className="bg-slate-100 border-b border-slate-300 px-4 py-2.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <FiFilter /> Filter Controls
                </span>
                {(selectedType !== 'all' || sortBy !== 'name') && (
                  <button
                    onClick={() => {
                      setSelectedType('all')
                      setSortBy('name')
                    }}
                    className="text-[9px] font-bold text-blue-600 hover:underline flex items-center gap-1 uppercase"
                  >
                    <FiRotateCcw size={10} /> Reset
                  </button>
                )}
              </div>

              <div className="p-4 space-y-6">
                {/* Category */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Category Selection
                  </label>
                  <div className="space-y-1">
                    {['all', 'frame', 'lens'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`w-full text-left px-3 py-1.5 rounded-[2px] text-xs font-semibold transition-colors ${
                          selectedType === type
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)} Products
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Sorting Order
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-[2px] px-2 py-1.5 text-xs font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="name">Alphabetical (A-Z)</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 border-t border-slate-200 p-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed italic">
                  Showing {filteredProducts.length} results
                </p>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="bg-white border border-slate-300 rounded-[2px] p-20 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <FiSearch size={24} className="text-slate-200" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No Inventory Found</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Adjust your search or filters to find what you are looking for.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((p) => (
                  <Link
                    key={p.id}
                    to={`/products/${p.id}`}
                    className="group bg-white border border-slate-300 rounded-[2px] shadow-sm hover:shadow-md hover:border-blue-400 transition-all overflow-hidden flex flex-col"
                  >
                    {/* Product Image */}
                    <div className="aspect-[4/3] bg-slate-50 border-b border-slate-200 flex items-center justify-center text-6xl relative group-hover:bg-white transition-colors">
                      {p.image}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white border border-slate-200 shadow-sm p-1.5 rounded-[2px]">
                          <FiEye size={14} className="text-blue-600" />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-[2px]">
                          {p.type}
                        </span>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <FiStar size={10} className="fill-current" />
                          <span className="text-[10px] font-bold text-slate-600">{p.rating}</span>
                        </div>
                      </div>

                      <h3 className="text-sm font-black text-slate-800 mb-4 group-hover:text-blue-700 transition-colors uppercase tracking-tight leading-tight">
                        {p.name}
                      </h3>

                      <div className="mt-auto flex items-center justify-between gap-4 pt-4 border-t border-slate-50">
                        <span className="text-lg font-bold text-blue-700">${p.price}</span>

                        <button
                          onClick={(e) => handleAddToCart(e, p)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-[2px] flex items-center gap-2 transition-colors shadow-sm active:translate-y-0.5"
                        >
                          <FiShoppingCart size={12} /> Add
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

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

export default ProductsPage
