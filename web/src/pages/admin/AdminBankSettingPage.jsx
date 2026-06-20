import { useEffect, useState } from 'react'
import { Building2, Save } from 'lucide-react'
import api from '../../lib/api'

const BANKS = [
  { id: 'VCB', name: 'Vietcombank' },
  { id: 'TCB', name: 'Techcombank' },
  { id: 'MB', name: 'MB Bank' },
  { id: 'ACB', name: 'ACB' },
  { id: 'VPB', name: 'VPBank' },
  { id: 'BIDV', name: 'BIDV' },
  { id: 'VTB', name: 'Vietinbank' },
  { id: 'STB', name: 'Sacombank' },
  { id: 'TPB', name: 'TPBank' },
  { id: 'VIB', name: 'VIB' },
  { id: 'SHB', name: 'SHB' },
  { id: 'HDB', name: 'HDBank' },
  { id: 'MSB', name: 'MSB' },
  { id: 'OCB', name: 'OCB' },
  { id: 'SEAB', name: 'SeABank' },
]

export default function AdminBankSettingPage() {
  const [form, setForm] = useState({ bank_id: 'VCB', account_number: '', account_name: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/bank-settings').then(res => {
      if (res.data) setForm(res.data)
    }).finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      await api.put('/admin/bank-settings', form)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="">
      <div className="flex items-center gap-3 mb-6">
        <Building2 size={22} className="text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Tài khoản ngân hàng nhận tiền</h2>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngân hàng</label>
            <select
              value={form.bank_id}
              onChange={e => setForm(f => ({ ...f, bank_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
            >
              {BANKS.map(b => (
                <option key={b.id} value={b.id}>{b.id} — {b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số tài khoản</label>
            <input
              type="text"
              value={form.account_number}
              onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono"
              placeholder="Nhập số tài khoản..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên chủ tài khoản</label>
            <input
              type="text"
              value={form.account_name}
              onChange={e => setForm(f => ({ ...f, account_name: e.target.value.toUpperCase() }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm uppercase"
              placeholder="NGUYEN VAN A"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Nhập chữ IN HOA, đúng tên trên tài khoản ngân hàng</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Đang lưu...' : saved ? 'Đã lưu!' : 'Lưu cài đặt'}
          </button>
        </form>
      </div>

      {/* Preview */}
      {form.account_number && (
        <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Xem trước QR (số tiền mẫu 50.000đ)</p>
          <img
            src={`https://img.vietqr.io/image/${form.bank_id}-${form.account_number}-compact2.png?amount=50000&addInfo=NAPTIEN+123&accountName=${encodeURIComponent(form.account_name)}`}
            alt="QR preview"
            className="w-48 h-48 rounded-xl border border-gray-100 mx-auto"
          />
        </div>
      )}
    </div>
  )
}
