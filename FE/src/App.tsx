import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { DashboardLayout } from './pages/dashboard/DashboardLayout'
import { DashboardOverview } from './pages/dashboard/DashboardOverview'
import { UserManagementPage } from './pages/admin/UserManagementPage'
import { ProductManagementPage } from './pages/manager/ProductManagementPage'
import PolicyListPage from './pages/manager/PolicyListPage'
import PolicyFormPage from './pages/manager/PolicyFormPage'
import PolicyDetailPage from './pages/PolicyDetailPage'

// Customer pages
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import AccountPage from './pages/AccountPage'
import OrderHistoryPage from './pages/OrderHistoryPage'
import OrderDetailPage from './pages/OrderDetailPage'
import PrescriptionUploadPage from './pages/PrescriptionUploadPage'
import VirtualTryOnPage from './pages/VirtualTryOnPage'

// Staff pages
import StaffOrdersPage from './pages/StaffOrdersPage'

// Operations pages
import OperationsDashboard from './pages/OperationsDashboard'
import ShippingPage from './pages/ShippingPage'

// Manager pages
import PromotionsPage from './pages/PromotionsPage'
import AnalyticsPage from './pages/AnalyticsPage'

// Components
import { Navbar } from './components/Navbar'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="pt-16">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Customer routes */}
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/prescription/upload" element={<PrescriptionUploadPage />} />
          <Route path="/virtual-tryon" element={<VirtualTryOnPage />} />
          <Route path="/policies/:type" element={<PolicyDetailPage />} />

          {/* Admin/Staff/Operations routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardOverview />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="policies" element={<PolicyListPage />} />
            <Route path="policies/new" element={<PolicyFormPage />} />
            <Route path="policies/:id/edit" element={<PolicyFormPage />} />
            <Route path="products" element={<ProductManagementPage />} />
            <Route path="orders" element={<StaffOrdersPage />} />
            <Route path="operations" element={<OperationsDashboard />} />
            <Route path="shipping" element={<ShippingPage />} />
            <Route path="promotions" element={<PromotionsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
