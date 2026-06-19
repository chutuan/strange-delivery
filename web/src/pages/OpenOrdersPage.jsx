import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, ChevronRight, Truck } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import StatusBadge from '../components/StatusBadge'

function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

export default function OpenOrdersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api.get('/orders/open', { params: { page } })
      .then(res => {
        setOrders(res.data.data)
        setMeta(res.data)
        setError('')
      })
      .catch(err => setError(err.response?.data?.message || 'Lỗi tải đơn.'))
      .finally(() => setLoading(false))
  }, [page])

  if (!user?.driver_profile) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <Truck size={52} className="mx-auto mb-4 text-blue-300" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Bạn chưa đăng ký tài xế</h2>
        <p className="text-gray-500 text-sm mb-6">Đăng ký để bắt đầu nhận đơn và kiếm thêm thu nhập.</p>
        <button
          onClick={() => navigate('/driver/register')}
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
        >
          Đăng ký tài xế
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-5">Đơn đang mở</h2>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Truck size={48} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Không có đơn nào đang mở</p>
          <p className="text-sm mt-1">Thử lại sau ít phút</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map(order => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 truncate">{order.title}</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex items-start gap-1 text-sm text-gray-500 mb-0.5">
                  <MapPin size={13} className="mt-0.5 shrink-0 text-green-600" />
                  <span className="truncate">{order.pickup_address}</span>
                </div>
                <div className="flex items-start gap-1 text-sm text-gray-500">
                  <MapPin size={13} className="mt-0.5 shrink-0 text-red-500" />
                  <span className="truncate">{order.delivery_address}</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <span className="font-bold text-blue-700 text-sm">{formatPrice(order.budget_price)}</span>
                  <span className="text-xs text-gray-400">bởi {order.sender?.name}</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400 shrink-0 mt-1" />
            </Link>
          ))}
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40">Trước</button>
          <span className="px-4 py-1.5 text-sm text-gray-600">{page} / {meta.last_page}</span>
          <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page} className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40">Sau</button>
        </div>
      )}
    </div>
  )
}
