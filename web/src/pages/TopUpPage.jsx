import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CreditCard, Info } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

function vietQrUrl(bankId, accountNo, accountName, amount, content) {
  const name = encodeURIComponent(accountName)
  const info = encodeURIComponent(content)
  return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${info}&accountName=${name}`
}

export default function TopUpPage() {
  const { user } = useAuth()
  const [creditInfo, setCreditInfo] = useState(null)
  const [history, setHistory] = useState([])
  const [amount, setAmount] = useState(10)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/driver/credits'),
      api.get('/driver/credits/history'),
    ]).then(([c, h]) => {
      setCreditInfo(c.data)
      setHistory(h.data.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const bank = creditInfo?.bank_setting
  const driverId = creditInfo?.driver_id
  const transferContent = `NAPTIEN ${driverId}`
  const vndAmount = amount * 1000

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-3 mb-5">
        <Link to="/profile" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-xl font-bold text-gray-900">Nạp credit</h2>
      </div>

      {/* Current balance */}
      <div className="bg-blue-700 text-white rounded-2xl p-5 mb-4">
        <p className="text-sm text-blue-200 mb-1">Số dư hiện tại</p>
        <p className="text-3xl font-bold">{creditInfo?.credits ?? 0} credit</p>
        <p className="text-sm text-blue-200 mt-1">1 credit = 1.000đ · Mỗi lần báo giá tốn 1 credit</p>
      </div>

      {/* Amount selector */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
        <p className="font-semibold text-gray-800 mb-3">Chọn số credit muốn nạp</p>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[5, 10, 20, 50, 100, 200, 500, 1000].map(v => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              className={`py-2 rounded-lg text-sm font-semibold border transition-colors ${
                amount === v
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'border-gray-200 text-gray-700 hover:border-blue-300'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            value={amount}
            onChange={e => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Nhập số khác..."
          />
          <span className="text-sm text-gray-500">credit = {formatPrice(amount * 1000)}</span>
        </div>
      </div>

      {/* QR code */}
      {bank ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-blue-600" />
            <span className="font-semibold text-gray-800">Quét QR để chuyển khoản</span>
          </div>

          <div className="flex justify-center mb-4">
            <img
              src={vietQrUrl(bank.bank_id, bank.account_number, bank.account_name, vndAmount, transferContent)}
              alt="VietQR"
              className="w-56 h-56 rounded-xl border border-gray-100"
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Ngân hàng</span>
              <span className="font-semibold">{bank.bank_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Số tài khoản</span>
              <span className="font-mono font-semibold">{bank.account_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Chủ tài khoản</span>
              <span className="font-semibold">{bank.account_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Số tiền</span>
              <span className="font-semibold text-blue-700">{formatPrice(vndAmount)}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-gray-500">Nội dung</span>
              <span className="font-mono font-bold text-blue-700">{transferContent}</span>
            </div>
          </div>

          <div className="flex items-start gap-2 mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg p-3">
            <Info size={14} className="mt-0.5 shrink-0" />
            <p>Sau khi chuyển khoản, admin sẽ xác nhận và cộng credit cho bạn trong thời gian sớm nhất. Vui lòng ghi đúng nội dung chuyển khoản.</p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4 text-sm text-amber-800">
          Admin chưa thiết lập tài khoản ngân hàng. Vui lòng liên hệ hỗ trợ.
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="font-semibold text-gray-800 mb-3">Lịch sử giao dịch</p>
          <div className="space-y-2">
            {history.map(tx => (
              <div key={tx.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-gray-800">{tx.description}</p>
                  <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleString('vi-VN')}</p>
                </div>
                <span className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
