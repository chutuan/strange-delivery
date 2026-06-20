import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, User, CheckCircle, XCircle, Truck, Clock, Share2 } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import StatusBadge from '../components/StatusBadge'
import { StarDisplay, StarPicker } from '../components/StarRating'

function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}
function formatDate(s) {
  return new Date(s).toLocaleString('vi-VN')
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Bid form
  const [bidPrice, setBidPrice] = useState('')
  const [bidNote, setBidNote] = useState('')
  const [bidLoading, setBidLoading] = useState(false)
  const [bidError, setBidError] = useState('')

  // Deliver form
  const [deliveryNote, setDeliveryNote] = useState('')
  const [showDeliverForm, setShowDeliverForm] = useState(false)
  const [trackCopied, setTrackCopied] = useState(false)

  const copyTrackLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/track/${id}`).then(() => {
      setTrackCopied(true)
      setTimeout(() => setTrackCopied(false), 2000)
    })
  }

  // Rating form
  const [score, setScore] = useState(0)
  const [comment, setComment] = useState('')
  const [ratingLoading, setRatingLoading] = useState(false)

  const fetchOrder = () => {
    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data))
      .catch(() => navigate('/orders/mine'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrder() }, [id])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) return null

  const isSender = order.sender_id === user.id
  const isDriver = order.driver_id === user.id
  const myBid = order.bids?.find(b => b.driver_id === user.id)

  const acceptBid = async (bidId) => {
    setActionLoading(true)
    try {
      const { data } = await api.post(`/orders/${id}/accept-bid/${bidId}`)
      setOrder(data)
    } finally {
      setActionLoading(false)
    }
  }

  const withdrawBid = async (bidId) => {
    if (!confirm('Bạn có chắc muốn rút báo giá này?')) return
    setActionLoading(true)
    try {
      await api.delete(`/orders/${id}/bids/${bidId}`)
      fetchOrder()
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

  const markDelivered = async () => {
    setActionLoading(true)
    try {
      const { data } = await api.post(`/orders/${id}/deliver`, { delivery_note: deliveryNote || null })
      setOrder(data)
      setShowDeliverForm(false)
      setDeliveryNote('')
    } finally {
      setActionLoading(false)
    }
  }

  const submitBid = async (e) => {
    e.preventDefault()
    setBidError('')
    setBidLoading(true)
    try {
      await api.post(`/orders/${id}/bids`, { price: bidPrice, note: bidNote })
      setBidPrice('')
      setBidNote('')
      fetchOrder()
    } catch (err) {
      setBidError(err.response?.data?.message || 'Lỗi khi đặt giá.')
    } finally {
      setBidLoading(false)
    }
  }

  const submitRating = async (e) => {
    e.preventDefault()
    if (!score) return
    setRatingLoading(true)
    try {
      await api.post(`/orders/${id}/rate`, { score, comment })
      fetchOrder()
    } finally {
      setRatingLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
        <button
          onClick={copyTrackLink}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-700 border border-gray-200 hover:border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          {trackCopied ? <><CheckCircle size={13} className="text-green-600" /> Đã sao chép!</> : <><Share2 size={13} /> Chia sẻ link theo dõi</>}
        </button>
      </div>

      {/* Order info */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-gray-900">{order.title}</h2>
          <StatusBadge status={order.status} />
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
          <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-2">
            📝 {order.note}
          </p>
        )}
        {order.delivery_note && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
            🚚 Ghi chú giao hàng: {order.delivery_note}
          </p>
        )}

        {order.pickup_time && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Clock size={15} className="text-amber-500 shrink-0" />
            <span>Lấy hàng lúc: <span className="font-medium">{formatDate(order.pickup_time)}</span></span>
          </div>
        )}

        <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
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
          <div className="ml-auto text-right">
            <span className="text-xs text-gray-400">Ngày đăng</span>
            <p className="text-xs text-gray-600">{formatDate(order.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {order.status !== 'open' && order.status !== 'cancelled' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
          <h3 className="font-semibold text-gray-800 mb-4">Tiến trình đơn</h3>
          <div className="flex flex-col gap-0">
            {[
              { label: 'Đã đăng đơn', time: order.created_at, done: true },
              { label: 'Đã chọn tài xế', time: order.accepted_at, done: !!order.accepted_at },
              { label: 'Đã giao hàng', time: order.delivered_at, done: !!order.delivered_at },
            ].map((step, i, arr) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 ${step.done ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`} />
                  {i < arr.length - 1 && <div className={`w-0.5 flex-1 min-h-[28px] ${arr[i + 1].done ? 'bg-green-400' : 'bg-gray-200'}`} />}
                </div>
                <div className={`pb-4 ${step.done ? '' : 'opacity-50'}`}>
                  <p className="text-sm font-medium text-gray-800">{step.label}</p>
                  {step.time && <p className="text-xs text-gray-400">{formatDate(step.time)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sender info (for drivers) */}
      {!isSender && order.sender && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
            <User size={18} className="text-blue-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{order.sender.name}</p>
            {order.sender.phone && <p className="text-xs text-gray-500">{order.sender.phone}</p>}
          </div>
        </div>
      )}

      {/* Driver info (for sender after matched) */}
      {isSender && order.driver && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
            <Truck size={18} className="text-green-700" />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Tài xế</p>
            <p className="text-sm font-semibold text-gray-800">{order.driver.name}</p>
            {order.driver.phone && <p className="text-xs text-gray-500">{order.driver.phone}</p>}
          </div>
        </div>
      )}

      {/* Sender actions */}
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

      {/* Driver action: mark delivered */}
      {isDriver && order.status === 'in_progress' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
          {!showDeliverForm ? (
            <button
              onClick={() => setShowDeliverForm(true)}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-xl transition-colors"
            >
              <CheckCircle size={18} /> Xác nhận đã giao
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-gray-700">Xác nhận giao hàng thành công?</p>
              <textarea
                rows={2}
                value={deliveryNote}
                onChange={e => setDeliveryNote(e.target.value)}
                placeholder="Ghi chú khi giao (tuỳ chọn): đã giao cho bảo vệ, để trước cửa..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={markDelivered}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors"
                >
                  <CheckCircle size={16} /> {actionLoading ? 'Đang xác nhận...' : 'Xác nhận đã giao'}
                </button>
                <button
                  onClick={() => { setShowDeliverForm(false); setDeliveryNote('') }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Huỷ
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rating */}
      {isSender && order.status === 'delivered' && !order.rating && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
          <h3 className="font-semibold text-gray-800 mb-3">Đánh giá tài xế</h3>
          <form onSubmit={submitRating} className="flex flex-col gap-3">
            <StarPicker value={score} onChange={setScore} />
            <textarea
              rows={2}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Nhận xét về tài xế (tuỳ chọn)..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              type="submit"
              disabled={!score || ratingLoading}
              className="self-start bg-yellow-500 hover:bg-yellow-600 disabled:opacity-40 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {ratingLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </form>
        </div>
      )}

      {/* Existing rating */}
      {order.rating && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <StarDisplay score={order.rating.score} />
            <span className="text-sm text-gray-600">{order.rating.score}/5</span>
          </div>
          {order.rating.comment && <p className="text-sm text-gray-700">{order.rating.comment}</p>}
        </div>
      )}

      {/* Bids list */}
      {order.bids && order.bids.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-800 mb-1">
            {order.bids.length} tài xế đã bid
          </h3>
          {isSender && order.status === 'open' && (
            <p className="text-xs text-gray-400 mb-3">Chọn tài xế phù hợp để xác nhận đơn.</p>
          )}
          <div className="flex flex-col gap-3 mt-3">
            {order.bids.map(bid => {
              const profile = bid.driver?.driver_profile
              const priceDiff = bid.price - order.budget_price
              return (
                <div
                  key={bid.id}
                  className={`p-4 rounded-xl border ${
                    bid.status === 'accepted'
                      ? 'border-green-300 bg-green-50'
                      : bid.status === 'rejected'
                      ? 'border-gray-100 bg-gray-50 opacity-60'
                      : 'border-blue-100 bg-blue-50/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-blue-700 font-bold text-sm">
                      {bid.driver?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">{bid.driver?.name}</span>
                        <StatusBadge status={bid.status} />
                      </div>

                      {/* Rating + vehicle */}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {profile?.rating_count > 0 ? (
                          <>
                            <StarDisplay score={Math.round(profile.rating_avg)} size={13} />
                            <span className="text-xs font-medium text-gray-700">{Number(profile.rating_avg).toFixed(1)}</span>
                            <span className="text-xs text-gray-400">({profile.rating_count} đánh giá)</span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">Chưa có đánh giá</span>
                        )}
                        {profile?.vehicle_type && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                            {profile.vehicle_type}
                          </span>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-blue-700 font-bold text-sm">{formatPrice(bid.price)}</span>
                        {priceDiff !== 0 && (
                          <span className={`text-xs font-medium ${priceDiff < 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {priceDiff < 0 ? `↓ ${formatPrice(Math.abs(priceDiff))}` : `↑ ${formatPrice(priceDiff)}`}
                          </span>
                        )}
                      </div>

                      {bid.note && (
                        <p className="text-xs text-gray-500 mt-1 italic">&ldquo;{bid.note}&rdquo;</p>
                      )}
                    </div>

                    {/* Accept button */}
                    {isSender && order.status === 'open' && bid.status === 'pending' && (
                      <button
                        onClick={() => acceptBid(bid.id)}
                        disabled={actionLoading}
                        className="shrink-0 flex items-center gap-1.5 text-xs bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-40 font-medium"
                      >
                        <CheckCircle size={13} /> Chọn
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Driver: bid form */}
      {!isSender && user.driver_profile && order.status === 'open' && !myBid && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mt-4">
          <h3 className="font-semibold text-gray-800 mb-3">Đặt giá</h3>
          {user.driver_profile && !user.driver_profile.is_active && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-3 py-2 mb-3">
              ⚠️ Bạn đang offline. Bật online trong hồ sơ để có thể báo giá.
            </div>
          )}
          {bidError && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">{bidError}</div>
          )}
          <form onSubmit={submitBid} className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá của bạn (VND)</label>
              <input
                type="number"
                required
                min="0"
                value={bidPrice}
                onChange={e => setBidPrice(e.target.value)}
                placeholder={`Giá đăng: ${formatPrice(order.budget_price)}`}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
              </label>
              <textarea
                rows={2}
                value={bidNote}
                onChange={e => setBidNote(e.target.value)}
                placeholder="Lý do đặt giá, thời gian dự kiến..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={bidLoading}
              className="self-start bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {bidLoading ? 'Đang gửi...' : 'Đặt giá'}
            </button>
          </form>
        </div>
      )}

      {myBid && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-800">Báo giá của bạn</p>
              <p className="text-blue-700 font-bold mt-1">{formatPrice(myBid.price)}</p>
              <div className="mt-1"><StatusBadge status={myBid.status} /></div>
            </div>
            {order.status === 'open' && myBid.status === 'pending' && (
              <button
                onClick={() => withdrawBid(myBid.id)}
                disabled={actionLoading}
                className="shrink-0 flex items-center gap-1 text-xs text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
              >
                <XCircle size={13} /> Rút báo giá
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
