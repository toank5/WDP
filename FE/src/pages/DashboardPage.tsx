import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth-store'
import {
  FiUser,
  FiPackage,
  FiHelpCircle,
  FiTool,
  FiLogOut,
  FiArrowRight,
  FiMail,
  FiShield,
  FiClock,
  FiMapPin,
} from 'react-icons/fi'

const roleLabels: Record<number, string> = {
  0: 'System Administrator',
  1: 'Warehouse Manager',
  2: 'Operations Officer',
  3: 'Sales Associate',
  4: 'Registered Customer',
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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Dashboard Header Bar */}
        <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300">
              <FiUser size={40} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{user.fullName}</h1>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-widest rounded-[2px]">
                  {roleLabels[user.role] ?? 'Standard User'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <FiMail size={12} /> {user.email}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 hover:text-rose-600 transition-all rounded-[2px]"
          >
            <FiLogOut size={14} /> Terminate Session
          </button>
        </div>

        {/* Informational Grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Account Panel */}
          <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden flex flex-col transition-all hover:border-slate-400">
            <div className="bg-slate-100 border-b border-slate-300 px-5 py-3 flex items-center gap-2">
              <FiShield className="text-slate-400" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600">
                Identity & Security
              </h2>
            </div>
            <div className="p-5 flex-1 space-y-4">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Manage your authentication credentials, multi-factor settings, and personal identity
                data.
              </p>
              <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:underline">
                Access Profile <FiArrowRight />
              </button>
            </div>
          </div>

          {/* Orders Panel */}
          <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden flex flex-col transition-all hover:border-slate-400">
            <div className="bg-slate-100 border-b border-slate-300 px-5 py-3 flex items-center gap-2">
              <FiPackage className="text-slate-400" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600">
                Fulfillment Status
              </h2>
            </div>
            <div className="p-5 flex-1 space-y-4">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Track established inventory shipments, pre-order queues, and active prescription
                workflows.
              </p>
              <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:underline">
                Order Documents <FiArrowRight />
              </button>
            </div>
          </div>

          {/* Support Panel */}
          <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden flex flex-col transition-all hover:border-slate-400">
            <div className="bg-slate-100 border-b border-slate-300 px-5 py-3 flex items-center gap-2">
              <FiHelpCircle className="text-slate-400" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600">
                Help Desk & FAQ
              </h2>
            </div>
            <div className="p-5 flex-1 space-y-4">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Contact specialized support staff regarding lens configurations, delivery ETAs, or
                technical issues.
              </p>
              <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:underline">
                Open Ticket <FiArrowRight />
              </button>
            </div>
          </div>

          {/* Administration Panel */}
          <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden flex flex-col transition-all hover:border-slate-400 border-l-4 border-l-blue-600">
            <div className="bg-slate-100 border-b border-slate-300 px-5 py-3 flex items-center gap-2">
              <FiTool className="text-slate-400" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600">
                Administrative Tools
              </h2>
            </div>
            <div className="p-5 flex-1 space-y-4">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Authorized personnel may access restricted system utilities, product editing, and
                role assignment.
              </p>
              <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:underline">
                Enter Workspace <FiArrowRight />
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity Log (Placeholder for Classic Dashboard feel) */}
        <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden">
          <div className="bg-slate-200 border-b border-slate-300 px-6 py-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-700">
              System Activity Log
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              {
                id: 1,
                action: 'User session initialized',
                date: '2026-02-03 20:15',
                loc: 'Berlin, DE',
                icon: FiClock,
              },
              {
                id: 2,
                action: 'Identity configuration accessed',
                date: '2026-02-03 19:42',
                loc: 'Berlin, DE',
                icon: FiShield,
              },
              {
                id: 3,
                action: 'Product catalog queried',
                date: '2026-02-03 18:30',
                loc: 'Berlin, DE',
                icon: FiPackage,
              },
            ].map((log) => (
              <div
                key={log.id}
                className="px-6 py-4 flex items-center justify-between group hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <log.icon className="text-slate-300 group-hover:text-blue-500" size={14} />
                  <div>
                    <p className="text-xs font-bold text-slate-700">{log.action}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{log.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                  <FiMapPin size={10} /> {log.loc}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-right">
            <button className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600">
              Export Full Log (.CSV)
            </button>
          </div>
        </div>

        {/* Global Footer */}
        <footer className="text-center py-6 text-[10px] font-bold uppercase tracking-[0.4em] text-slate-300">
          WDP-INTERNAL-SYSTEM / ENCRYPTED ACCESS
        </footer>
      </div>
    </div>
  )
}
