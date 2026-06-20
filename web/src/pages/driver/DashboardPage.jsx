import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Star, TrendingUp, Package, CheckCircle2, ChevronRight } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import api from '../../lib/api'
import { formatPrice, formatDateTime } from '../../lib/format'
import Spinner from '../../components/Spinner'

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function RatingBar({ avg, count }) {
  const pct = (avg / 5) * 100
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
            <Star size={20} className="text-yellow-500 fill-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Đánh giá</p>
            <p className="text-xl font-bold text-gray-900">{avg.toFixed(1)}<span className="text-sm font-normal text-gray-400">/5</span></p>
          </div>
        </div>
        <span className="text-sm text-gray-400">{count} đánh giá</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function BidRate({ total, accepted }) {
  const pct = total > 0 ? Math.round((accepted / total) * 100) : 0
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <TrendingUp size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Tỉ lệ trúng bid</p>
            <p className="text-xl font-bold text-gray-900">{pct}<span className="text-sm font-normal text-gray-400">%</span></p>
          </div>
        </div>
        <span className="text-sm text-gray-400">{accepted}/{total} bid</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function DailyChart({ data }) {
  const [activeTab, setActiveTab] = useState('orders')

  const shortDate = (d) => {
    const [, m, day] = d.split('-')
    return `${day}/${m}`
  }

  const chartData = data.map(r => ({
    ...r,
    label: shortDate(r.date),
    earningsK: Math.round(r.earnings / 1000),
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {activeTab === 'orders' ? (
          <p className="text-blue-600 font-medium">{payload[0]?.value} đơn</p>
        ) : (
          <p className="text-emerald-600 font-medium">{formatPrice(payload[0]?.value * 1000)}</p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Hoạt động 30 ngày qua</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {activeTab === 'orders' ? 'Số đơn giao thành công' : 'Doanh thu (nghìn đồng)'}
          </p>
        </div>
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'orders'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Đơn hàng
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'earnings'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Doanh thu
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {activeTab === 'orders' ? (
            <Line
              type="monotone"
              dataKey="orders"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#3b82f6' }}
            />
          ) : (
            <Line
              type="monotone"
              dataKey="earningsK"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#10b981' }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function DriverDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/driver/stats')
      .then(res => setStats(res.data))
      .catch(err => setError(err.response?.data?.message || 'Không thể tải thống kê.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  if (error) {
    return (
      <div className="text-center py-20">
        <Truck size={48} className="mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Tổng quan</h2>
        <p className="text-sm text-gray-400 mt-0.5">Thống kê hoạt động của bạn</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard
          icon={CheckCircle2}
          label="Đã giao thành công"
          value={stats.total_delivered}
          sub="đơn hàng"
          color="bg-green-50 text-green-600"
        />
        <StatCard
          icon={Package}
          label="Đang giao"
          value={stats.active_orders}
          sub="đơn đang chạy"
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Tổng doanh thu"
          value={formatPrice(stats.total_earnings)}
          color="bg-blue-50 text-blue-600"
          sub="từ tất cả đơn"
        />
        <StatCard
          icon={Star}
          label="Đánh giá trung bình"
          value={stats.rating_avg.toFixed(1)}
          sub={`${stats.rating_count} lượt đánh giá`}
          color="bg-yellow-50 text-yellow-500"
        />
      </div>

      {/* Daily chart */}
      {stats.daily_stats && <DailyChart data={stats.daily_stats} />}

      {/* Rating bar */}
      <div className="mb-3">
        <RatingBar avg={stats.rating_avg} count={stats.rating_count} />
      </div>

      {/* Bid rate */}
      <div className="mb-6">
        <BidRate total={stats.total_bids} accepted={stats.accepted_bids} />
      </div>

      {/* Recent deliveries */}
      {stats.recent_deliveries.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Giao hàng gần đây</h3>
          <div className="flex flex-col gap-2">
            {stats.recent_deliveries.map(order => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="bg-white border border-gray-200 rounded-xl p-3.5 flex items-center gap-3 hover:shadow-sm transition-shadow group"
              >
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{order.title}</p>
                  <p className="text-xs text-gray-400 truncate">{order.delivery_address}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-green-700">{formatPrice(order.final_price)}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">{formatDateTime(order.delivered_at)}</span>
                  </div>
                </div>
                <ChevronRight size={15} className="text-gray-300 group-hover:text-gray-500 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {stats.total_delivered === 0 && (
        <div className="text-center py-10 text-gray-400">
          <Truck size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Chưa có đơn nào được giao</p>
          <Link to="/orders/open" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
            Tìm đơn ngay →
          </Link>
        </div>
      )}
    </div>
  )
}
