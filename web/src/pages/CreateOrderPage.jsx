import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../lib/api'

export default function CreateOrderPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    pickup_address: '',
    delivery_address: '',
    budget_price: '',
    note: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      const { data } = await api.post('/orders', form)
      navigate(`/orders/${data.id}`)
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {})
      }
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ label, name, type = 'text', placeholder, required = true, as = 'input' }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {!required && <span className="text-gray-400 font-normal">(tuỳ chọn)</span>}
      </label>
      {as === 'textarea' ? (
        <textarea
          rows={3}
          value={form[name]}
          onChange={set(name)}
          placeholder={placeholder}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
            errors[name] ? 'border-red-400' : 'border-gray-300'
          }`}
        />
      ) : (
        <input
          type={type}
          required={required}
          value={form[name]}
          onChange={set(name)}
          placeholder={placeholder}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors[name] ? 'border-red-400' : 'border-gray-300'
          }`}
        />
      )}
      {errors[name] && <p className="text-xs text-red-600 mt-1">{errors[name][0]}</p>}
    </div>
  )

  return (
    <div className="max-w-lg">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
      >
        <ArrowLeft size={16} /> Quay lại
      </button>

      <h2 className="text-xl font-bold text-gray-900 mb-5">Tạo đơn hàng</h2>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
        <Field label="Tiêu đề hàng hoá" name="title" placeholder="VD: Tài liệu A4, Đồ điện tử..." />
        <Field label="Mô tả" name="description" placeholder="Thông tin thêm về hàng hoá" as="textarea" required={false} />

        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Địa chỉ</p>
          <div className="flex flex-col gap-3">
            <Field label="Địa chỉ lấy hàng" name="pickup_address" placeholder="Số nhà, đường, quận..." />
            <Field label="Địa chỉ giao hàng" name="delivery_address" placeholder="Số nhà, đường, quận..." />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <Field
            label="Giá dự kiến (VND)"
            name="budget_price"
            type="number"
            placeholder="VD: 50000"
          />
        </div>

        <Field label="Ghi chú cho tài xế" name="note" placeholder="Hàng dễ vỡ, giao giờ hành chính..." as="textarea" required={false} />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors mt-2"
        >
          {loading ? 'Đang đăng...' : 'Đăng đơn hàng'}
        </button>
      </form>
    </div>
  )
}
