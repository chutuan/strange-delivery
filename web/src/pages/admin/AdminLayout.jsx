import { Link, useLocation } from 'react-router-dom'
import { Building2, Coins, LayoutDashboard, Users, Package, Truck, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const navItems = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Người dùng', icon: Users },
  { to: '/admin/orders', label: 'Đơn hàng', icon: Package },
  { to: '/admin/credits', label: 'Quản lý credit', icon: Coins },
  { to: '/admin/bank-settings', label: 'Tài khoản ngân hàng', icon: Building2 },
]

export default function AdminLayout({ children }) {
  const location = useLocation()
  const { user } = useAuth()
  const isActive = (to) =>
    to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(to)

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white">
            <Truck size={18} />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-gray-900 text-sm">Strange Delivery</p>
            <p className="text-[11px] text-gray-400 -mt-0.5">Bảng quản trị</p>
          </div>
          <Link
            to="/orders/mine"
            className="ml-auto flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft size={15} /> Về trang chính
          </Link>
        </div>
      </header>

      <div className="flex max-w-6xl mx-auto w-full px-4 py-6 gap-6">
        <aside className="w-48 shrink-0 hidden sm:block">
          <nav className="flex flex-col gap-1 sticky top-20">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = isActive(to)
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-orange-50 text-orange-600 font-semibold'
                      : 'text-gray-500 font-medium hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={17} strokeWidth={active ? 2.4 : 1.8} />
                  {label}
                </Link>
              )
            })}
          </nav>
          {user && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2.5 px-2">
              <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{user.name}</p>
                <p className="text-[11px] text-gray-400 truncate">Quản trị viên</p>
              </div>
            </div>
          )}
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
