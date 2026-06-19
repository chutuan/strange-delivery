import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Truck, Star } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { StarDisplay } from '../components/StarRating'

const vehicleLabel = { motorbike: 'Xe máy', car: 'Ô tô', truck: 'Xe tải' }

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    navigate('/login')
  }

  const dp = user?.driver_profile

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
