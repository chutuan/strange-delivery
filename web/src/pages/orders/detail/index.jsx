import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Zap } from 'lucide-react'
import api from '../../../lib/api'
import { useAuth } from '../../../contexts/AuthContext'
import Spinner from '../../../components/Spinner'
import OrderInfo from './OrderInfo'
import PersonCard from './PersonCard'
import BidList from './BidList'
import BidForm from './BidForm'
import RatingSection from './RatingSection'

export default function OrderDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchOrder = () => {
    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data))
      .catch(() => navigate('/orders/mine'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrder() }, [id])

  if (loading) return <Spinner className="py-20" />
  if (!order) return null

  const isSender = order.sender_id === user.id
  const isDriver = order.driver_id === user.id
  const myBid = order.bids?.find(b => b.driver_id === user.id)
  const isInstant = order.order_type === 'instant'
  const canAcceptInstant = !isSender && isInstant && order.status === 'open' && user.driver_profile

  const acceptBid = async (bidId) => {
    setActionLoading(true)
    try {
      const { data } = await api.post(`/orders/${id}/accept-bid/${bidId}`)
      setOrder(data)
    } finally {
      setActionLoading(false)
    }
  }

  const cancelOrder = async () => {
    if (!confirm('Bạn có chắc muốn hủy đơn này?')) return
    setActionLoading(true)
    try {
      const { data } = await api.post(`/orders/${id}/cancel`)
      setOrder(data)
    } finally {
      setActionLoading(false)
    }
  }

  const acceptInstant = async () => {
    setActionLoading(true)
    try {
      const { data } = await api.post(`/orders/${id}/accept`)
      setOrder(data)
    } finally {
      setActionLoading(false)
    }
  }

  const markDelivered = async () => {
    setActionLoading(true)
    try {
      const { data } = await api.post(`/orders/${id}/deliver`)
      setOrder(data)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
      >
        <ArrowLeft size={16} /> Quay lại
      </button>

      <OrderInfo order={order} />

      {!isSender && order.sender && <PersonCard person={order.sender} role="sender" />}
      {isSender && order.driver && <PersonCard person={order.driver} role="driver" />}

      {isSender && order.status === 'open' && (
        <div className="flex justify-end mb-4">
          <button
            onClick={cancelOrder}
            disabled={actionLoading}
            className="flex items-center gap-1.5 text-sm text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
          >
            <XCircle size={15} /> Hủy đơn
          </button>
        </div>
      )}

      {isDriver && order.status === 'in_progress' && (
        <button
          onClick={markDelivered}
          disabled={actionLoading}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-xl mb-4 transition-colors disabled:opacity-50"
        >
          <CheckCircle size={18} /> Xác nhận đã giao
        </button>
      )}

      <RatingSection
        orderId={id}
        rating={order.rating}
        isSender={isSender}
        orderStatus={order.status}
        onSuccess={fetchOrder}
      />

      {canAcceptInstant && (
        <button
          onClick={acceptInstant}
          disabled={actionLoading}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl mb-4 transition-colors disabled:opacity-50"
        >
          <Zap size={18} /> Nhận đơn ngay
        </button>
      )}

      {!isInstant && (
        <>
          <BidList
            bids={order.bids}
            isSender={isSender}
            orderStatus={order.status}
            onAccept={acceptBid}
            actionLoading={actionLoading}
          />
          {!isSender && user.driver_profile && order.status === 'open' && (
            <BidForm
              orderId={id}
              budgetPrice={order.budget_price}
              myBid={myBid}
              onSuccess={fetchOrder}
            />
          )}
        </>
      )}
    </div>
  )
}
