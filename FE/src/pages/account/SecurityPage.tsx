import React from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiShield } from 'react-icons/fi'
import { AccountNav } from '@/components/account/AccountNav'
import { SecurityCard } from '@/components/account/SecurityCard'
import { useAuthStore } from '@/store/auth-store'

const SecurityPage: React.FC = () => {
  const { logout } = useAuthStore()

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Security</h1>
          <p className="text-slate-600">Manage your password and account security settings</p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-24">
              <AccountNav currentSection="security" onLogout={handleLogout} />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-6">
            {/* Security Card */}
            <SecurityCard />

            {/* Additional Security Info Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <FiShield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Login Activity</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-slate-600">
                  This is your current session. If you notice any suspicious activity, please change your
                  password immediately and contact our support team.
                </p>
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">Current Session</p>
                      <p className="text-sm text-slate-500">
                        Active now • {navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Web Browser'}
                      </p>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecurityPage
