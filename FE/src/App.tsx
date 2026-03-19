import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import FavoritesPage from './pages/FavoritesPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { DashboardLayout } from './pages/dashboard/DashboardLayout'
import { DashboardOverview } from './pages/dashboard/DashboardOverview'
import { UserManagementPage } from './pages/admin/UserManagementPage'
import { ProductManagementPage } from './pages/manager/ProductManagementPage'
import PolicyListPage from './pages/manager/PolicyListPage'
import PolicyFormPage from './pages/manager/PolicyFormPage'
import PolicyDetailPage from './pages/PolicyDetailPage'
import { CUSTOMER_ROLE } from './lib/constants'

// Customer pages (store/)
import { StorePage } from './pages/store/StorePage'
import { ProductDetailPage } from './pages/store/ProductDetailPage'
import CartPage from './pages/store/CartPage'
import CheckoutPage from './pages/store/CheckoutPage'
import OrderSuccessPage from './pages/store/OrderSuccessPage'
import OrderFailedPage from './pages/store/OrderFailedPage'
import AccountPage from './pages/AccountPage'
import OrderHistoryPage from './pages/store/OrderHistoryPage'
import OrderDetailPage from './pages/store/OrderDetailPage'
import VirtualTryOnPage from './pages/store/VirtualTryOnPage'

// Customer account pages
import ProfilePage from './pages/account/ProfilePage'
import AddressesPage from './pages/account/AddressesPage'
import SecurityPage from './pages/account/SecurityPage'

// Staff pages
import StaffOrdersPage from './pages/StaffOrdersPage'
import { ReturnsManagementPage } from './pages/staff/ReturnsManagementPage'
import StaffPrescriptionsPage from './pages/staff/StaffPrescriptionsPage'
import LabJobsPage from './pages/staff/LabJobsPage'

// Operations pages
import OperationsDashboard from './pages/OperationsDashboard'
import ShippingPage from './pages/ShippingPage'

// Manager pages
import PromotionsPage from './pages/manager/PromotionsPage'
import { ProductCatalogPage } from './pages/manager/ProductCatalogPage'
import { ProductDetailAdminPage } from './pages/manager/ProductDetailAdminPage'
import { InventoryManagementPage } from './pages/manager/InventoryManagementPage'
import { InventoryDetailPage } from './pages/manager/InventoryDetailPage'
import { SupplierManagementPage } from './pages/manager/SupplierManagementPage'
import { SupplierFormPage } from './pages/manager/SupplierFormPage'
import PreorderManagementPage from './pages/manager/PreorderManagementPage'
import PreorderDetailPage from './pages/manager/PreorderDetailPage'
import ComboBuilderPage from './pages/manager/ComboBuilderPage'
import PriceManagementPage from './pages/manager/PriceManagementPage'
import RevenueDashboardPage from './pages/manager/RevenueDashboardPage'

// Components
import { Navbar } from './components/Navbar'
import NotFoundPage from './pages/NotFoundPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import VNPayReturnPage from './pages/store/VNPayReturnPage'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Navbar />
        <div className="pt-16">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Customer routes - Storefront */}
          <Route path="/store" element={<StorePage />} />
          <Route path="/store/:category" element={<StorePage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/products" element={<StorePage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/vnpay-return" element={<VNPayReturnPage />} />
          <Route path="/order/success" element={<OrderSuccessPage />} />
          <Route path="/order/failed" element={<OrderFailedPage />} />
          <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/account/orders" element={<OrderHistoryPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route
            path="/account/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/addresses"
            element={
              <ProtectedRoute>
                <AddressesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/security"
            element={
              <ProtectedRoute>
                <SecurityPage />
              </ProtectedRoute>
            }
          />
          <Route path="/virtual-tryon" element={<VirtualTryOnPage />} />
          <Route path="/policies/:type" element={<PolicyDetailPage />} />

          <Route
            path="/staff/prescriptions"
            element={
              <ProtectedRoute>
                <StaffPrescriptionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/lab-jobs"
            element={
              <ProtectedRoute>
                <LabJobsPage />
              </ProtectedRoute>
            }
          />

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
            <Route path="prescriptions" element={<StaffPrescriptionsPage />} />
            <Route path="lab-jobs" element={<LabJobsPage />} />
            <Route path="returns" element={<ReturnsManagementPage />} />
            <Route path="operations" element={<OperationsDashboard />} />
            <Route path="shipping" element={<ShippingPage />} />
            <Route path="promotions" element={<PromotionsPage />} />
            <Route path="combos" element={<ComboBuilderPage />} />
            <Route path="pricing" element={<PriceManagementPage />} />
            <Route path="revenue" element={<RevenueDashboardPage />} />
            <Route path="inventory" element={<InventoryManagementPage />} />
            <Route path="suppliers/new" element={<SupplierFormPage />} />
            <Route path="suppliers/:id/edit" element={<SupplierFormPage />} />
            <Route path="suppliers" element={<SupplierManagementPage />} />
            <Route path="preorders" element={<PreorderManagementPage />} />
            <Route path="preorders/:sku" element={<PreorderDetailPage />} />
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
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
