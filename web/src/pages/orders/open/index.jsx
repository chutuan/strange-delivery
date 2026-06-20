import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, ChevronRight, Truck, Bike, Car, Zap, ListFilter, Search, SlidersHorizontal, Navigation } from 'lucide-react'

const VEHICLE_ICON = { motorbike: Bike, car: Car, truck: Truck }
const VEHICLE_LABEL = { motorbike: 'Xe máy', car: 'Ô tô', truck: 'Xe tải' }
import api from '../../../lib/api'
import { useAuth } from '../../../contexts/AuthContext'
import { formatPrice } from '../../../lib/format'
import StatusBadge from '../../../components/StatusBadge'
import Spinner from '../../../components/Spinner'
import Pagination from '../../../components/Pagination'

const SORTS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'nearest', label: '📍 Gần nhất' },
  { value: 'price_desc', label: 'Giá cao' },
  { value: 'price_asc', label: 'Giá thấp' },
]

export default function OpenOrdersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // geolocation
  const [driverLat, setDriverLat] = useState(null)
  const [driverLng, setDriverLng] = useState(null)
  const [geoStatus, setGeoStatus] = useState('idle') // idle | loading | granted | denied

  // form inputs
  const [q, setQ] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('newest')
  // applied filters (trigger fetch)
  const [applied, setApplied] = useState({ q: '', min_price: '', max_price: '', sort: 'newest' })

  const geoRef = useRef(null)

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('denied')
      return
    }
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDriverLat(pos.coords.latitude)
        setDriverLng(pos.coords.longitude)
        setGeoStatus('granted')
        // Auto-switch to nearest sort
        setSort('nearest')
        setApplied(a => ({ ...a, sort: 'nearest' }))
      },
      () => setGeoStatus('denied'),
      { timeout: 8000, maximumAge: 60000 },
    )
  }

  useEffect(() => {
    if (!user?.driver_profile) return
    setLoading(true)
    const params = { page, sort: applied.sort }
    if (applied.q) params.q = applied.q
    if (applied.min_price) params.min_price = applied.min_price
    if (applied.max_price) params.max_price = applied.max_price
    if (driverLat && driverLng) {
      params.lat = driverLat
      params.lng = driverLng
    }

    api.get('/orders/open', { params })
      .then(res => {
        setOrders(res.data.data)
        setMeta(res.data)
        setError('')
      })
      .catch(err => setError(err.response?.data?.message || 'Lỗi tải đơn.'))
      .finally(() => setLoading(false))
  }, [page, applied, user, driverLat, driverLng])

  const applyFilters = (e) => {
    e?.preventDefault()
    setPage(1)
    setApplied({ q, min_price: minPrice, max_price: maxPrice, sort })
  }

  const resetFilters = () => {
    setQ(''); setMinPrice(''); setMaxPrice(''); setSort('newest')
    setPage(1)
    setApplied({ q: '', min_price: '', max_price: '', sort: 'newest' })
  }

  if (!user?.driver_profile) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <Truck size={52} className="mx-auto mb-4 text-blue-300" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Bạn chưa đăng ký tài xế</h2>
        <p className="text-gray-500 text-sm mb-6">Đăng ký để bắt đầu nhận đơn và kiếm thêm thu nhập.</p>
        <button
          onClick={() => navigate('/driver/register')}
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
        >
          Đăng ký tài xế
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Đơn đang mở</h2>
        <button
          onClick={requestLocation}
          disabled={geoStatus === 'loading'}
          title={geoStatus === 'granted' ? 'Đang dùng vị trí của bạn' : 'Bật vị trí để xem đơn gần nhất'}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
            geoStatus === 'granted'
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : geoStatus === 'denied'
              ? 'border-red-200 text-red-500'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Navigation size={13} />
          {geoStatus === 'granted' ? 'Đang dùng GPS' : geoStatus === 'denied' ? 'Bị từ chối' : geoStatus === 'loading' ? 'Đang lấy...' : 'Bật GPS'}
        </button>
      </div>

      {/* Search + filter bar */}
      <form onSubmit={applyFilters} className="mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Tìm theo tiêu đề, địa chỉ..."
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(s => !s)}
            className={`px-3 rounded-lg border text-sm flex items-center gap-1.5 transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-600'
            }`}
          >
            <SlidersHorizontal size={15} /> Lọc
          </button>
          <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 rounded-lg transition-colors">
            Tìm
          </button>
        </div>

        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mt-2 flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Giá từ (VND)</label>
                <input type="number" min="0" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Đến (VND)</label>
                <input type="number" min="0" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sắp xếp</label>
              <div className="flex gap-2 flex-wrap">
                {SORTS.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    disabled={s.value === 'nearest' && geoStatus !== 'granted'}
                    onClick={() => setSort(s.value)}
                    title={s.value === 'nearest' && geoStatus !== 'granted' ? 'Cần bật GPS trước' : ''}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-40 ${
                      sort === s.value ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                Áp dụng
              </button>
              <button type="button" onClick={resetFilters} className="px-4 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                Đặt lại
              </button>
            </div>
          </div>
        )}
      </form>

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Truck size={48} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Không tìm thấy đơn nào</p>
          <p className="text-sm mt-1">Thử đổi bộ lọc hoặc quay lại sau</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map(order => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-gray-900 truncate">{order.title}</span>
                  {order.order_type === 'instant'
                    ? <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full"><Zap size={10} />Giao luôn</span>
                    : <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full"><ListFilter size={10} />Bid</span>
                  }
                  {order.distance_km != null && (
                    <span className="text-xs text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded-full">
                      📍 {order.distance_km < 1 ? `${Math.round(order.distance_km * 1000)}m` : `${order.distance_km}km`}
                    </span>
                  )}
                </div>
                <div className="flex items-start gap-1 text-sm text-gray-500 mb-0.5">
                  <MapPin size={13} className="mt-0.5 shrink-0 text-green-600" />
                  <span className="truncate">{order.pickup_address}</span>
                </div>
                <div className="flex items-start gap-1 text-sm text-gray-500">
                  <MapPin size={13} className="mt-0.5 shrink-0 text-red-500" />
                  <span className="truncate">{order.delivery_address}</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <span className="font-bold text-blue-700 text-sm">{formatPrice(order.budget_price)}</span>
                  {order.vehicle_type && (() => {
                    const VIcon = VEHICLE_ICON[order.vehicle_type]
                    return (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        {VIcon && <VIcon size={12} />}
                        {VEHICLE_LABEL[order.vehicle_type]}
                      </span>
                    )
                  })()}
                  <span className="text-xs text-gray-400">bởi {order.sender?.name}</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400 shrink-0 mt-1" />
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} lastPage={meta?.last_page} onPage={setPage} />
    </div>
  )
}
