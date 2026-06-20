import { useState } from 'react'
import api from '../../../lib/api'
import { formatPrice } from '../../../lib/format'

export default function BidForm({ orderId, budgetPrice, myBid, onSuccess }) {
  const [price, setPrice] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (myBid) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mt-4">
        <p className="text-sm font-semibold text-blue-800">Báo giá của bạn</p>
        <p className="text-blue-700 font-bold mt-1">{formatPrice(myBid.price)}</p>
        {myBid.note && <p className="text-xs text-gray-600 mt-1">{myBid.note}</p>}
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post(`/orders/${orderId}/bids`, { price, note })
      setPrice('')
      setNote('')
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi đặt giá.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 mt-4">
      <h3 className="font-semibold text-gray-800 mb-3">Báo giá</h3>
      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Giá của bạn (VND)</label>
          <input
            type="number"
            required
            min="0"
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder={`Giá đăng: ${formatPrice(budgetPrice)}`}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ghi chú <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Lý do báo giá, thời gian dự kiến..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="self-start bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {loading ? 'Đang gửi...' : 'Gửi báo giá'}
        </button>
      </form>
    </div>
  )
}
