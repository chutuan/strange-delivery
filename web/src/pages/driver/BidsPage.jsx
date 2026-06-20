import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ClipboardList, CheckCircle2, XCircle, Clock } from 'lucide-react'
import api from '../../lib/api'
import { formatPrice, formatDateTime } from '../../lib/format'
import Spinner from '../../components/Spinner'
import Pagination from '../../components/Pagination'

const FILTERS = [
  { key: '', label: 'Tất cả' },
  { key: 'pending', label: 'Đang chờ' },
  { key: 'accepted', label: 'Được chọn' },
  { key: 'rejected', label: 'Bị từ chối' },
]

const BID_STATUS = {
  pending:  { label: 'Đang chờ',    icon: Clock,         className: 'bg-amber-50 text-amber-600 border-amber-200' },
  accepted: { label: 'Được chọn',   icon: CheckCircle2,  className: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: 'Bị từ chối',  icon: XCircle,       className: 'bg-red-50 text-red-600 border-red-200' },
}

const ORDER_STATUS_LABEL = {
  open:        'Đang mở',
  in_progress: 'Đang giao',
  delivered:   'Đã giao',
  cancelled:   'Đã huỷ',
}

function BidCard({ bid }) {
  const order = bid.order
  const { label, icon: Icon, className } = BID_STATUS[bid.status] ?? BID_STATUS.pending

  return (
    <Link
      to={`/orders/${order?.id}`}
      className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-3 hover:shadow-sm transition-shadow group"
    >
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${className}`}>
        <Icon size={17} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-gray-800 truncate">{order?.title}</p>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${className}`}>
            {label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
          <span className="truncate">{order?.pickup_address}</span>
          <span>→</span>
          <span className="truncate">{order?.delivery_address}</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-blue-600">{formatPrice(bid.price)}</span>
          {order?.final_price && bid.status === 'accepted' && (
            <span className="text-xs text-gray-400">
              Chốt: <span className="font-semibold text-gray-700">{formatPrice(order.final_price)}</span>
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto">{formatDateTime(bid.created_at)}</span>
        </div>

        {bid.note && (
          <p className="text-xs text-gray-400 mt-1.5 italic truncate">&ldquo;{bid.note}&rdquo;</p>
        )}

        <div className="mt-2">
          <span className="text-[11px] text-gray-400">
            Đơn: <span className="font-medium text-gray-600">{ORDER_STATUS_LABEL[order?.status] ?? order?.status}</span>
          </span>
        </div>
      </div>

      <ChevronRight size={15} className="text-gray-300 group-hover:text-gray-500 shrink-0 self-center" />
    </Link>
  )
}

export default function DriverBidsPage() {
  const [bids, setBids] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 })
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page })
    if (filter) params.set('status', filter)

    api.get(`/driver/bids?${params}`)
      .then(res => {
        setBids(res.data.data)
        setMeta({ current_page: res.data.current_page, last_page: res.data.last_page })
      })
      .finally(() => setLoading(false))
  }, [filter, page])

  const handleFilter = (key) => {
    if (key === filter) return
    setFilter(key)
    setPage(1)
  }

  return (
    <div className="max-w-xl">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">Lịch sử bid</h2>
        <p className="text-sm text-gray-400 mt-0.5">Các đơn hàng bạn đã đặt giá</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              filter === key
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner className="py-12" />
      ) : bids.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Chưa có bid nào</p>
          <Link to="/orders/open" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
            Tìm đơn để bid →
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2.5 mb-4">
            {bids.map(bid => <BidCard key={bid.id} bid={bid} />)}
          </div>
          <Pagination page={meta.current_page} lastPage={meta.last_page} onPage={setPage} />
        </>
      )}
    </div>
  )
}
