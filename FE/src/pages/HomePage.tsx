import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth-store'
import {
  FiTruck,
  FiCalendar,
  FiInfo,
  FiBarChart2,
  FiFileText,
  FiShoppingBag,
  FiZap,
  FiTrendingUp,
  FiPackage,
  FiLogOut,
  FiLogIn,
  FiUserPlus,
  FiShoppingCart,
  FiSettings,
  FiUsers,
  FiChevronRight,
  FiActivity,
} from 'react-icons/fi'

const highlights = [
  {
    title: 'Ready Stock',
    description: 'Immediate delivery for our in-stock frames and lenses.',
    icon: FiTruck,
  },
  {
    title: 'Pre-order',
    description: 'Reserve incoming styles with confirmed delivery dates.',
    icon: FiCalendar,
  },
  {
    title: 'Prescription',
    description: 'Full support for custom Rx lens configurations.',
    icon: FiInfo,
  },
]

const categories = [
  {
    title: 'Frames',
    detail: 'Optical frames and designer collections',
    link: '/products?type=frame',
  },
  {
    title: 'Lenses',
    detail: 'Single vision, bifocal, and progressive solutions',
    link: '/products?type=lens',
  },
  {
    title: 'Maintenance',
    detail: 'Professional adjustments and repair services',
    link: '/products?type=service',
  },
]

const adminDashboards = {
  0: [
    // Admin
    { label: 'System Overview', link: '/dashboard', icon: FiBarChart2 },
    { label: 'User Directory', link: '/dashboard/users', icon: FiUsers },
    { label: 'Policy Center', link: '/dashboard/policies', icon: FiFileText },
    { label: 'Inventory', link: '/dashboard/products', icon: FiShoppingBag },
    { label: 'Configurations', link: '/admin/system-config', icon: FiSettings },
  ],
  1: [
    // Manager
    { label: 'Performance', link: '/dashboard', icon: FiBarChart2 },
    { label: 'Product Catalog', link: '/dashboard/products', icon: FiShoppingBag },
    { label: 'Promotions', link: '/admin/promotions', icon: FiZap },
    { label: 'Sales Reports', link: '/admin/analytics', icon: FiTrendingUp },
  ],
  2: [
    // Operation
    { label: 'Order Processing', link: '/admin/operations', icon: FiPackage },
    { label: 'Logistics', link: '/admin/shipping', icon: FiTruck },
    { label: 'Documentation', link: '/admin/orders', icon: FiFileText },
  ],
  3: [
    // Sale/Support
    { label: 'Customer Orders', link: '/admin/orders', icon: FiFileText },
    { label: 'Market Stats', link: '/dashboard', icon: FiBarChart2 },
  ],
}

export function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated, logout, user } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const roleLabels: Record<number, string> = {
    0: 'System Administrator',
    1: 'Warehouse Manager',
    2: 'Operations Officer',
    3: 'Sales Associate',
    4: 'Registered Customer',
  }

  const dashboards =
    user?.role !== undefined ? adminDashboards[user.role as keyof typeof adminDashboards] : []

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Top Banner for Authenticated Internal Users */}
      {isAuthenticated && user?.role !== 4 && (
        <section className="bg-slate-100 border-b border-slate-300">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">
                  Console: {user?.fullName || 'User'}
                </h2>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <FiActivity className="text-blue-600" /> Current Role:{' '}
                  {roleLabels[user?.role ?? 4]}
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
              {dashboards?.map((dash, i) => (
                <Link
                  key={i}
                  to={dash.link}
                  className="p-4 bg-white border border-slate-300 rounded-[2px] shadow-sm hover:shadow-md hover:border-blue-500 transition-all flex flex-col items-center gap-2 text-center group"
                >
                  <dash.icon
                    size={24}
                    className="text-slate-400 group-hover:text-blue-600 transition-colors"
                  />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">
                    {dash.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hero / Main Display */}
      <section className="bg-white border-b border-slate-300 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
            WDP Eyewear Management & Fulfillment
          </h1>
          <p className="text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto italic border-l-4 border-slate-200 pl-4">
            "Professional-grade optics, streamlined ordering processes, and comprehensive
            prescription tracking solutions for our valued community."
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              to="/products"
              className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-[2px] transition-all shadow-sm"
            >
              View Inventory
            </Link>
            <Link
              to="/prescription/upload"
              className="px-10 py-3 border border-slate-300 hover:bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-[0.2em] rounded-[2px] transition-all"
            >
              Submit Rx
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Information Panels */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            {highlights.map((h, i) => (
              <div
                key={i}
                className="p-8 bg-white border border-slate-300 rounded-[2px] shadow-sm flex flex-col items-center text-center space-y-4"
              >
                <div className="w-12 h-12 bg-slate-50 border border-slate-200 flex items-center justify-center text-blue-600">
                  <h.icon size={24} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">
                  {h.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {h.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorical Breakdown */}
      <section className="py-20 bg-white border-y border-slate-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-10 pb-4 border-b border-slate-100">
            <div className="w-1.5 h-6 bg-blue-600" />
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-slate-400">
              Departmental Catalog
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {categories.map((c, i) => (
              <Link
                key={i}
                to={c.link}
                className="p-8 bg-slate-50 border border-slate-200 rounded-[2px] hover:border-blue-400 hover:bg-white transition-all group"
              >
                <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center justify-between">
                  {c.title}
                  <FiChevronRight className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{c.detail}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Internal Workflows */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden">
            <div className="bg-slate-100 border-b border-slate-300 px-8 py-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600">
                Standard Operating Procedures
              </h2>
            </div>
            <div className="p-8 grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wider">
                  Workflow Instructions
                </h3>
                <ul className="space-y-4">
                  {[
                    {
                      step: '01',
                      title: 'Inventory Selection',
                      text: 'Locate desired frames or lenses using filtered search logic.',
                    },
                    {
                      step: '02',
                      title: 'Prescription Entry',
                      text: 'Input verified medical data into the configuration interface.',
                    },
                    {
                      step: '03',
                      title: 'Quality Assurance',
                      text: 'Operations team validates Rx data for production accuracy.',
                    },
                    {
                      step: '04',
                      title: 'Order Fulfillment',
                      text: 'Final assembly, packaging, and dispatch tracking.',
                    },
                  ].map((s) => (
                    <li key={s.step} className="flex gap-4">
                      <span className="text-xs font-black text-slate-300 leading-none">
                        {s.step}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800 uppercase tracking-tight mb-1">
                          {s.title}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">{s.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-8 space-y-6">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Incomplete Actions
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed italic">
                  "Our system ensures that every order is tracked from initial submission to final
                  delivery. Please ensure all documentation is attached before fulfillment."
                </p>
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Rx Verification
                    Active
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Logistics Monitoring
                    Active
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Primary Call-to-Action */}
      <section className="py-20 bg-white border-t border-slate-300">
        <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">
            Access Fulfillment Center
          </h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Ready to process new orders or manage your account? Access the system through the
            authorized dashboard links above or explore the public inventory.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link
              to="/products"
              className="px-8 py-2 bg-slate-900 hover:bg-black text-white font-bold text-[10px] uppercase tracking-widest rounded-[2px] transition-all"
            >
              Enter Catalog
            </Link>
          </div>
        </div>
      </section>

      {/* Global Footer */}
      <footer className="bg-slate-100 border-t border-slate-300 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
            WDP Eyewear &copy; 2026 / Internal Systems Division
          </div>
          <div className="flex gap-8">
            <Link
              to="/"
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/"
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
            >
              Terms of Use
            </Link>
            <Link
              to="/"
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
            >
              Support Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
