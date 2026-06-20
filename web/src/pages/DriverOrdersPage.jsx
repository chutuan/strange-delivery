import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, ChevronRight, Truck } from 'lucide-react'
import api from '../lib/api'
import StatusBadge from '../components/StatusBadge'

function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

const FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'in_progress', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
]

export default function DriverOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  useEffect(() => {
    setLoading(true)
    api.get('/driver/orders', { params: status ? { status } : {} })
      .then(res => setOrders(res.data.data))
      .finally(() => setLoading(false))
  }, [status])

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-5">Đơn đã nhận</h2>

      <div className="flex gap-2 mb-5">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              status === f.value ? 'bg-blue-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Truck size={48} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Chưa có đơn nào</p>
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
                <div className="flex items-start gap-1 text-sm text-gray-500">
                  <MapPin size={13} className="mt-0.5 shrink-0 text-red-500" />
                  <span className="truncate">{order.delivery_address}</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <span className="font-bold text-green-700 text-sm">
                    {formatPrice(order.final_price ?? order.budget_price)}
                  </span>
                  <span className="text-xs text-gray-400">khách: {order.sender?.name}</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400 shrink-0 mt-1" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
