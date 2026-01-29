import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth-store'
import { Truck, Calendar, Glasses, BarChart3, FileText, ShoppingBag, Zap, TrendingUp, Package, LogOut, LogIn, UserPlus, ShoppingCart, Settings, Users } from 'lucide-react'

const highlights = [
  { title: 'Ready Stock', description: 'Pick in-stock frames and lenses for fastest delivery.', icon: Truck },
  { title: 'Pre-order', description: 'Reserve popular styles with clear delivery ETAs.', icon: Calendar },
  { title: 'Prescription', description: 'Upload Rx, select lens type, coatings, and PD with guidance.', icon: Glasses },
]

const categories = [
  { title: 'Frames', detail: 'Style, size, color, 2D/3D gallery, variants', link: '/products?type=frame' },
  { title: 'Lenses', detail: 'Single vision, bifocal, progressive, treatments', link: '/products?type=lens' },
  { title: 'Services', detail: 'Adjustments, repairs, blue-light upgrades', link: '/products?type=service' },
]

const steps = [
  { title: 'Select', detail: 'Browse frames/lenses with filters & search' },
  { title: 'Configure', detail: 'Choose order type: Ready, Pre-order, Prescription' },
  { title: 'Validate', detail: 'Upload/enter Rx, PD; staff review' },
  { title: 'Fulfill', detail: 'Operations assemble, QA, and ship with tracking' },
]

const adminDashboards = {
  0: [ // Admin
    { label: 'Dashboard', link: '/dashboard', icon: 'BarChart3' },
    { label: 'Users', link: '/dashboard/users', icon: 'Users' },
    { label: 'Policies', link: '/dashboard/policies', icon: 'FileText' },
    { label: 'Products', link: '/dashboard/products', icon: 'ShoppingBag' },
    { label: 'System Config', link: '/admin/system-config', icon: 'Settings' },
  ],
  1: [ // Manager
    { label: 'Dashboard', link: '/dashboard', icon: 'BarChart3' },
    { label: 'Products', link: '/dashboard/products', icon: 'ShoppingBag' },
    { label: 'Promotions', link: '/admin/promotions', icon: 'Zap' },
    { label: 'Analytics', link: '/admin/analytics', icon: 'TrendingUp' },
  ],
  2: [ // Operation
    { label: 'Operations', link: '/admin/operations', icon: 'Package' },
    { label: 'Shipping', link: '/admin/shipping', icon: 'Truck' },
    { label: 'Orders', link: '/admin/orders', icon: 'FileText' },
  ],
  3: [ // Sale/Support
    { label: 'Orders', link: '/admin/orders', icon: 'FileText' },
    { label: 'Dashboard', link: '/dashboard', icon: 'BarChart3' },
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
    0: 'Admin',
    1: 'Manager',
    2: 'Operation',
    3: 'Sale/Support',
    4: 'Customer',
  }

  const dashboards = user?.role !== undefined ? adminDashboards[user.role as keyof typeof adminDashboards] : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">

      {isAuthenticated && user?.role !== 4 && (
        <section className="px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Welcome, {user?.fullName || 'User'}</h2>
                <p className="text-slate-600">Role: {roleLabels[user?.role ?? 4]}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {dashboards?.map((dash, i) => {
                const iconMap: Record<string, any> = {
                  BarChart3: BarChart3,
                  Users: Users,
                  FileText: FileText,
                  ShoppingBag: ShoppingBag,
                  Settings: Settings,
                  Zap: Zap,
                  TrendingUp: TrendingUp,
                  Package: Package,
                  Truck: Truck,
                };
                const IconComponent = iconMap[dash.icon];
                return (
                  <Link
                    key={i}
                    to={dash.link}
                    className="p-4 bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-400 transition cursor-pointer text-center flex flex-col items-center"
                  >
                    <div className="text-blue-600 mb-2">{IconComponent ? <IconComponent size={32} /> : '📍'}</div>
                    <div className="font-semibold text-slate-800">{dash.label}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-r from-blue-50 to-indigo-50" id="hero">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Find Your Perfect Glasses</h1>
          <p className="text-lg text-slate-600 mb-8">Browse our collection of frames, lenses, and services. Upload your prescription or choose ready-stock options.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products" className="px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
              Shop Now
            </Link>
            <Link to="/prescription/upload" className="px-8 py-3 rounded-lg border-2 border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 transition">
              Upload Prescription
            </Link>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {highlights.map((h, i) => {
              const IconComponent = h.icon as any;
              return (
                <div key={i} className="p-6 bg-white rounded-lg shadow-sm flex flex-col items-center text-center">
                  <div className="text-blue-600 mb-2"><IconComponent size={40} /></div>
                  <h3 className="font-semibold text-lg mb-1">{h.title}</h3>
                  <p className="text-sm text-slate-600">{h.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16" id="catalog">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Categories</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {categories.map((c, i) => (
              <Link key={i} to={c.link} className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition cursor-pointer border border-slate-200">
                <h3 className="text-xl font-semibold mb-2 text-blue-600">{c.title}</h3>
                <p className="text-slate-600">{c.detail}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Prescription Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white" id="prescription">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Prescription Orders</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-xl font-semibold mb-2">How It Works</h3>
              <ol className="space-y-2 text-sm text-slate-700">
                <li><strong>1. Upload Rx</strong> - Provide your prescription details</li>
                <li><strong>2. Select Lenses</strong> - Choose lens type, coatings, treatments</li>
                <li><strong>3. Pick Frames</strong> - Browse our 2D/3D gallery</li>
                <li><strong>4. Validate & Pay</strong> - Staff review, then proceed to checkout</li>
              </ol>
              <Link to="/prescription/upload" className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                Start Now
              </Link>
            </div>

            <div className="p-6 bg-indigo-50 rounded-lg border border-indigo-200">
              <h3 className="text-xl font-semibold mb-2">Why Choose Us?</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>✅ Expert verification of prescriptions</li>
                <li>✅ Premium lens options (Single Vision, Bifocal, Progressive)</li>
                <li>✅ Anti-reflective, Blue-light, UV coatings</li>
                <li>✅ Fast turnaround & quality assurance</li>
                <li>✅ 24/7 customer support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-slate-50" id="process">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Process</h2>
          <div className="grid gap-6 sm:grid-cols-4">
            {steps.map((step, i) => (
              <div key={i} className="p-6 bg-white rounded-lg shadow-sm border-l-4 border-blue-600">
                <div className="text-3xl font-bold text-blue-600 mb-2">{i + 1}</div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-14 bg-white" id="contact">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Glasses?</h2>
          <p className="text-lg text-slate-600 mb-6">Whether you prefer ready-stock, pre-order, or prescription orders, we've got you covered.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products" className="px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
              Browse Products
            </Link>
            <Link to="/virtual-tryon" className="px-8 py-3 rounded-lg border-2 border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 transition">
              Virtual Try-On
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-slate-600 border-t">
        © WDP Eyewear. Built for frames, lenses, and prescription workflows.
      </footer>
    </div>
  )
}
