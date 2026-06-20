import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Spinner from './components/Spinner'
// Entry / public pages stay eager so first paint isn't gated on a chunk.
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import LandingPage from './pages/LandingPage'
import AdminLayout from './pages/admin/AdminLayout'

// Code-split the rest: the driver dashboard pulls in recharts (~heavy) and the
// whole admin zone is rarely loaded, so keeping them out of the initial bundle
// shrinks the first download for the common sender/driver flows.
const MyOrdersPage = lazy(() => import('./pages/orders/my'))
const CreateOrderPage = lazy(() => import('./pages/orders/create'))
const OrderDetailPage = lazy(() => import('./pages/orders/detail'))
const OpenOrdersPage = lazy(() => import('./pages/orders/open'))
const ProfilePage = lazy(() => import('./pages/profile'))
const AddressesPage = lazy(() => import('./pages/addresses'))
const DriverRegisterPage = lazy(() => import('./pages/driver'))
const DriverDashboardPage = lazy(() => import('./pages/driver/DashboardPage'))
const DriverBidsPage = lazy(() => import('./pages/driver/BidsPage'))
const DriverOrdersPage = lazy(() => import('./pages/DriverOrdersPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage'))
const PublicDriverProfilePage = lazy(() => import('./pages/PublicDriverProfilePage'))
const TopUpPage = lazy(() => import('./pages/TopUpPage'))
const CreditHistoryPage = lazy(() => import('./pages/CreditHistoryPage'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'))
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'))
const AdminOrderDetailPage = lazy(() => import('./pages/admin/AdminOrderDetailPage'))
const AdminBankSettingPage = lazy(() => import('./pages/admin/AdminBankSettingPage'))
const AdminCreditPage = lazy(() => import('./pages/admin/AdminCreditPage'))

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
    // Outer boundary covers the public + admin lazy pages.
    <Suspense fallback={<Spinner />}>
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
                {/* Inner boundary keeps the sidebar/shell while swapping pages. */}
                <Suspense fallback={<Spinner />}>
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
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
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
