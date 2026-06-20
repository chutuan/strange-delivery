import { useEffect, useState } from 'react'
import { Search, PlusCircle, Coins } from 'lucide-react'
import api from '../../lib/api'

function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

export default function AdminCreditPage() {
  const [drivers, setDrivers] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [addForm, setAddForm] = useState({ driver_id: '', amount: 10, description: '' })
  const [addStatus, setAddStatus] = useState(null) // null | 'loading' | { ok, msg }
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

  const fetchTxns = async () => {
    setTxLoading(true)
    try {
      const res = await api.get('/admin/credits/transactions')
      setTxns(res.data.data ?? [])
    } finally {
      setTxLoading(false)
    }
  }

  useEffect(() => { fetchDrivers(); fetchTxns() }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchDrivers(q)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!addForm.driver_id) return
    setAddStatus('loading')
    try {
      const res = await api.post('/admin/credits/add', {
        driver_id: Number(addForm.driver_id),
        amount: Number(addForm.amount),
        description: addForm.description || undefined,
      })
      setAddStatus({ ok: true, msg: res.data.message })
      setAddForm(f => ({ ...f, amount: 10, description: '' }))
      fetchDrivers(q)
      fetchTxns()
    } catch (err) {
      setAddStatus({ ok: false, msg: err.response?.data?.message ?? 'Lỗi không xác định' })
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-5">Quản lý credit tài xế</h2>

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
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {drivers.map(dp => (
                <button
                  key={dp.id}
                  onClick={() => setAddForm(f => ({ ...f, driver_id: String(dp.user_id) }))}
                  className={`w-full text-left flex justify-between items-center px-3 py-2.5 rounded-xl border transition-colors ${
                    addForm.driver_id === String(dp.user_id)
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{dp.user?.name}</p>
                    <p className="text-xs text-gray-400">ID: {dp.user_id} · {dp.user?.email}</p>
                  </div>
                  <span className="text-sm font-bold text-blue-700">{dp.credits} cr</span>
                </button>
              ))}
              {drivers.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Không có kết quả</p>}
            </div>
          )}
        </div>

        {/* Add credits form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <PlusCircle size={18} className="text-green-600" />
            <h3 className="font-semibold text-gray-800">Cộng credit</h3>
          </div>

          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ID tài xế</label>
              <input
                type="number"
                value={addForm.driver_id}
                onChange={e => setAddForm(f => ({ ...f, driver_id: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                placeholder="Chọn từ danh sách hoặc nhập ID..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Số credit</label>
              <input
                type="number"
                min="1"
                max="100000"
                value={addForm.amount}
                onChange={e => setAddForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                required
              />
              <p className="text-xs text-gray-400 mt-0.5">= {formatPrice(Number(addForm.amount) * 1000)}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú (tuỳ chọn)</label>
              <input
                type="text"
                value={addForm.description}
                onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                placeholder="VD: Chuyển khoản MB Bank ngày 20/6..."
              />
            </div>

            {addStatus && addStatus !== 'loading' && (
              <p className={`text-sm font-medium ${addStatus.ok ? 'text-green-600' : 'text-red-600'}`}>
                {addStatus.msg}
              </p>
            )}

            <button
              type="submit"
              disabled={addStatus === 'loading'}
              className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {addStatus === 'loading' ? 'Đang xử lý...' : 'Cộng credit'}
            </button>
          </form>
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Coins size={18} className="text-blue-600" />
          <h3 className="font-semibold text-gray-800">Lịch sử giao dịch gần nhất</h3>
        </div>

        {txLoading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
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
                        tx.type === 'topup' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {tx.type === 'topup' ? 'Nạp tiền' : 'Báo giá'}
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
