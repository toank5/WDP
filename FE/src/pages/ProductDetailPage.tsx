import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth-store'
import { ChevronLeft, Star, ShoppingCart, Minus, Plus, Search, LogIn } from 'lucide-react'

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
            '✓ UV Protection',
            '✓ Anti-scratch coating',
            '✓ Lightweight design',
            '✓ Adjustable nose pads',
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
            '✓ 100% UV Block',
            '✓ High impact resistant',
            '✓ Anti-glare option available',
            '✓ Scratch resistant',
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
            alert('Please select a variant')
            return
        }

        setIsAdding(true)
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500))

            // Get existing cart from localStorage
            const cart = JSON.parse(localStorage.getItem('cart') || '[]')

            // Add or update item
            const existingItem = cart.find((item: any) => item.id === product.id && item.variantId === selectedVariant)
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

            // Dispatch custom event to update Navbar cart count
            window.dispatchEvent(new CustomEvent('cartUpdated'))

            setNotification(`${product.name} added to cart!`)

            setTimeout(() => {
                setNotification('')
            }, 2000)
        } finally {
            setIsAdding(false)
        }
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Search size={48} className="mx-auto mb-2 text-slate-400" />
                    <p className="text-slate-600">Product not found</p>
                    <Link to="/products" className="text-blue-600 mt-4 inline-block">← Back to Products</Link>
                </div>
            </div>
        )
    }

    const selectedVariantObj = product.variants.find((v: any) => v.id === selectedVariant)

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                {/* Header */}
                <div className="bg-white shadow-sm border-b sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <Link to="/products" className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1">
                            <ChevronLeft size={18} /> Back to Products
                        </Link>
                    </div>
                </div>

                {/* Notification */}
                {notification && (
                    <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
                        {notification}
                    </div>
                )}

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid gap-8 lg:grid-cols-2">
                        {/* Product Images */}
                        <div className="space-y-4">
                            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg h-96 flex items-center justify-center text-9xl border-2 border-slate-200">
                                {product.images[0]}
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {product.images.map((img: string, i: number) => (
                                    <button
                                        key={i}
                                        className="h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center text-4xl border-2 border-slate-200 hover:border-blue-500 transition"
                                    >
                                        {img}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Details */}
                        <div className="space-y-6">
                            {/* Header */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold capitalize">
                                        {product.type}
                                    </span>
                                    {!product.inStock && (
                                        <span className="text-xs px-3 py-1 bg-red-100 text-red-800 rounded-full font-semibold">
                                            Out of Stock
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">{product.name}</h1>
                                <div className="flex items-center gap-2 mb-2">
                                    <Star size={20} className="text-yellow-500 fill-yellow-500" />
                                    <span className="text-sm font-medium">{product.rating}</span>
                                    <span className="text-xs text-slate-500">({product.reviews} reviews)</span>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-baseline gap-2 pb-4 border-b">
                                <span className="text-4xl font-bold text-blue-600">${product.price}</span>
                                <span className="text-sm text-slate-500">USD</span>
                            </div>

                            {/* Description */}
                            <div>
                                <p className="text-slate-700 leading-relaxed">{product.description}</p>
                            </div>

                            {/* Variant Selection */}
                            <div>
                                <label className="block text-sm font-semibold mb-3">Select Variant</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {product.variants.map((variant: any) => (
                                        <button
                                            key={variant.id}
                                            onClick={() => setSelectedVariant(variant.id)}
                                            className={`p-3 rounded-lg border-2 transition ${selectedVariant === variant.id
                                                ? 'border-blue-600 bg-blue-50'
                                                : 'border-slate-200 bg-white hover:border-blue-400'
                                                }`}
                                        >
                                            <div className="font-medium text-sm text-slate-900">{variant.size}</div>
                                            {variant.color && <div className="text-xs text-slate-600">{variant.color}</div>}
                                            {variant.coating && <div className="text-xs text-slate-600">{variant.coating}</div>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="block text-sm font-semibold mb-3">Quantity</label>
                                <div className="flex items-center gap-3 w-32">
                                    <button
                                        onClick={() => setQty(Math.max(1, qty - 1))}
                                        className="w-10 h-10 border border-slate-300 rounded-lg hover:bg-slate-100 transition font-semibold flex items-center justify-center"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        value={qty}
                                        onChange={e => setQty(Math.max(1, Number(e.target.value)))}
                                        className="flex-1 border border-slate-300 rounded-lg px-2 py-2 text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={() => setQty(qty + 1)}
                                        className="w-10 h-10 border border-slate-300 rounded-lg hover:bg-slate-100 transition font-semibold flex items-center justify-center"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Add to Cart Button */}
                            <button
                                onClick={handleAddToCart}
                                disabled={!product.inStock || isAdding}
                                className={`w-full py-3 rounded-lg font-semibold text-white text-lg transition flex items-center justify-center gap-2 ${product.inStock
                                    ? 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
                                    : 'bg-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                <ShoppingCart size={20} />
                                {isAdding ? 'Adding...' : 'Add to Cart'}
                            </button>

                            <Link
                                to="/cart"
                                className="w-full py-3 rounded-lg font-semibold text-blue-600 border-2 border-blue-600 text-center hover:bg-blue-50 transition"
                            >
                                View Cart
                            </Link>

                            {/* Specifications */}
                            <div className="pt-4 border-t">
                                <h3 className="font-semibold text-slate-900 mb-3">Specifications</h3>
                                <div className="space-y-2 text-sm">
                                    {Object.entries(product.specs).map(([key, value]) => (
                                        <div key={key} className="flex justify-between">
                                            <span className="text-slate-600 capitalize">{key}:</span>
                                            <span className="font-medium text-slate-900">{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Features */}
                            <div className="pt-4 border-t">
                                <h3 className="font-semibold text-slate-900 mb-3">Features</h3>
                                <div className="space-y-2">
                                    {product.features.map((feature: string, i: number) => (
                                        <div key={i} className="text-sm text-slate-700">{feature}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
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
                                    Continue
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
                                Continue
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
        </>
    )
}

export default ProductDetailPage
