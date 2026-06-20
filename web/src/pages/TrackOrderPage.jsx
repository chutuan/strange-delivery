import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Truck, Star, CheckCircle, Clock, Share2 } from 'lucide-react'
import axios from 'axios'

const STATUS_LABEL = {
  draft: { text: 'Chưa tìm tài xế', color: 'text-gray-600 bg-gray-50 border-gray-200', icon: '📋' },
  open: { text: 'Đang chờ tài xế', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: '🔍' },
  in_progress: { text: 'Đang giao hàng', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: '🚚' },
  delivered: { text: 'Đã giao thành công', color: 'text-green-700 bg-green-50 border-green-200', icon: '✅' },
  cancelled: { text: 'Đã hủy', color: 'text-red-700 bg-red-50 border-red-200', icon: '❌' },
}

const VEHICLE_LABEL = { motorbike: 'Xe máy', car: 'Ô tô', truck: 'Xe tải' }

function formatDate(s) {
  if (!s) return null
  return new Date(s).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

export default function TrackOrderPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const fetchOrder = () => {
    api.get(`/track/${id}`)
      .then(res => { setOrder(res.data); setError('') })
      .catch(err => setError(err.response?.status === 404 ? 'Không tìm thấy đơn hàng.' : 'Lỗi kết nối.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchOrder()
    const interval = setInterval(fetchOrder, 30000)
    return () => clearInterval(interval)
  }, [id])

  const share = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const status = order ? (STATUS_LABEL[order.status] ?? { text: order.status, color: '', icon: '📦' }) : null

  const timeline = order ? [
    { label: 'Đã đăng đơn', time: order.created_at, done: true },
    { label: 'Đã chọn tài xế', time: order.accepted_at, done: !!order.accepted_at },
    { label: 'Đã giao hàng', time: order.delivered_at, done: !!order.delivered_at },
  ] : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-700 text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Truck size={22} /> Strange Delivery
        </div>
        <Link to="/login" className="text-sm text-blue-200 hover:text-white transition-colors">
          Đăng nhập
        </Link>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <p className="text-sm text-gray-500 mb-4">Theo dõi đơn hàng #{id}</p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <p className="text-4xl mb-3">❌</p>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        ) : (
          <>
            {/* Status */}
            <div className={`border rounded-2xl p-5 mb-4 text-center ${status.color}`}>
              <p className="text-4xl mb-2">{status.icon}</p>
              <p className="text-xl font-bold">{status.text}</p>
              <p className="text-sm opacity-70 mt-1 font-medium">{order.title}</p>
            </div>

            {/* Addresses */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <MapPin size={16} className="text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Lấy hàng tại</p>
                  <p className="text-sm font-medium text-gray-800">{order.pickup_address}</p>
                </div>
              </div>
              <div className="border-t border-gray-100" />
              <div className="flex items-start gap-2.5">
                <MapPin size={16} className="text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Giao đến</p>
                  <p className="text-sm font-medium text-gray-800">{order.delivery_address}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Tiến trình</h3>
              <div className="flex flex-col gap-0">
                {timeline.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 ${step.done ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`} />
                      {i < timeline.length - 1 && (
                        <div className={`w-0.5 h-8 ${step.done && timeline[i + 1].done ? 'bg-green-300' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className={`text-sm font-medium ${step.done ? 'text-gray-800' : 'text-gray-400'}`}>{step.label}</p>
                      {step.time && <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Clock size={11} />{formatDate(step.time)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Required before */}
            {order.required_before && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-center gap-2">
                <Clock size={15} className="text-red-500 shrink-0" />
                <p className="text-sm text-red-700">Cần giao trước: <strong>{formatDate(order.required_before)}</strong></p>
              </div>
            )}

            {/* Delivery note */}
            {order.delivery_note && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
                <p className="text-sm text-green-800">🚚 <strong>Ghi chú giao hàng:</strong> {order.delivery_note}</p>
              </div>
            )}

            {/* Driver card */}
            {order.driver && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Tài xế</h3>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
                    {order.driver.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{order.driver.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-500 flex-wrap">
                      {order.driver.vehicle_type && (
                        <span className="flex items-center gap-1">
                          <Truck size={12} /> {VEHICLE_LABEL[order.driver.vehicle_type] ?? order.driver.vehicle_type}
                        </span>
                      )}
                      {order.driver.license_plate && (
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {order.driver.license_plate}
                        </span>
                      )}
                    </div>
                    {order.driver.rating_count > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={12} className="text-yellow-500 fill-yellow-400" />
                        <span className="text-sm font-medium">{Number(order.driver.rating_avg).toFixed(1)}</span>
                        <span className="text-xs text-gray-400">({order.driver.rating_count} đánh giá)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={share}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-xl py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {copied ? <><CheckCircle size={16} className="text-green-600" /> Đã sao chép!</> : <><Share2 size={16} /> Chia sẻ link</>}
              </button>
              <Link
                to="/login"
                className="flex-1 flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 rounded-xl py-2.5 text-sm text-white font-medium transition-colors"
              >
                Đăng nhập
              </Link>
            </div>

            <p className="text-center text-xs text-gray-400 mt-4">Tự động cập nhật mỗi 30 giây</p>
          </>
        )}
      </div>
    </div>
  )
}
