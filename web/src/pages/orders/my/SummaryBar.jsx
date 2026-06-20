import { Clock, Truck, CheckCircle2, XCircle } from 'lucide-react'

const ITEMS = [
  { key: 'open',        label: 'Đang mở',   numColor: 'text-blue-600',  activeRing: 'ring-2 ring-blue-400 bg-blue-50' },
  { key: 'in_progress', label: 'Đang giao', numColor: 'text-amber-600', activeRing: 'ring-2 ring-amber-400 bg-amber-50' },
  { key: 'delivered',   label: 'Đã giao',   numColor: 'text-green-600', activeRing: 'ring-2 ring-green-400 bg-green-50' },
  { key: 'cancelled',   label: 'Đã hủy',    numColor: 'text-gray-400',  activeRing: 'ring-2 ring-gray-400 bg-gray-50' },
]

export default function SummaryBar({ counts, activeFilter, onFilter }) {
  return (
    <div className="grid grid-cols-4 gap-2 mb-5">
      {ITEMS.map(({ key, label, numColor, activeRing }) => {
        const isActive = activeFilter === key
        return (
          <button
            key={key}
            onClick={() => onFilter(isActive ? null : key)}
            className={`bg-white border border-gray-200 rounded-xl p-3 text-center transition-all hover:shadow-sm ${isActive ? activeRing : 'hover:border-gray-300'}`}
          >
            <p className={`text-xl font-bold ${numColor}`}>{counts[key] ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </button>
        )
      })}
    </div>
  )
}
