import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import MainLayout from '../layouts/MainLayout'
import ProtectedRoute from '../layouts/ProtectedRoute'
import AdminRoute from '../layouts/AdminRoute'
import HomePage from '../pages/HomePage'
import AccountPage from '../pages/AccountPage'
import PrintingServicePage from '../pages/PrintingServicePage'
import MarketplacePage from '../features/products/MarketplacePage'
import ProductDetailPage from '../features/products/ProductDetailPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import NotFoundPage from '../pages/NotFoundPage'
import { CartPage } from '../components/cart/CartPage'
import { CheckoutPage } from '../components/checkout/CheckoutPage'
import { CheckoutSuccessPage } from '../components/checkout/CheckoutSuccessPage'
import { CheckoutCancelPage } from '../components/checkout/CheckoutCancelPage'
import { OrderDetailPage } from '../components/orders/OrderDetailPage'
import { OrderHistoryPage } from '../components/orders/OrderHistoryPage'
import AdminLayout from '../features/admin/AdminLayout'
import AdminDashboardPage from '../features/admin/AdminDashboardPage'
import AdminProductsPage from '../features/admin/AdminProductsPage'
import AdminOrdersPage from '../features/admin/AdminOrdersPage'
import AdminUsersPage from '../features/admin/AdminUsersPage'
import AdminStlRequestsPage from '../features/admin/AdminStlRequestsPage'
import AdminSellerApplicationsPage from '../features/admin/AdminSellerApplicationsPage'
import AdminWithdrawalsPage from '../features/admin/AdminWithdrawalsPage'
import OpenShopPage from '../features/seller/OpenShopPage'
import ShopCustomizePage from '../features/seller/ShopCustomizePage'
import ShopPage from '../features/shop/ShopPage'

function ShopPageKeyed() {
  const { slug } = useParams<{ slug: string }>()
  return <ShopPage key={slug} />
}
import StlViewerDemo from '../features/stl-viewer/StlViewerDemo'
import { StlViewerProvider } from '../features/stl-viewer'
import CreatorDashboardPage from '../features/creator/CreatorDashboardPage'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route index element={<Navigate to="login" replace />} />
      </Route>

      {/* Main */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="products/:productId" element={<ProductDetailPage />} />
        <Route path="shops/:slug" element={<ShopPageKeyed />} />
        <Route path="printing-service" element={<ProtectedRoute><PrintingServicePage /></ProtectedRoute>} />
        <Route path="cart" element={<CartPage />} />
        <Route path="stl" element={<StlViewerProvider><StlViewerDemo /></StlViewerProvider>} />

        {/* Checkout */}
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="checkout/cancel" element={<CheckoutCancelPage />} />

        {/* Orders — protected */}
        <Route path="orders" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
        <Route path="orders/history" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
        <Route path="orders/:orderId" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />

        {/* Protected */}
        <Route
          path="account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="creator"
          element={
            <ProtectedRoute>
              <CreatorDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/apply"
          element={
            <ProtectedRoute>
              <OpenShopPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/shop/customize"
          element={
            <ProtectedRoute>
              <ShopCustomizePage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Admin — standalone shell (no public navbar/footer) */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="seller-applications" element={<AdminSellerApplicationsPage />} />
        <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
        <Route path="stl-requests" element={<AdminStlRequestsPage />} />
      </Route>
    </Routes>
  )
}
