import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth-store'
import { ShoppingCart, Eye, Search, Sliders, RotateCcw, LogIn } from 'lucide-react'
import { Star } from 'lucide-react'

const mockProducts = [
  { id: 'p1', name: 'Classic Black Frame', type: 'frame', category: 'frames', price: 120, image: '👓', rating: 4.5, reviews: 24 },
  { id: 'p2', name: 'UV Protection Lens', type: 'lens', category: 'lenses', price: 80, image: '🔍', rating: 4.8, reviews: 156 },
  { id: 'p3', name: 'Rose Gold Frame', type: 'frame', category: 'frames', price: 150, image: '👓', rating: 4.6, reviews: 42 },
  { id: 'p4', name: 'Blue Light Blocking', type: 'lens', category: 'lenses', price: 95, image: '🔍', rating: 4.7, reviews: 89 },
  { id: 'p5', name: 'Vintage Tortoise', type: 'frame', category: 'frames', price: 180, image: '👓', rating: 4.9, reviews: 67 },
  { id: 'p6', name: 'Progressive Lens Pro', type: 'lens', category: 'lenses', price: 200, image: '🔍', rating: 5.0, reviews: 103 },
  { id: 'p7', name: 'Sporty Wrap Frame', type: 'frame', category: 'frames', price: 140, image: '👓', rating: 4.4, reviews: 31 },
  { id: 'p8', name: 'Anti-Glare Coating', type: 'service', category: 'services', price: 45, image: '✨', rating: 4.6, reviews: 58 },
]

const ProductsPage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300])
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating'>('name')
  const [notification, setNotification] = useState<string>('')
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set())
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const filtered = useMemo(() => {
    let result = mockProducts

    if (query) {
      result = result.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    }

    if (typeFilter !== 'all') {
      result = result.filter(p => p.type === typeFilter)
    }

    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])

    if (sortBy === 'price') {
      result.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating)
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [query, typeFilter, priceRange, sortBy])

  const handleAddToCart = async (product: any) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true)
      return
    }

    setAddingIds(prev => new Set(prev).add(product.id))

    try {
      await new Promise(resolve => setTimeout(resolve, 400))

      const cart = JSON.parse(localStorage.getItem('cart') || '[]')

      const existingItem = cart.find((item: any) => item.id === product.id)
      if (existingItem) {
        existingItem.qty += 1
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          qty: 1,
          image: product.image,
          type: product.type,
        })
      }

      localStorage.setItem('cart', JSON.stringify(cart))

      // Dispatch custom event to update Navbar cart count
      window.dispatchEvent(new CustomEvent('cartUpdated'))

      setNotification(`${product.name} added to cart!`)

      setTimeout(() => {
        setNotification('')
      }, 2000)
    } finally {
      setAddingIds(prev => {
        const next = new Set(prev)
        next.delete(product.id)
        return next
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse z-50 flex items-center gap-2">
          <span className="w-5 h-5">✓</span>
          {notification}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Products & Services</h1>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 sticky top-20">
              {/* Search */}
              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                  <Search size={16} />
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                  <Sliders size={16} />
                  Type
                </label>
                <div className="space-y-2">
                  {['all', 'frame', 'lens', 'service'].map(t => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value={t}
                        checked={typeFilter === t}
                        onChange={e => setTypeFilter(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm capitalize">{t === 'all' ? 'All Products' : t + 's'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-semibold mb-2">Price Range</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={priceRange[0]}
                      onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="w-20 border border-slate-300 rounded px-2 py-1 text-sm"
                    />
                    <span>—</span>
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={priceRange[1]}
                      onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-20 border border-slate-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="text-xs text-slate-600">${priceRange[0]} — ${priceRange[1]}</div>
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-semibold mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'name' | 'price' | 'rating')}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="price">Price (Low to High)</option>
                  <option value="rating">Rating (High to Low)</option>
                </select>
              </div>

              {/* Reset */}
              <button
                onClick={() => {
                  setQuery('')
                  setTypeFilter('all')
                  setPriceRange([0, 300])
                  setSortBy('name')
                }}
                className="w-full px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-semibold hover:bg-slate-300 transition flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                Reset Filters
              </button>
            </div>
          </aside>

          {/* Product Grid */}
          <main className="lg:col-span-3">
            <div className="mb-4 text-sm text-slate-600">
              Showing <strong>{filtered.length}</strong> product{filtered.length !== 1 ? 's' : ''}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <Search size={48} className="mx-auto mb-2 text-slate-400" />
                <p className="text-slate-600">No products found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map(product => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-lg transition overflow-hidden border border-slate-200 hover:border-blue-400 flex flex-col"
                  >
                    {/* Product Image */}
                    <Link
                      to={`/products/${product.id}`}
                      className="h-40 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-6xl hover:opacity-80 transition"
                    >
                      {product.image}
                    </Link>

                    {/* Product Info */}
                    <div className="p-4 flex-1 flex flex-col">
                      <Link
                        to={`/products/${product.id}`}
                        className="font-semibold text-slate-900 mb-1 line-clamp-2 hover:text-blue-600 transition"
                      >
                        {product.name}
                      </Link>

                      <div className="flex items-center gap-1 mb-3">
                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">{product.rating}</span>
                        <span className="text-xs text-slate-500">({product.reviews})</span>
                      </div>

                      <div className="flex justify-between items-center mb-3 flex-grow">
                        <div>
                          <p className="text-xs text-slate-500 capitalize mb-1">{product.type}</p>
                          <p className="text-lg font-bold text-blue-600">${product.price}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 border-t">
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={addingIds.has(product.id)}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-1"
                        >
                          {addingIds.has(product.id) ? (
                            <>
                              <span className="animate-spin">⏳</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart size={16} />
                              Add
                            </>
                          )}
                        </button>
                        <Link
                          to={`/products/${product.id}`}
                          className="flex-1 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition text-sm flex items-center justify-center gap-1"
                        >
                          <Eye size={16} />
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
            <LogIn size={48} className="mx-auto mb-4 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Login Required</h2>
            <p className="text-slate-600 mb-6">You must be logged in to add items to your cart.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-50 font-semibold transition"
              >
                Continue Shopping
              </button>
              <button
                onClick={() => navigate('/login')}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition flex items-center justify-center gap-2"
              >
                <LogIn size={18} /> Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductsPage
