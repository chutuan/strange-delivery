import { Link, useLocation } from 'react-router-dom'
import { Building2, Coins, LayoutDashboard } from 'lucide-react'

const navItems = [
  { to: '/admin/bank-settings', label: 'Tài khoản ngân hàng', icon: Building2 },
  { to: '/admin/credits', label: 'Quản lý credit', icon: Coins },
]

export default function AdminLayout({ children }) {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <LayoutDashboard size={20} />
          <span className="font-bold text-lg">Admin Panel</span>
          <Link to="/orders/mine" className="ml-auto text-sm text-gray-400 hover:text-white transition-colors">
            ← Về trang chính
          </Link>
        </div>
      </header>

      <div className="flex flex-1 max-w-6xl mx-auto w-full px-4 py-6 gap-6">
        <aside className="w-44 shrink-0">
          <nav className="flex flex-col gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === to
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
