import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Package, Star, XCircle, CheckCircle } from 'lucide-react'
import api from '../lib/api'

function timeAgo(s) {
  const diff = (Date.now() - new Date(s).getTime()) / 1000
  if (diff < 60) return 'vừa xong'
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  return new Date(s).toLocaleDateString('vi-VN')
}

const ICONS = {
  bid_placed: { icon: Package, color: 'text-orange-500 bg-orange-100' },
  bid_accepted: { icon: CheckCircle, color: 'text-green-600 bg-green-100' },
  bid_rejected: { icon: XCircle, color: 'text-gray-500 bg-gray-100' },
  order_delivered: { icon: CheckCircle, color: 'text-green-600 bg-green-100' },
  order_cancelled: { icon: XCircle, color: 'text-red-500 bg-red-100' },
  rating_received: { icon: Star, color: 'text-yellow-500 bg-yellow-100' },
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const fetchItems = useCallback((p = 1) => {
    if (p === 1) setLoading(true); else setLoadingMore(true)
    api.get('/notifications', { params: { page: p } })
      .then(res => {
        setItems(prev => p === 1 ? res.data.data : [...prev, ...res.data.data])
        setLastPage(res.data.last_page)
      })
      .finally(() => { setLoading(false); setLoadingMore(false) })
  }, [])

  useEffect(() => { fetchItems(1) }, [fetchItems])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchItems(next)
  }

  const openItem = async (n) => {
    if (!n.read_at) {
      await api.post(`/notifications/${n.id}/read`).catch(() => {})
      setItems(prev => prev.map(i => i.id === n.id ? { ...i, read_at: new Date().toISOString() } : i))
    }
    if (n.order_code) navigate(`/orders/${n.order_code}`)
  }

  const markAllRead = async () => {
    await api.post('/notifications/read-all').catch(() => {})
    setItems(prev => prev.map(i => ({ ...i, read_at: i.read_at ?? new Date().toISOString() })))
  }

  const hasUnread = items.some(i => !i.read_at)

  return (
    <div className="">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900">Thông báo</h2>
        {hasUnread && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 transition-colors"
          >
            <CheckCheck size={16} /> Đánh dấu đã đọc
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Bell size={48} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Chưa có thông báo nào</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {items.map(n => {
              const { icon: Icon, color } = ICONS[n.type] ?? { icon: Bell, color: 'text-gray-500 bg-gray-100' }
              return (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-colors ${
                    n.read_at ? 'bg-white border-gray-200' : 'bg-orange-50/60 border-orange-200'
                  } hover:shadow-sm`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                    <Icon size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                    {n.body && <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>}
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read_at && <span className="w-2 h-2 bg-orange-500 rounded-full shrink-0 mt-2" />}
                </button>
              )
            })}
          </div>

          {page < lastPage && (
            <div className="flex justify-center mt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50"
              >
                {loadingMore ? 'Đang tải...' : 'Xem thêm thông báo'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
