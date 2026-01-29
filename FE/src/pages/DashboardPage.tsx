import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth-store'

const roleLabels: Record<number, string> = {
  0: 'Admin',
  1: 'Manager',
  2: 'Operation',
  3: 'Sale',
  4: 'Customer',
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Welcome back</p>
            <h1 className="text-3xl font-bold text-slate-900">{user.fullName}</h1>
            <p className="text-slate-600">{user.email}</p>
            <p className="text-sm text-slate-500">Role: {roleLabels[user.role] ?? 'User'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-800 font-semibold hover:border-blue-300 hover:text-blue-900 transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Account</h2>
            <p className="text-sm text-slate-600">Manage your profile, addresses, and security.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Orders</h2>
            <p className="text-sm text-slate-600">Track ready stock, pre-orders, and prescription flows.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Support</h2>
            <p className="text-sm text-slate-600">Get help from sales/support staff about prescriptions and deliveries.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Staff tools</h2>
            <p className="text-sm text-slate-600">Role-aware dashboards can be added here for operations and managers.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
