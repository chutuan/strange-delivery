import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Package } from 'lucide-react'
import api from '../../../lib/api'
import Spinner from '../../../components/Spinner'
import Pagination from '../../../components/Pagination'
import SummaryBar from './SummaryBar'
import OrderCard from './OrderCard'

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [counts, setCounts] = useState({})
  const [filter, setFilter] = useState('in_progress')

  useEffect(() => {
    setLoading(true)
    const params = { page }
    if (filter) params.status = filter
    api.get('/orders/mine', { params })
      .then(res => {
        setOrders(res.data.data)
        setMeta(res.data)
        setCounts(res.data.counts ?? {})
      })
      .finally(() => setLoading(false))
  }, [page, filter])

  const handleFilter = (status) => {
    setFilter(status)
    setPage(1)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Đơn của tôi</h2>
          {meta && <p className="text-sm text-gray-400 mt-0.5">{meta.total} đơn hàng</p>}
        </div>
        <Link
          to="/orders/create"
          className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-blue-200"
        >
          <Plus size={16} /> Tạo đơn
        </Link>
      </div>

      <SummaryBar counts={counts} activeFilter={filter} onFilter={handleFilter} />

      {loading ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Package size={24} className="opacity-50" />
          </div>
          {filter ? (
            <>
              <p className="font-semibold text-gray-500">Không có đơn nào</p>
              <p className="text-sm mt-1">Không có đơn với trạng thái này</p>
              <button onClick={() => handleFilter(null)} className="mt-3 text-sm text-blue-600 hover:underline">
                Xem tất cả đơn
              </button>
            </>
          ) : (
            <>
              <p className="font-semibold text-gray-500">Bạn chưa có đơn nào</p>
              <p className="text-sm mt-1">Nhấn &quot;Tạo đơn&quot; để bắt đầu</p>
              <Link
                to="/orders/create"
                className="inline-flex items-center gap-1.5 mt-4 bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl"
              >
                <Plus size={15} /> Tạo đơn đầu tiên
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {orders.map(order => <OrderCard key={order.id} order={order} />)}
        </div>
      )}

      <Pagination page={page} lastPage={meta?.last_page} onPage={setPage} />
    </div>
  )
}
