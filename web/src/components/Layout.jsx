import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Package, Search, User, LogOut, Truck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/orders/mine', label: 'Đơn của tôi', icon: Package },
    { to: '/orders/open', label: 'Tìm đơn', icon: Search },
    { to: '/profile', label: 'Hồ sơ', icon: User },
  ]

  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-700 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/orders/mine" className="flex items-center gap-2 font-bold text-lg">
            <Truck size={22} />
            Strange Delivery
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-200 hidden sm:block">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-blue-200 hover:text-white transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex sm:hidden z-10">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex-1 flex flex-col items-center py-2 text-xs gap-1 transition-colors ${
              isActive(to) ? 'text-blue-700' : 'text-gray-500 hover:text-blue-600'
            }`}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Desktop side tabs */}
      <div className="hidden sm:block fixed left-0 top-14 bottom-0 w-48 bg-white border-r border-gray-200 p-3">
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(to)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Desktop content offset */}
      <style>{`
        @media (min-width: 640px) {
          main { margin-left: 192px; }
        }
        @media (max-width: 639px) {
          main { padding-bottom: 72px; }
        }
      `}</style>
    </div>
  )
}
