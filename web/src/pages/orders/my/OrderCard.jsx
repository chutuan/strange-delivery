import { Link } from 'react-router-dom'
import { ChevronRight, Truck } from 'lucide-react'
import { formatPrice, formatDate } from '../../../lib/format'

const STATUS = {
  open:        { label: 'Đang mở',   card: 'border-l-blue-400',  badge: 'bg-blue-50 text-blue-700',   dot: 'bg-blue-400' },
  in_progress: { label: 'Đang giao', card: 'border-l-amber-400', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400' },
  delivered:   { label: 'Đã giao',   card: 'border-l-green-400', badge: 'bg-green-50 text-green-700', dot: 'bg-green-400' },
  cancelled:   { label: 'Đã hủy',    card: 'border-l-gray-300',  badge: 'bg-gray-100 text-gray-500',  dot: 'bg-gray-300' },
}

function StatusBadge({ status }) {
  const s = STATUS[status] ?? { label: status, badge: 'bg-gray-100 text-gray-500', dot: 'bg-gray-300' }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

export default function OrderCard({ order }) {
  const s = STATUS[order.status] ?? STATUS.open

  return (
    <Link
      to={`/orders/${order.id}`}
      className={`bg-white border border-gray-200 border-l-4 ${s.card} rounded-xl p-4 hover:shadow-md transition-all flex gap-3 group`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <span className="font-semibold text-gray-900 leading-snug">{order.title}</span>
          <StatusBadge status={order.status} />
        </div>

        <div className="flex gap-2.5 mb-2.5">
          <div className="flex flex-col items-center pt-1 shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <div className="w-px h-4 bg-gray-200 my-0.5" />
            <div className="w-2 h-2 rounded-full bg-red-500" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <p className="text-sm text-gray-600 truncate">{order.pickup_address}</p>
            <p className="text-sm text-gray-600 truncate">{order.delivery_address}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-bold text-blue-700">{formatPrice(order.budget_price)}</span>
          {order.bids?.length > 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {order.bids.length} báo giá
            </span>
          )}
          {order.driver && (
            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Truck size={11} /> {order.driver.name}
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto">{formatDate(order.created_at)}</span>
        </div>
      </div>

      <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 mt-1" />
    </Link>
  )
}
