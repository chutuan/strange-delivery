import { useEffect, useState } from 'react'
import { Search, Inbox, Coins, Check, Loader2 } from 'lucide-react'
import api from '../../lib/api'

function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

export default function AdminCreditPage() {
  const [drivers, setDrivers] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState([])
  const [reqLoading, setReqLoading] = useState(true)
  const [approvingCode, setApprovingCode] = useState(null)
  const [banner, setBanner] = useState(null) // null | { ok, msg }
  const [txns, setTxns] = useState([])
  const [txLoading, setTxLoading] = useState(true)

  const fetchDrivers = async (search = '') => {
    setLoading(true)
    try {
      const res = await api.get('/admin/credits', { params: { q: search } })
      setDrivers(res.data.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  const fetchRequests = async () => {
    setReqLoading(true)
    try {
      const res = await api.get('/admin/credits/requests')
      setRequests(res.data.data ?? [])
    } finally {
      setReqLoading(false)
    }
  }

  const fetchTxns = async () => {
    setTxLoading(true)
    try {
      const res = await api.get('/admin/credits/transactions')
      setTxns(res.data.data ?? [])
    } finally {
      setTxLoading(false)
    }
  }

  useEffect(() => { fetchDrivers(); fetchRequests(); fetchTxns() }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchDrivers(q)
  }

  const handleApprove = async (referenceCode) => {
    setApprovingCode(referenceCode)
    setBanner(null)
    try {
      const res = await api.post('/admin/credits/add', { reference_code: referenceCode })
      setBanner({ ok: true, msg: res.data.message })
      fetchDrivers(q)
      fetchRequests()
      fetchTxns()
    } catch (err) {
      setBanner({ ok: false, msg: err.response?.data?.message ?? 'Lỗi không xác định' })
    } finally {
      setApprovingCode(null)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-5">Quản lý credit tài xế</h2>

      {banner && (
        <p className={`mb-4 text-sm font-medium ${banner.ok ? 'text-green-600' : 'text-red-600'}`}>
          {banner.msg}
        </p>
      )}

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Driver list */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Tìm tài xế theo tên, email, SĐT..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
            <button type="submit" className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-colors">
              <Search size={16} className="text-gray-600" />
            </button>
          </form>

          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {drivers.map(dp => (
                <div
                  key={dp.id}
                  className="w-full flex justify-between items-center px-3 py-2.5 rounded-xl border border-transparent hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{dp.user?.name}</p>
                    <p className="text-xs text-gray-400">ID: {dp.user_id} · {dp.user?.email}</p>
                  </div>
                  <span className="text-sm font-bold text-orange-600">{dp.credits} cr</span>
                </div>
              ))}
              {drivers.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Không có kết quả</p>}
            </div>
          )}
        </div>

        {/* Pending top-up requests */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Inbox size={18} className="text-orange-500" />
            <h3 className="font-semibold text-gray-800">Yêu cầu nạp đang chờ</h3>
            {!reqLoading && requests.length > 0 && (
              <span className="ml-auto text-xs font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                {requests.length}
              </span>
            )}
          </div>

          {reqLoading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : requests.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Không có yêu cầu nào đang chờ duyệt</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {requests.map(req => (
                <div
                  key={req.id}
                  className="flex justify-between items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{req.driver?.name ?? '—'}</p>
                    <p className="text-xs text-gray-400">
                      <span className="font-mono">{req.reference_code}</span> · {req.amount} cr = {formatPrice(req.amount * 1000)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleApprove(req.reference_code)}
                    disabled={approvingCode === req.reference_code}
                    className="flex-shrink-0 flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {approvingCode === req.reference_code
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Check size={14} />}
                    Duyệt
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Coins size={18} className="text-orange-500" />
          <h3 className="font-semibold text-gray-800">Lịch sử giao dịch gần nhất</h3>
        </div>

        {txLoading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-2 pr-4">Tài xế</th>
                  <th className="pb-2 pr-4">Loại</th>
                  <th className="pb-2 pr-4">Mô tả</th>
                  <th className="pb-2 pr-4">Số credit</th>
                  <th className="pb-2">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {txns.map(tx => (
                  <tr key={tx.id}>
                    <td className="py-2 pr-4 font-medium text-gray-800">{tx.driver?.name ?? '—'}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        tx.amount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {tx.type === 'bid_deduction' ? 'Báo giá' : tx.type === 'bid_refund' ? 'Hoàn credit' : 'Nạp tiền'}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{tx.description}</td>
                    <td className={`py-2 pr-4 font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </td>
                    <td className="py-2 text-xs text-gray-400">{new Date(tx.created_at).toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
                {txns.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-gray-400">Chưa có giao dịch</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
