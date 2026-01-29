import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth-store'
import { LogOut, LogIn, UserPlus, ShoppingCart, Glasses, Menu, X } from 'lucide-react'

const roleLabels: Record<number, string> = {
    0: 'Admin',
    1: 'Manager',
    2: 'Operation',
    3: 'Sale',
    4: 'Customer',
}

export function Navbar() {
    const navigate = useNavigate()
    const { isAuthenticated, logout, user } = useAuthStore()
    const [cartCount, setCartCount] = useState(0)
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    useEffect(() => {
        // Update cart count from localStorage
        const updateCartCount = () => {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]')
            setCartCount(cart.length)
        }

        updateCartCount()

        // Listen for custom cart update event
        window.addEventListener('cartUpdated', updateCartCount)

        // Listen for storage changes (cross-tab)
        window.addEventListener('storage', updateCartCount)

        return () => {
            window.removeEventListener('cartUpdated', updateCartCount)
            window.removeEventListener('storage', updateCartCount)
        }
    }, [])

    const handleLogout = () => {
        logout()
        navigate('/')
        setIsMenuOpen(false)
    }

    return (
        <nav className="fixed top-0 w-full bg-white shadow-md border-b border-slate-200 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2 flex-shrink-0">
                        <Glasses size={28} /> WDP
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/products" className="text-slate-700 hover:text-blue-600 font-medium transition">
                            Products
                        </Link>
                        <Link to="/virtual-tryon" className="text-slate-700 hover:text-blue-600 font-medium transition">
                            Try-On
                        </Link>

                        {isAuthenticated ? (
                            <>
                                {user?.role !== 4 && (
                                    <Link to="/dashboard" className="text-slate-700 hover:text-blue-600 font-medium transition">
                                        Dashboard
                                    </Link>
                                )}
                                <Link to="/account" className="text-slate-700 hover:text-blue-600 font-medium transition">
                                    Account
                                </Link>
                                {user?.role === 4 && (
                                    <Link to="/orders" className="text-slate-700 hover:text-blue-600 font-medium transition">
                                        Orders
                                    </Link>
                                )}
                                <Link
                                    to="/cart"
                                    className="relative text-slate-700 hover:text-blue-600 font-medium transition flex items-center gap-1"
                                >
                                    <ShoppingCart size={20} /> Cart
                                    {cartCount > 0 && (
                                        <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-semibold transition flex items-center gap-1"
                                >
                                    <LogOut size={18} /> Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-800 hover:border-blue-300 font-semibold transition flex items-center gap-1"
                                >
                                    <LogIn size={18} /> Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold transition flex items-center gap-1"
                                >
                                    <UserPlus size={18} /> Sign Up
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden border-t border-slate-200 py-4 space-y-2">
                        <Link
                            to="/products"
                            className="block px-4 py-2 text-slate-700 hover:bg-blue-50 rounded-lg transition"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Products
                        </Link>
                        <Link
                            to="/virtual-tryon"
                            className="block px-4 py-2 text-slate-700 hover:bg-blue-50 rounded-lg transition"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Try-On
                        </Link>

                        {isAuthenticated ? (
                            <>
                                {user?.role !== 4 && (
                                    <Link
                                        to="/dashboard"
                                        className="block px-4 py-2 text-slate-700 hover:bg-blue-50 rounded-lg transition"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                )}
                                <Link
                                    to="/account"
                                    className="block px-4 py-2 text-slate-700 hover:bg-blue-50 rounded-lg transition"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Account
                                </Link>
                                {user?.role === 4 && (
                                    <Link
                                        to="/orders"
                                        className="block px-4 py-2 text-slate-700 hover:bg-blue-50 rounded-lg transition"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Orders
                                    </Link>
                                )}
                                <Link
                                    to="/cart"
                                    className="block px-4 py-2 text-slate-700 hover:bg-blue-50 rounded-lg transition relative"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <ShoppingCart size={18} className="inline mr-2" /> Cart {cartCount > 0 && <span className="ml-1 text-red-500 font-bold">({cartCount})</span>}
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-semibold flex items-center gap-2"
                                >
                                    <LogOut size={18} /> Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="block px-4 py-2 text-slate-700 hover:bg-blue-50 rounded-lg transition flex items-center gap-2"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <LogIn size={18} /> Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center font-semibold flex items-center justify-center gap-2"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <UserPlus size={18} /> Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav>
    )
}