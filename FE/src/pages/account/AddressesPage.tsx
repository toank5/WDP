import React from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiPlus, FiMapPin, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { AccountNav } from '@/components/account/AccountNav'
import { useAuthStore } from '@/store/auth-store'
import type { Address } from '@/types/api.types'

const AddressesPage: React.FC = () => {
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Bar */}
      <div className="bg-slate-100 border-b border-slate-300">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-semibold"
          >
            <FiArrowLeft /> Back to Home
          </Link>
          <h1 className="text-sm font-bold uppercase tracking-widest text-slate-500">
            My Account
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Addresses</h1>
            <p className="text-slate-600">Manage your shipping and billing addresses</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            <FiPlus className="w-4 h-4" />
            Add New Address
          </button>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-24">
              <AccountNav currentSection="addresses" onLogout={handleLogout} />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            {user?.addresses && user.addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.addresses.map((address: Address, index: number) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                          <FiMapPin className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-slate-900">
                          {address.type === 'SHIPPING' ? 'Shipping' : 'Billing'}
                        </span>
                        {index === 0 && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-slate-900">
                      <p className="font-medium">{address.street}</p>
                      <p className="text-slate-600 mt-1">
                        {address.city}, {address.zipCode}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <FiMapPin className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No addresses saved</h3>
                <p className="text-slate-500 mb-6">Add a shipping address to make checkout faster</p>
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                  <FiPlus className="w-4 h-4" />
                  Add Your First Address
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddressesPage
