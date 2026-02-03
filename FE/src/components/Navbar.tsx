import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth-store'
import {
  FiLogOut,
  FiLogIn,
  FiUserPlus,
  FiShoppingCart,
  FiMinus,
  FiMenu,
  FiX,
  FiUser,
  FiGrid,
  FiEye,
} from 'react-icons/fi'

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
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      setCartCount(cart.length)
    }

    updateCartCount()
    window.addEventListener('cartUpdated', updateCartCount)
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
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 h-16 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo Area */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-lg shadow-blue-500/20 group-hover:bg-blue-700 transition-all">
              <FiEye size={20} />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900">
              WDP<span className="text-blue-600">.</span>CORE
            </span>
          </Link>

          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center h-full gap-1">
            <Link
              to="/products"
              className="px-4 h-full flex items-center text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 border-b-2 border-transparent hover:border-blue-600 transition-all"
            >
              Inventory
            </Link>
            <Link
              to="/virtual-tryon"
              className="px-4 h-full flex items-center text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 border-b-2 border-transparent hover:border-blue-600 transition-all"
            >
              Try-On
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-1 ml-4 border-l border-slate-200 pl-4 h-8">
                {user?.role !== 4 && (
                  <Link
                    to="/dashboard"
                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-blue-600 flex items-center gap-2"
                  >
                    <FiGrid size={14} /> Dash
                  </Link>
                )}
                <Link
                  to="/account"
                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-blue-600 flex items-center gap-2"
                >
                  <FiUser size={14} /> Profile
                </Link>
                <Link
                  to="/cart"
                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-blue-600 flex items-center gap-2 relative"
                >
                  <FiShoppingCart size={14} />
                  Bag
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black h-4 px-1 min-w-[1rem] flex items-center justify-center rounded-[2px]">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="ml-2 px-3 py-1.5 border border-slate-300 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-rose-600 transition-all rounded-[2px] flex items-center gap-2"
                >
                  <FiLogOut size={14} /> Exit
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-4 border-l border-slate-200 pl-4 h-8">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 hover:text-blue-700 transition-colors border border-transparent"
                >
                  <FiLogIn size={15} /> Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all rounded-[2px]"
                >
                  <FiUserPlus size={15} /> Join
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-[2px] transition-colors"
          >
            {isMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 w-full bg-white border-b border-slate-300 shadow-xl p-4 space-y-2 animate-in slide-in-from-top-4">
          <Link
            to="/products"
            className="block px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-blue-600 bg-slate-50/50 border border-slate-200 rounded-[2px]"
            onClick={() => setIsMenuOpen(false)}
          >
            Inventory
          </Link>
          <Link
            to="/virtual-tryon"
            className="block px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-blue-600 bg-slate-50/50 border border-slate-200 rounded-[2px]"
            onClick={() => setIsMenuOpen(false)}
          >
            Virtual Try-On
          </Link>

          {isAuthenticated ? (
            <>
              {user?.role !== 4 && (
                <Link
                  to="/dashboard"
                  className="block px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-blue-600 bg-slate-50/50 border border-slate-200 rounded-[2px]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Console
                </Link>
              )}
              <Link
                to="/account"
                className="block px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-blue-600 bg-slate-50/50 border border-slate-200 rounded-[2px]"
                onClick={() => setIsMenuOpen(false)}
              >
                User Profile
              </Link>
              <Link
                to="/cart"
                className="block px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-blue-600 bg-slate-50/50 border border-slate-200 rounded-[2px] flex items-center justify-between"
                onClick={() => setIsMenuOpen(false)}
              >
                <span>Shopping Bag</span>
                {cartCount > 0 && (
                  <span className="bg-rose-600 text-white px-2 py-0.5 rounded-[2px] text-[10px] font-black">
                    {cartCount}
                  </span>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-rose-600 hover:bg-rose-50 bg-rose-50/30 border border-rose-100 rounded-[2px] transition-colors flex items-center gap-4"
              >
                <FiLogOut /> Terminate Session
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                to="/login"
                className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 border border-slate-300 rounded-[2px] text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-3 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-[2px] text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
