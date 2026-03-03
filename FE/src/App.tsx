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

// Customer pages (store/)
import { StorePage } from './pages/store/StorePage'
import { ProductDetailPage } from './pages/store/ProductDetailPage'
import CartPage from './pages/store/CartPage'
import CheckoutPage from './pages/store/CheckoutPage'
import AccountPage from './pages/AccountPage'
import OrderHistoryPage from './pages/store/OrderHistoryPage'
import OrderDetailPage from './pages/store/OrderDetailPage'
import PrescriptionUploadPage from './pages/store/PrescriptionUploadPage'
import VirtualTryOnPage from './pages/store/VirtualTryOnPage'

// Staff pages
import StaffOrdersPage from './pages/StaffOrdersPage'

// Operations pages
import OperationsDashboard from './pages/OperationsDashboard'
import ShippingPage from './pages/ShippingPage'

// Manager pages
import PromotionsPage from './pages/manager/PromotionsPage'
import AnalyticsPage from './pages/manager/AnalyticsPage'
import { ProductCatalogPage } from './pages/manager/ProductCatalogPage'
import { ProductDetailAdminPage } from './pages/manager/ProductDetailAdminPage'
import { InventoryManagementPage } from './pages/manager/InventoryManagementPage'
import { InventoryDetailPage } from './pages/manager/InventoryDetailPage'
import { SupplierManagementPage } from './pages/manager/SupplierManagementPage'
import { SupplierFormPage } from './pages/manager/SupplierFormPage'

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

          {/* Customer routes - Storefront */}
          <Route path="/store" element={<StorePage />} />
          <Route path="/store/:category" element={<StorePage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/products" element={<StorePage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
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
            <Route path="all-products" element={<ProductCatalogPage />} />
            <Route path="products-catalog/:id" element={<ProductDetailAdminPage />} />
            <Route path="orders" element={<StaffOrdersPage />} />
            <Route path="operations" element={<OperationsDashboard />} />
            <Route path="shipping" element={<ShippingPage />} />
            <Route path="promotions" element={<PromotionsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="inventory" element={<InventoryManagementPage />} />
            <Route path="suppliers/new" element={<SupplierFormPage />} />
            <Route path="suppliers/:id/edit" element={<SupplierFormPage />} />
            <Route path="suppliers/:id" element={<SupplierFormPage />} />
            <Route path="suppliers" element={<SupplierManagementPage />} />
            <Route path="inventory/:sku" element={<InventoryDetailPage />} />
          </Route>

          {/* Inventory/Supplier detail routes (outside dashboard layout for standalone access) */}
          <Route
            path="/manager/inventory/:sku"
            element={
              <ProtectedRoute>
                <InventoryDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
