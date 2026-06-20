import { OrderStatus, BidStatus } from '../lib/enums'

const config = {
  [OrderStatus.DRAFT]:       { label: 'Nháp',            class: 'bg-gray-100 text-gray-500' },
  [OrderStatus.OPEN]:        { label: 'Đang mở',         class: 'bg-green-100 text-green-700' },
  [OrderStatus.IN_PROGRESS]: { label: 'Đang giao',       class: 'bg-blue-100 text-blue-700' },
  [OrderStatus.DELIVERED]:   { label: 'Đã giao',         class: 'bg-gray-100 text-gray-700' },
  [OrderStatus.CANCELLED]:   { label: 'Đã hủy',          class: 'bg-red-100 text-red-600' },
  [BidStatus.PENDING]:       { label: 'Chờ duyệt',       class: 'bg-yellow-100 text-yellow-700' },
  [BidStatus.ACCEPTED]:      { label: 'Được chọn',       class: 'bg-green-100 text-green-700' },
  [BidStatus.REJECTED]:      { label: 'Bị từ chối',      class: 'bg-red-100 text-red-600' },
}

export default function StatusBadge({ status }) {
  const { label, class: cls } = config[status] ?? { label: status, class: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  )
}
