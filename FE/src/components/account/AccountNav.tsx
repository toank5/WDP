import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  FiUser,
  FiShoppingBag,
  FiMapPin,
  FiShield,
  FiLogOut,
} from 'react-icons/fi'
import { useAuthStore } from '@/store/auth-store'

export type AccountSection = 'profile' | 'orders' | 'addresses' | 'security'

interface AccountNavProps {
  currentSection?: AccountSection
  onLogout?: () => void
}

const navItems = [
  { id: 'profile' as const, label: 'Profile', icon: FiUser, path: '/account/profile' },
  { id: 'orders' as const, label: 'Orders', icon: FiShoppingBag, path: '/orders' },
  { id: 'addresses' as const, label: 'Addresses', icon: FiMapPin, path: '/account/addresses' },
  { id: 'security' as const, label: 'Security', icon: FiShield, path: '/account/security' },
]

export const AccountNav: React.FC<AccountNavProps> = ({ currentSection = 'profile', onLogout }) => {
  const location = useLocation()
  const { logout } = useAuthStore()

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      logout()
    }
  }

  // Determine active item based on currentSection or location
  const getActiveItem = () => {
    if (currentSection) return currentSection
    const path = location.pathname
    if (path === '/account/profile') return 'profile'
    if (path === '/orders' || path === '/account/orders') return 'orders'
    if (path === '/account/addresses') return 'addresses'
    if (path === '/account/security') return 'security'
    return 'profile'
  }

  const activeItem = getActiveItem()

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = activeItem === item.id

        return (
          <Link
            key={item.id}
            to={item.path}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all
              ${isActive
                ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }
            `}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>{item.label}</span>
          </Link>
        )
      })}

      <div className="pt-4 mt-4 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-all"
        >
          <FiLogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  )
}
