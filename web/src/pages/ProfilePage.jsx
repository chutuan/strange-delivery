import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Truck, Wallet, PackageCheck, ClipboardList, ChevronRight } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { StarDisplay } from '../components/StarRating'

const vehicleLabel = { motorbike: 'Xe máy', car: 'Ô tô', truck: 'Xe tải' }

function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [stats, setStats] = useState(null)
  const [toggling, setToggling] = useState(false)

  const dp = user?.driver_profile

  useEffect(() => {
    if (dp) api.get('/driver/stats').then(res => setStats(res.data)).catch(() => {})
  }, [dp])

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    navigate('/login')
  }

  const toggleOnline = async () => {
    setToggling(true)
    try {
      await api.post('/driver/toggle-online')
      await refreshUser()
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-bold text-gray-900 mb-5">Hồ sơ</h2>

      {/* User info */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
            <User size={28} className="text-blue-700" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            {user?.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
          </div>
        </div>
      </div>

      {/* Driver profile */}
      {dp ? (
        <>
          {/* Online toggle */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">Trạng thái nhận đơn</p>
              <p className="text-sm text-gray-500">{dp.is_active ? 'Đang bật — bạn có thể nhận đơn' : 'Đang tắt'}</p>
            </div>
            <button
              onClick={toggleOnline}
              disabled={toggling}
              className={`relative w-12 h-7 rounded-full transition-colors disabled:opacity-50 ${dp.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${dp.is_active ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <Wallet size={18} className="text-green-600 mb-1.5" />
                <p className="text-lg font-bold text-gray-900">{formatPrice(stats.total_earnings)}</p>
                <p className="text-xs text-gray-400">Tổng thu nhập</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <PackageCheck size={18} className="text-blue-600 mb-1.5" />
                <p className="text-lg font-bold text-gray-900">{stats.completed_count}</p>
                <p className="text-xs text-gray-400">Đơn hoàn thành</p>
              </div>
            </div>
          )}

          {/* Driver info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Truck size={18} className="text-green-600" />
              <span className="font-semibold text-gray-800">Thông tin tài xế</span>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Phương tiện</span>
                <span className="font-medium">{vehicleLabel[dp.vehicle_type]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Biển số</span>
                <span className="font-medium font-mono">{dp.license_plate}</span>
              </div>
              {dp.id_card_number && (
                <div className="flex justify-between">
                  <span className="text-gray-500">CCCD</span>
                  <span className="font-medium font-mono">{dp.id_card_number}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-gray-500">Đánh giá</span>
                <div className="flex items-center gap-1">
                  <StarDisplay score={Math.round(dp.rating_avg)} size={14} />
                  <span className="text-sm font-semibold">{Number(dp.rating_avg).toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({dp.rating_count} đánh giá)</span>
                </div>
              </div>
            </div>
          </div>

          {/* History link */}
          <Link
            to="/driver/orders"
            className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 flex items-center gap-3 hover:shadow-sm transition-shadow"
          >
            <ClipboardList size={18} className="text-blue-600" />
            <span className="flex-1 text-sm font-medium text-gray-800">Đơn đã nhận</span>
            <ChevronRight size={18} className="text-gray-400" />
          </Link>
        </>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Truck size={18} className="text-blue-600" />
            <span className="font-semibold text-blue-800">Trở thành tài xế</span>
          </div>
          <p className="text-sm text-blue-700 mb-3">Đăng ký để nhận đơn và kiếm thêm thu nhập.</p>
          <button
            onClick={() => navigate('/driver/register')}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Đăng ký tài xế
          </button>
        </div>
      )}

      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-40"
      >
        {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
      </button>
    </div>
  )
}
