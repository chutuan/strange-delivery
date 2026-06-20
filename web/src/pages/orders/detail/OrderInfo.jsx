import { MapPin, Bike, Car, Truck, Zap, ListFilter } from 'lucide-react'
import StatusBadge from '../../../components/StatusBadge'
import { formatPrice, formatDateTime } from '../../../lib/format'

const VEHICLE_ICON = { motorbike: Bike, car: Car, truck: Truck }
const VEHICLE_LABEL = { motorbike: 'Xe máy', car: 'Ô tô', truck: 'Xe tải' }

export default function OrderInfo({ order }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold text-gray-900">{order.title}</h2>
        <div className="flex items-center gap-1.5 shrink-0">
          {order.order_type === 'instant'
            ? <span className="flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full"><Zap size={11} />Giao luôn</span>
            : <span className="flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"><ListFilter size={11} />Chọn tài xế</span>
          }
          <StatusBadge status={order.status} />
        </div>
      </div>

      {order.description && (
        <p className="text-sm text-gray-600 mb-4">{order.description}</p>
      )}

      <div className="flex flex-col gap-2 text-sm mb-4">
        <div className="flex items-start gap-2">
          <MapPin size={15} className="text-green-600 mt-0.5 shrink-0" />
          <div>
            <span className="text-gray-400 text-xs">Lấy hàng</span>
            <p className="text-gray-800">{order.pickup_address}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={15} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <span className="text-gray-400 text-xs">Giao đến</span>
            <p className="text-gray-800">{order.delivery_address}</p>
          </div>
        </div>
      </div>

      {order.note && (
        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-4">
          📝 {order.note}
        </p>
      )}

      <div className="flex items-center gap-4 pt-3 border-t border-gray-100 flex-wrap">
        <div>
          <span className="text-xs text-gray-400">Giá đăng</span>
          <p className="font-bold text-blue-700">{formatPrice(order.budget_price)}</p>
        </div>
        {order.final_price && (
          <div>
            <span className="text-xs text-gray-400">Giá chốt</span>
            <p className="font-bold text-green-700">{formatPrice(order.final_price)}</p>
          </div>
        )}
        {order.vehicle_type && (() => {
          const VIcon = VEHICLE_ICON[order.vehicle_type]
          return (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              {VIcon && <VIcon size={14} className="text-gray-400" />}
              <span>{VEHICLE_LABEL[order.vehicle_type]}</span>
            </div>
          )
        })()}
        <div className="ml-auto text-right">
          <span className="text-xs text-gray-400">Ngày đăng</span>
          <p className="text-xs text-gray-600">{formatDateTime(order.created_at)}</p>
        </div>
      </div>
    </div>
  )
}
