import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Truck, Package, Banknote, Bell, ChevronRight } from 'lucide-react'
import api from '../../lib/api'
import { formatPrice } from '../../lib/format'
import StatusBadge from '../../components/StatusBadge'

const STATUS_META = {
  open:        { label: 'Đang mở',   color: '#3B82F6' },
  in_progress: { label: 'Đang giao', color: '#F97316' },
  delivered:   { label: 'Đã giao',   color: '#10B981' },
  cancelled:   { label: 'Đã hủy',    color: '#94A3B8' },
  draft:       { label: 'Nháp',      color: '#CBD5E1' },
}

function StatCard({ icon: Icon, iconBg, iconColor, label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg, color: iconColor }}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">{value}</p>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!stats) return null

  const byStatus = stats.orders_by_status ?? {}
  const barTotal = Object.values(byStatus).reduce((a, b) => a + b, 0) || 1

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 tracking-tight">Tổng quan</h2>
      <p className="text-sm text-gray-400 mb-5">Số liệu toàn hệ thống</p>

      {stats.pending_topups > 0 && (
        <Link to="/admin/credits" className="flex items-center gap-3 mb-5 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 hover:bg-orange-100 transition-colors">
          <Bell size={18} className="text-orange-600 shrink-0" />
          <p className="text-sm text-orange-800 flex-1">
            Có <b>{stats.pending_topups}</b> yêu cầu nạp credit đang chờ xử lý
          </p>
          <ChevronRight size={16} className="text-orange-400" />
        </Link>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard icon={Users}    iconBg="#EFF6FF" iconColor="#2563EB" label="Người dùng"  value={stats.users} />
        <StatCard icon={Truck}    iconBg="#FFF7ED" iconColor="#EA580C" label="Tài xế"      value={stats.drivers} />
        <StatCard icon={Package}  iconBg="#F0FDF4" iconColor="#059669" label="Tổng đơn"     value={stats.orders_total} />
        <StatCard icon={Banknote} iconBg="#FFF7ED" iconColor="#EA580C" label="Doanh thu"   value={formatPrice(stats.revenue)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Status breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">Đơn hàng theo trạng thái</h3>
          <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 mb-4">
            {Object.entries(byStatus).map(([k, v]) => v > 0 && (
              <div key={k} style={{ width: `${(v / barTotal) * 100}%`, background: STATUS_META[k]?.color }} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {Object.entries(byStatus).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STATUS_META[k]?.color }} />
                <span className="text-sm text-gray-600 flex-1">{STATUS_META[k]?.label ?? k}</span>
                <span className="text-sm font-semibold text-gray-900">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 text-sm">Đơn hàng gần đây</h3>
            <Link to="/admin/orders" className="text-xs text-orange-600 font-medium hover:underline">Xem tất cả</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recent_orders.map(o => (
              <Link to={`/admin/orders/${o.order_code}`} key={o.id} className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{o.title}</p>
                  <p className="text-xs text-gray-400 font-mono">#{o.order_code} · {o.sender?.name}</p>
                </div>
                <span className="text-sm font-semibold text-orange-600 shrink-0">{formatPrice(o.final_price ?? o.budget_price)}</span>
                <StatusBadge status={o.status} />
              </Link>
            ))}
            {stats.recent_orders.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">Chưa có đơn nào</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
