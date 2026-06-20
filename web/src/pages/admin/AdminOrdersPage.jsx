import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, Zap, ListFilter } from 'lucide-react'
import api from '../../lib/api'
import { formatPrice, formatDate } from '../../lib/format'
import StatusBadge from '../../components/StatusBadge'

const STATUS_TABS = [
  { value: '',            label: 'Tất cả' },
  { value: 'open',        label: 'Đang mở' },
  { value: 'in_progress', label: 'Đang giao' },
  { value: 'delivered',   label: 'Đã giao' },
  { value: 'cancelled',   label: 'Đã hủy' },
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [meta, setMeta] = useState(null)
  const [q, setQ] = useState('')
  const [applied, setApplied] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get('/admin/orders', { params: { q: applied, status, page } })
      .then(res => { setOrders(res.data.data ?? []); setMeta(res.data) })
      .finally(() => setLoading(false))
  }, [applied, status, page])

  const submitSearch = (e) => { e.preventDefault(); setPage(1); setApplied(q) }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 tracking-tight">Đơn hàng</h2>
      <p className="text-sm text-gray-400 mb-5">{meta ? `${meta.total} đơn` : ' '}</p>

      <form onSubmit={submitSearch} className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Tìm theo mã đơn, tiêu đề, địa chỉ..."
          className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15"
        />
      </form>

      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => { setStatus(t.value); setPage(1) }}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              status === t.value ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">Không có đơn nào</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.map(o => (
              <Link to={`/admin/orders/${o.order_code}`} key={o.id} className="block px-4 py-3 hover:bg-gray-50/60 transition-colors">
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-xs font-mono text-gray-400">#{o.order_code}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500">
                    {o.order_type === 'instant'
                      ? <><Zap size={11} className="text-amber-500" /> Giao luôn</>
                      : <><ListFilter size={11} className="text-orange-500" /> Đấu giá</>}
                  </span>
                  <span className="ml-auto text-sm font-semibold text-orange-600">{formatPrice(o.final_price ?? o.budget_price)}</span>
                  <StatusBadge status={o.status} />
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{o.title}</p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  <span className="truncate">{o.pickup_address}</span>
                  <span className="text-gray-300">→</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <span className="truncate">{o.delivery_address}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1.5">
                  <span>Người gửi: <span className="text-gray-600">{o.sender?.name ?? '—'}</span></span>
                  <span>Tài xế: <span className="text-gray-600">{o.driver?.name ?? 'chưa có'}</span></span>
                  <span className="ml-auto">{formatDate(o.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-500">Trang {meta.current_page} / {meta.last_page}</span>
          <button
            onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
            disabled={page >= meta.last_page}
            className="p-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
