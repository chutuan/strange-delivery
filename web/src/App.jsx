import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import MyOrdersPage from './pages/orders/my'
import CreateOrderPage from './pages/orders/create'
import OrderDetailPage from './pages/orders/detail'
import OpenOrdersPage from './pages/orders/open'
import ProfilePage from './pages/profile'
import AddressesPage from './pages/addresses'
import DriverRegisterPage from './pages/driver'
import DriverDashboardPage from './pages/driver/DashboardPage'
import DriverBidsPage from './pages/driver/BidsPage'
import DriverOrdersPage from './pages/DriverOrdersPage'
import NotificationsPage from './pages/NotificationsPage'
import TrackOrderPage from './pages/TrackOrderPage'
import PublicDriverProfilePage from './pages/PublicDriverProfilePage'
import LandingPage from './pages/LandingPage'
import TopUpPage from './pages/TopUpPage'
import CreditHistoryPage from './pages/CreditHistoryPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminOrderDetailPage from './pages/admin/AdminOrderDetailPage'
import AdminBankSettingPage from './pages/admin/AdminBankSettingPage'
import AdminCreditPage from './pages/admin/AdminCreditPage'
import AdminLayout from './pages/admin/AdminLayout'

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!user.is_admin) return <Navigate to="/orders/mine" replace />
  return children
}

function HomeGate() {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/orders/mine" replace /> : <LandingPage />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeGate />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/track/:id" element={<TrackOrderPage />} />
      <Route path="/d/:id" element={<PublicDriverProfilePage />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminLayout><AdminDashboardPage /></AdminLayout></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminLayout><AdminUsersPage /></AdminLayout></AdminRoute>} />
      <Route path="/admin/orders" element={<AdminRoute><AdminLayout><AdminOrdersPage /></AdminLayout></AdminRoute>} />
      <Route path="/admin/orders/:code" element={<AdminRoute><AdminLayout><AdminOrderDetailPage /></AdminLayout></AdminRoute>} />
      <Route path="/admin/bank-settings" element={<AdminRoute><AdminLayout><AdminBankSettingPage /></AdminLayout></AdminRoute>} />
      <Route path="/admin/credits" element={<AdminRoute><AdminLayout><AdminCreditPage /></AdminLayout></AdminRoute>} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/orders/mine" element={<MyOrdersPage />} />
                <Route path="/orders/create" element={<CreateOrderPage />} />
                <Route path="/orders/open" element={<OpenOrdersPage />} />
                <Route path="/orders/:code" element={<OrderDetailPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/addresses" element={<AddressesPage />} />
                <Route path="/top-up" element={<TopUpPage />} />
                <Route path="/top-up/history" element={<CreditHistoryPage />} />
                <Route path="/driver/register" element={<DriverRegisterPage />} />
                <Route path="/driver/dashboard" element={<DriverDashboardPage />} />
                <Route path="/driver/bids" element={<DriverBidsPage />} />
                <Route path="/driver/orders" element={<DriverOrdersPage />} />
                <Route path="*" element={<Navigate to="/orders/mine" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
