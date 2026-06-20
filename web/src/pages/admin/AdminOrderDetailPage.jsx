import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, User, Phone } from 'lucide-react'
import api from '../../lib/api'
import OrderInfo from '../orders/detail/OrderInfo'
import PersonCard from '../orders/detail/PersonCard'
import BidList from '../orders/detail/BidList'

export default function AdminOrderDetailPage() {
  const { code } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`/admin/orders/${code}`)
      .then(r => setOrder(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [code])

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
  if (error || !order) return <p className="text-sm text-gray-400 py-12 text-center">Không tìm thấy đơn hàng</p>

  return (
    <div>
      <Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 mb-4 transition-colors">
        <ArrowLeft size={15} /> Danh sách đơn
      </Link>

      <OrderInfo order={order} />

      {order.sender && <PersonCard person={order.sender} role="sender" />}
      {order.driver && <PersonCard person={order.driver} role="driver" />}

      {order.recipient_name && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Người nhận</p>
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0"><User size={15} /></div>
            <span className="text-sm font-semibold text-gray-800">{order.recipient_name}</span>
          </div>
          {order.recipient_phone && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"><Phone size={15} /></div>
              <a href={`tel:${order.recipient_phone}`} className="text-sm font-medium text-orange-600 hover:underline">{order.recipient_phone}</a>
            </div>
          )}
        </div>
      )}

      {order.order_type !== 'instant' && (
        <BidList bids={order.bids} isSender={false} orderStatus={order.status} onAccept={() => {}} actionLoading={false} />
      )}
    </div>
  )
}
