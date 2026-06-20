import { useEffect, useState } from 'react'
import { Search, Shield, ShieldOff, Truck, Star, ChevronLeft, ChevronRight, BadgeCheck } from 'lucide-react'
import api from '../../lib/api'

const ROLE_TABS = [
  { value: 'all',     label: 'Tất cả' },
  { value: 'drivers', label: 'Tài xế' },
  { value: 'admins',  label: 'Admin' },
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [meta, setMeta] = useState(null)
  const [q, setQ] = useState('')
  const [applied, setApplied] = useState('')
  const [role, setRole] = useState('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [vBusyId, setVBusyId] = useState(null)

  useEffect(() => {
    setLoading(true)
    api.get('/admin/users', { params: { q: applied, role, page } })
      .then(res => { setUsers(res.data.data ?? []); setMeta(res.data) })
      .finally(() => setLoading(false))
  }, [applied, role, page])

  const submitSearch = (e) => { e.preventDefault(); setPage(1); setApplied(q) }

  const toggleAdmin = async (u) => {
    if (!confirm(u.is_admin ? `Thu quyền admin của ${u.name}?` : `Cấp quyền admin cho ${u.name}?`)) return
    setBusyId(u.id)
    try {
      const res = await api.post(`/admin/users/${u.id}/toggle-admin`)
      setUsers(list => list.map(x => x.id === u.id ? { ...x, is_admin: res.data.is_admin } : x))
    } catch (err) {
      alert(err.response?.data?.message ?? 'Lỗi không xác định')
    } finally {
      setBusyId(null)
    }
  }

  const verifyDriver = async (u) => {
    setVBusyId(u.id)
    try {
      const res = await api.post(`/admin/drivers/${u.id}/verify`)
      setUsers(list => list.map(x => x.id === u.id
        ? { ...x, driver_profile: { ...x.driver_profile, is_verified: res.data.is_verified } }
        : x))
    } catch (err) {
      alert(err.response?.data?.message ?? 'Lỗi không xác định')
    } finally {
      setVBusyId(null)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 tracking-tight">Người dùng</h2>
      <p className="text-sm text-gray-400 mb-5">{meta ? `${meta.total} tài khoản` : ' '}</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <form onSubmit={submitSearch} className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Tìm theo tên, email, SĐT..."
            className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15"
          />
        </form>
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {ROLE_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => { setRole(t.value); setPage(1) }}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                role === t.value ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">Không có kết quả</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map(u => {
              const dp = u.driver_profile
              return (
                <div key={u.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/60 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {u.name?.charAt(0)?.toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                      {u.is_admin && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
                          <Shield size={11} /> Admin
                        </span>
                      )}
                      {dp && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          <Truck size={11} /> Tài xế
                        </span>
                      )}
                      {dp?.is_verified && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                          <BadgeCheck size={11} /> Đã xác minh
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
                  </div>

                  <div className="hidden md:flex flex-col items-end text-xs text-gray-500 shrink-0 w-32">
                    <span>Gửi {u.sent_orders_count} · Giao {u.driven_orders_count}</span>
                    {dp && (
                      <span className="flex items-center gap-2 mt-0.5">
                        <span className="text-orange-600 font-semibold">{dp.credits} cr</span>
                        {dp.rating_count > 0 && (
                          <span className="flex items-center gap-0.5 text-amber-500">
                            <Star size={11} className="fill-amber-400 text-amber-400" />{Number(dp.rating_avg).toFixed(1)}
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  {dp && (
                    <button
                      onClick={() => verifyDriver(u)}
                      disabled={vBusyId === u.id}
                      className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                        dp.is_verified
                          ? 'border-gray-200 text-gray-600 hover:bg-gray-100'
                          : 'border-green-200 text-green-700 hover:bg-green-50'
                      }`}
                    >
                      <BadgeCheck size={13} /> {dp.is_verified ? 'Bỏ xác minh' : 'Xác minh'}
                    </button>
                  )}

                  <button
                    onClick={() => toggleAdmin(u)}
                    disabled={busyId === u.id}
                    className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                      u.is_admin
                        ? 'border-gray-200 text-gray-600 hover:bg-gray-100'
                        : 'border-orange-200 text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    {u.is_admin ? <><ShieldOff size={13} /> Thu quyền</> : <><Shield size={13} /> Cấp admin</>}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-500">Trang {meta.current_page} / {meta.last_page}</span>
          <button
            onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
            disabled={page >= meta.last_page}
            className="p-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
