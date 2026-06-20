import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MyOrdersPage from './pages/MyOrdersPage'
import CreateOrderPage from './pages/CreateOrderPage'
import OrderDetailPage from './pages/OrderDetailPage'
import OpenOrdersPage from './pages/OpenOrdersPage'
import ProfilePage from './pages/ProfilePage'
import DriverRegisterPage from './pages/DriverRegisterPage'
import DriverOrdersPage from './pages/DriverOrdersPage'
import NotificationsPage from './pages/NotificationsPage'
import TrackOrderPage from './pages/TrackOrderPage'
import TopUpPage from './pages/TopUpPage'
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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/track/:id" element={<TrackOrderPage />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminLayout><Navigate to="/admin/bank-settings" replace /></AdminLayout></AdminRoute>} />
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
                <Route path="/orders/:id" element={<OrderDetailPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/top-up" element={<TopUpPage />} />
                <Route path="/driver/register" element={<DriverRegisterPage />} />
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
