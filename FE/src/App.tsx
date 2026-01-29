import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminDashboardLayout } from './pages/admin/AdminDashboardLayout';
import { DashboardOverview } from './pages/admin/DashboardOverview';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { PolicyManagementPage } from './pages/admin/PolicyManagementPage';
import { ProductManagementPage } from './pages/admin/ProductManagementPage';

// Customer pages
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AccountPage from './pages/AccountPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderDetailPage from './pages/OrderDetailPage';
import PrescriptionUploadPage from './pages/PrescriptionUploadPage';
import VirtualTryOnPage from './pages/VirtualTryOnPage';

// Staff pages
import StaffOrdersPage from './pages/StaffOrdersPage';

// Operations pages
import OperationsDashboard from './pages/OperationsDashboard';
import ShippingPage from './pages/ShippingPage';

// Manager pages
import PromotionsPage from './pages/PromotionsPage';
import AnalyticsPage from './pages/AnalyticsPage';

// System Admin pages
import SystemConfigPage from './pages/SystemConfigPage';

// Components
import { Navbar } from './components/Navbar';

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

          {/* Admin/Staff/Operations routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardOverview />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="policies" element={<PolicyManagementPage />} />
            <Route path="products" element={<ProductManagementPage />} />
          </Route>

          {/* Staff routes */}
          <Route path="/admin/orders" element={<StaffOrdersPage />} />

          {/* Operations routes */}
          <Route path="/admin/operations" element={<OperationsDashboard />} />
          <Route path="/admin/shipping" element={<ShippingPage />} />

          {/* Manager routes */}
          <Route path="/admin/promotions" element={<PromotionsPage />} />
          <Route path="/admin/analytics" element={<AnalyticsPage />} />

          {/* System Admin routes */}
          <Route path="/admin/system-config" element={<SystemConfigPage />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
