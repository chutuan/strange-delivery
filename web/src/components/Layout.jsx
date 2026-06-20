import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Package, Search, User, LogOut, Truck, LayoutDashboard, ClipboardList, Bell } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

const NAV = {
  sender: [
    { to: '/orders/mine',   label: 'Đơn của tôi',  icon: Package },
    { to: '/notifications', label: 'Thông báo',     icon: Bell },
    { to: '/profile',       label: 'Hồ sơ',         icon: User },
  ],
  driver: [
    { to: '/driver/dashboard', label: 'Tổng quan',   icon: LayoutDashboard },
    { to: '/orders/open',      label: 'Tìm đơn',     icon: Search },
    { to: '/driver/bids',      label: 'Lịch sử bid', icon: ClipboardList },
    { to: '/profile',          label: 'Hồ sơ',       icon: User },
  ],
}

function Avatar({ name }) {
  const initial = name?.charAt(0)?.toUpperCase() ?? '?'
  return (
    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold shrink-0">
      {initial}
    </div>
  )
}

function RoleSwitcher({ role, setRole, hasDriverProfile, navigate }) {
  if (!hasDriverProfile) return null

  const handleSwitch = (next) => {
    if (next === role) return
    setRole(next)
    navigate(next === 'driver' ? '/orders/open' : '/orders/mine')
  }

  return (
    <div className="flex items-center bg-white/10 rounded-xl p-1 gap-0.5">
      <button
        onClick={() => handleSwitch('sender')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          role === 'sender'
            ? 'bg-white text-blue-700 shadow-sm'
            : 'text-white/70 hover:text-white hover:bg-white/10'
        }`}
      >
        <Package size={13} />
        Người gửi
      </button>
      <button
        onClick={() => handleSwitch('driver')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          role === 'driver'
            ? 'bg-white text-blue-700 shadow-sm'
            : 'text-white/70 hover:text-white hover:bg-white/10'
        }`}
      >
        <Truck size={13} />
        Tài xế
      </button>
    </div>
  )
}

export default function Layout({ children }) {
  const { user, role, setRole, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let active = true
    const load = () => api.get('/notifications/unread-count')
      .then(res => { if (active) setUnread(res.data.count) })
      .catch(() => {})
    load()
    const id = setInterval(load, 30000)
    return () => { active = false; clearInterval(id) }
  }, [location.pathname])

  const navItems = NAV[role] ?? NAV.sender
  const isActive = (path) => location.pathname.startsWith(path)
  const homeLink = role === 'driver' ? '/orders/open' : '/orders/mine'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-15 flex items-center justify-between gap-4" style={{ height: '56px' }}>

          {/* Logo */}
          <Link to={homeLink} className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center">
              <Truck size={18} className="text-white" />
            </div>
            <span className="font-bold text-base tracking-tight hidden sm:block">Strange Delivery</span>
          </Link>

          {/* Role switcher — center */}
          <div className="flex-1 flex justify-center">
            <RoleSwitcher
              role={role}
              setRole={setRole}
              hasDriverProfile={!!user?.driver_profile}
              navigate={navigate}
            />
          </div>

          {/* Bell + User + logout */}
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/notifications" className="relative text-blue-100 hover:text-white transition-colors p-1">
              <Bell size={20} />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
            <Avatar name={user?.name} />
            <span className="text-sm font-medium text-white/90 hidden md:block max-w-[120px] truncate">
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex sm:hidden z-10 safe-bottom">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex-1 flex flex-col items-center py-2.5 text-xs gap-1 transition-colors ${
              isActive(to) ? 'text-blue-700' : 'text-gray-400 hover:text-blue-600'
            }`}
          >
            <span className="relative">
              <Icon size={21} strokeWidth={isActive(to) ? 2.5 : 1.75} />
              {to === '/notifications' && unread > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold min-w-[15px] h-[15px] px-1 rounded-full flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </span>
            <span className={isActive(to) ? 'font-semibold' : ''}>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Desktop sidebar */}
      <div className="hidden sm:flex fixed left-0 top-14 bottom-0 w-48 bg-white border-r border-gray-200 flex-col">
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive(to)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} strokeWidth={isActive(to) ? 2.5 : 1.75} />
              <span className="flex-1">{label}</span>
              {to === '/notifications' && unread > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 640px) { main { margin-left: 192px; } }
        @media (max-width: 639px) { main { padding-bottom: 72px; } }
      `}</style>
    </div>
  )
}
