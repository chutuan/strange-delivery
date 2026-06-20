import { User, CheckCircle } from 'lucide-react'
import StatusBadge from '../../../components/StatusBadge'
import { formatPrice } from '../../../lib/format'

export default function BidList({ bids, isSender, orderStatus, onAccept, actionLoading }) {
  if (!bids?.length) return null

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <h3 className="font-semibold text-gray-800 mb-3">
        {bids.length} Báo giá
      </h3>
      <div className="flex flex-col gap-3">
        {bids.map(bid => (
          <div
            key={bid.id}
            className={`flex items-start gap-3 p-3 rounded-xl border ${
              bid.status === 'accepted' ? 'border-green-300 bg-green-50' : 'border-gray-100 bg-gray-50'
            }`}
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <User size={15} className="text-blue-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">{bid.driver?.name}</span>
                <StatusBadge status={bid.status} />
              </div>
              <p className="text-blue-700 font-bold text-sm mt-0.5">{formatPrice(bid.price)}</p>
              {bid.note && <p className="text-xs text-gray-500 mt-0.5">{bid.note}</p>}
            </div>
            {isSender && orderStatus === 'open' && bid.status === 'pending' && (
              <button
                onClick={() => onAccept(bid.id)}
                disabled={actionLoading}
                className="shrink-0 flex items-center gap-1 text-xs bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
              >
                <CheckCircle size={13} /> Chọn
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
