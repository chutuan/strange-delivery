import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Package, MapPin, ChevronRight } from 'lucide-react'
import api from '../lib/api'
import StatusBadge from '../components/StatusBadge'

function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    setLoading(true)
    api.get('/orders/mine', { params: { page } })
      .then(res => {
        setOrders(res.data.data)
        setMeta(res.data)
      })
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900">Đơn của tôi</h2>
        <Link
          to="/orders/create"
          className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Tạo đơn
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Package size={48} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Bạn chưa có đơn nào</p>
          <p className="text-sm mt-1">Tạo đơn đầu tiên để bắt đầu</p>
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
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                  <span className="font-semibold text-blue-700 text-sm">{formatPrice(order.budget_price)}</span>
                  {order.bids?.length > 0 && (
                    <span>{order.bids.length} bid</span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400 shrink-0 mt-1" />
            </Link>
          ))}
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40"
          >
            Trước
          </button>
          <span className="px-4 py-1.5 text-sm text-gray-600">{page} / {meta.last_page}</span>
          <button
            onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
            disabled={page === meta.last_page}
            className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  )
}
