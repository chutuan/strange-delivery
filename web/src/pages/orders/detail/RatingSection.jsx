import { useState } from 'react'
import api from '../../../lib/api'
import { StarDisplay, StarPicker } from '../../../components/StarRating'

export default function RatingSection({ orderId, rating, isSender, orderStatus, onSuccess }) {
  const [score, setScore] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  if (rating) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <StarDisplay score={rating.score} />
          <span className="text-sm text-gray-600">{rating.score}/5</span>
        </div>
        {rating.comment && <p className="text-sm text-gray-700">{rating.comment}</p>}
      </div>
    )
  }

  if (!isSender || orderStatus !== 'delivered') return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!score) return
    setLoading(true)
    try {
      await api.post(`/orders/${orderId}/rate`, { score, comment })
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
      <h3 className="font-semibold text-gray-800 mb-3">Đánh giá tài xế</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
          disabled={!score || loading}
          className="self-start bg-yellow-500 hover:bg-yellow-600 disabled:opacity-40 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
        </button>
      </form>
    </div>
  )
}
