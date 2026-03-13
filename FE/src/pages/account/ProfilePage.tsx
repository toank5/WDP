import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiLoader, FiMapPin } from 'react-icons/fi'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'
import { getMyProfile } from '@/lib/user-api'
import type { UserProfile } from '@/lib/user-api'
import { AccountNav } from '@/components/account/AccountNav'
import { ProfileSummary } from '@/components/account/ProfileSummary'
import { PersonalInfoForm } from '@/components/account/PersonalInfoForm'
import { PreferencesCard } from '@/components/account/PreferencesCard'
import { SecurityCard } from '@/components/account/SecurityCard'

const ProfilePage: React.FC = () => {
  const { user: authUser, logout } = useAuthStore()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const profile = await getMyProfile()
      setUser(profile)
    } catch (error) {
      // Silently fall back to auth store data if API fails (404 or backend not ready)
      // The user._id field may not be in auth store yet, so we use empty string
      if (authUser) {
        setUser({
          _id: '',
          fullName: authUser.fullName,
          email: authUser.email,
          phone: undefined,
          avatar: authUser.avatar,
          dateOfBirth: undefined,
          preferredLanguage: undefined,
          preferredCurrency: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUserUpdate = (updatedUser: UserProfile) => {
    setUser(updatedUser)
    // Update auth store if needed
    if (updatedUser.fullName || updatedUser.avatar) {
      // Could trigger auth store update here
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
  }

  // Get default address from auth user
  const defaultAddress = authUser?.addresses && authUser.addresses.length > 0
    ? authUser.addresses[0]
    : null

  const formatAddress = () => {
    if (!defaultAddress) return 'No address saved'
    return `${defaultAddress.street}, ${defaultAddress.city} ${defaultAddress.zipCode}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
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

        {/* Loading State */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-16">
            <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    )
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Account</h1>
          <p className="text-slate-600">Manage your profile and preferences</p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-24">
              <AccountNav currentSection="profile" onLogout={handleLogout} />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-6">
            {/* Profile Summary */}
            <ProfileSummary user={user} loading={loading} />

            {/* Personal Information Form */}
            {user && (
              <PersonalInfoForm user={user} onUserUpdate={handleUserUpdate} />
            )}

            {/* Default Shipping Address Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                    <FiMapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Default Shipping Address</h3>
                  </div>
                </div>
                <Link
                  to="/account/addresses"
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Manage Addresses
                </Link>
              </div>
              <div className="p-6">
                {defaultAddress ? (
                  <div className="text-slate-900">
                    <p className="font-medium">{defaultAddress.street}</p>
                    <p className="text-slate-600 mt-1">
                      {defaultAddress.city}, {defaultAddress.zipCode}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {defaultAddress.type === 'SHIPPING' ? 'Shipping' : 'Billing'} Address
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-slate-500 mb-4">No address saved yet</p>
                    <Link
                      to="/account/addresses"
                      className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Add Address
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Preferences Card */}
            <PreferencesCard />

            {/* Security Card */}
            <SecurityCard />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
