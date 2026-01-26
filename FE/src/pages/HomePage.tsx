import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth-store'

const highlights = [
  { title: 'Ready Stock', description: 'Pick in-stock frames and lenses for fastest delivery.', icon: '🚚' },
  { title: 'Pre-order', description: 'Reserve popular styles with clear delivery ETAs.', icon: '🗓️' },
  { title: 'Prescription', description: 'Upload Rx, select lens type, coatings, and PD with guidance.', icon: '🩺' },
]

const categories = [
  { title: 'Frames', detail: 'Style, size, color, 2D/3D gallery, variants' },
  { title: 'Lenses', detail: 'Single vision, bifocal, progressive, treatments' },
  { title: 'Services', detail: 'Adjustments, repairs, blue-light upgrades' },
]

const steps = [
  { title: 'Select', detail: 'Browse frames/lenses with filters & search' },
  { title: 'Configure', detail: 'Choose order type: Ready, Pre-order, Prescription' },
  { title: 'Validate', detail: 'Upload/enter Rx, PD; staff review' },
  { title: 'Fulfill', detail: 'Operations assemble, QA, and ship with tracking' },
]

export function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      <header className="border-b bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg shadow-md">
              WDP
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Eyewear platform</p>
              <h1 className="text-2xl font-bold">Premium frames & lenses</h1>
            </div>
          </div>
          <nav className="flex gap-2 sm:gap-6 items-center text-sm font-medium">
            <a href="#catalog" className="hidden sm:inline text-slate-700 hover:text-blue-600 transition-colors">Catalog</a>
            <a href="#prescription" className="hidden sm:inline text-slate-700 hover:text-blue-600 transition-colors">Prescription</a>
            <a href="#process" className="hidden sm:inline text-slate-700 hover:text-blue-600 transition-colors">Process</a>
            <a href="#contact" className="hidden sm:inline text-slate-700 hover:text-blue-600 transition-colors">Support</a>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-blue-700 font-semibold hover:text-blue-900 transition-colors">Dashboard</Link>
                <button
                  onClick={handleLogout}
                  className="hidden sm:inline bg-slate-100 text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-blue-700 font-semibold hover:text-blue-900 transition-colors">Login</Link>
                <Link to="/register" className="hidden sm:inline bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-r from-blue-50 to-indigo-50" id="hero">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold text-blue-700">Frames · Lenses · Services</p>
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight">See better, look sharper.</h2>
            <p className="text-lg text-slate-700">
              Shop ready-stock frames, pre-order upcoming styles, or build prescription eyewear with guided lens options, coatings, and PD capture.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#catalog"
                className="bg-blue-600 text-white px-6 py-3 rounded-full text-base font-semibold shadow-lg hover:bg-blue-700 transition-colors"
              >
                Shop Frames & Lenses
              </a>
              <a
                href="#prescription"
                className="px-6 py-3 rounded-full border border-blue-200 text-blue-700 font-semibold hover:border-blue-400 hover:text-blue-900 transition-colors"
              >
                Upload Prescription
              </a>
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="px-6 py-3 rounded-full border border-slate-200 text-slate-800 font-semibold hover:border-blue-300 hover:text-blue-900 transition-colors"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="px-6 py-3 rounded-full border border-slate-200 text-slate-800 font-semibold hover:border-blue-300 hover:text-blue-900 transition-colors"
                >
                  Staff Login
                </Link>
              )}
            </div>
            <div className="flex gap-6 text-sm text-slate-700">
              <div>
                <p className="font-bold text-xl">48h</p>
                <p>Ready-stock dispatch</p>
              </div>
              <div>
                <p className="font-bold text-xl">Rx QA</p>
                <p>Staff validation</p>
              </div>
              <div>
                <p className="font-bold text-xl">Live</p>
                <p>Order tracking</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-500 tracking-[0.2em]">Order types</p>
                <h3 className="text-xl font-semibold">Choose your flow</h3>
              </div>
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">Guided</span>
            </div>
            <div className="grid gap-3">
              {highlights.map((item) => (
                <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-blue-600 text-white p-4 text-sm">
              <p className="font-semibold">Need help?</p>
              <p className="text-blue-50">Sales & Support can review your Rx, suggest lenses, and confirm delivery timelines.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-16" id="catalog">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-10">
            <div>
              <p className="text-sm font-semibold text-blue-700">Catalog</p>
              <h3 className="text-3xl font-bold">Frames, lenses, and services</h3>
              <p className="text-slate-600">Filter by style, size, color, price, and availability. Variant-aware product cards.</p>
            </div>
            <a href="#prescription" className="hidden sm:inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900">
              Prescription builder →
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((c) => (
              <div key={c.title} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                <h4 className="text-xl font-semibold mb-2 text-slate-900">{c.title}</h4>
                <p className="text-slate-600 text-sm">{c.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white" id="prescription">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-blue-700">Prescription flow</p>
            <h3 className="text-3xl font-bold">Upload, validate, and assemble</h3>
            <ul className="space-y-3 text-slate-700 text-sm">
              <li>• Input or upload Rx: SPH, CYL, AXIS, PD, ADD</li>
              <li>• Select lens type: single vision, bifocal, progressive</li>
              <li>• Add treatments: anti-glare, blue light, transitions</li>
              <li>• Staff validation and customer confirmation</li>
              <li>• Operations grind lenses, assemble, QC, and ship</li>
            </ul>
            <div className="flex gap-3">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-md hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-md hover:bg-blue-700 transition-colors"
                  >
                    Create Account
                  </Link>
                  <Link
                    to="/login"
                    className="px-5 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 hover:border-blue-300 hover:text-blue-900 transition-colors"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between text-sm">
              <p className="uppercase tracking-[0.2em] text-slate-400">Rx Summary</p>
              <span className="bg-emerald-500/20 text-emerald-200 px-3 py-1 rounded-full">Validated</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-slate-400">Right Eye</p>
                <p className="font-semibold">SPH -1.25 · CYL -0.50 · AX 175</p>
                <p className="text-slate-400">PD 31</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-slate-400">Left Eye</p>
                <p className="font-semibold">SPH -1.00 · CYL -0.25 · AX 180</p>
                <p className="text-slate-400">PD 31</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-slate-400">Lens</p>
                <p className="font-semibold">Progressive · Blue light</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-slate-400">Status</p>
                <p className="font-semibold">In QA · Ops assigned</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm">Customers can track status and chat with support; staff can flag issues before grinding.</p>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-slate-50" id="process">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-sm font-semibold text-blue-700">Order lifecycle</p>
              <h3 className="text-3xl font-bold">Customer → Sales → Operations → Delivery</h3>
            </div>
            <span className="text-xs font-semibold text-slate-600">Live status history</span>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {steps.map((s) => (
              <div key={s.title} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Step</p>
                <h4 className="text-lg font-semibold text-slate-900">{s.title}</h4>
                <p className="text-sm text-slate-600 mt-2">{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-14 bg-white" id="contact">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-100 rounded-3xl shadow-sm px-6 py-8">
          <div>
            <p className="text-sm font-semibold text-blue-700">Need assistance?</p>
            <h3 className="text-2xl font-bold">Sales & Support are ready to help</h3>
            <p className="text-slate-600">We can validate prescriptions, confirm stock, and expedite your order.</p>
          </div>
          <div className="flex gap-3">
            <a href="mailto:support@wdp.com" className="bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-md hover:bg-blue-700 transition-colors">Contact Support</a>
            <a href="#hero" className="px-5 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 hover:border-blue-300 hover:text-blue-900 transition-colors">Back to top</a>
          </div>
        </div>
      </section>

      <footer className="py-6 text-center text-sm text-slate-600">
        © {new Date().getFullYear()} WDP Eyewear. Built for frames, lenses, and prescription workflows.
      </footer>
    </div>
  )
}
