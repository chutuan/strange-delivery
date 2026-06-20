import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Package, Banknote, ClipboardList } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import StatusBadge from '../components/StatusBadge'

function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

function OrderPreview({ form, user }) {
  const hasContent = form.title || form.pickup_address || form.delivery_address || form.budget_price

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">Xem trước</p>

      {!hasContent ? (
        <p className="text-sm text-gray-300 text-center py-6">Điền form để xem trước đơn hàng</p>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-bold text-gray-900 text-base leading-snug">
              {form.title || <span className="text-gray-300 font-normal italic">Tiêu đề đơn hàng...</span>}
            </h3>
            <StatusBadge status="open" />
          </div>

          {form.description && (
            <p className="text-sm text-gray-500 mb-3">{form.description}</p>
          )}

          <div className="flex flex-col gap-2 text-sm mb-3">
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-green-600 mt-0.5 shrink-0" />
              <span className={form.pickup_address ? 'text-gray-700' : 'text-gray-300 italic'}>
                {form.pickup_address || 'Địa chỉ lấy hàng...'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-red-500 mt-0.5 shrink-0" />
              <span className={form.delivery_address ? 'text-gray-700' : 'text-gray-300 italic'}>
                {form.delivery_address || 'Địa chỉ giao đến...'}
              </span>
            </div>
          </div>

          {form.pickup_time && (
            <p className="text-xs text-amber-600 mb-2">
              🕒 Lấy hàng: {new Date(form.pickup_time).toLocaleString('vi-VN')}
            </p>
          )}

          {form.note && (
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3">
              📝 {form.note}
            </p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <span className="text-xs text-gray-400">Giá đăng</span>
              <p className="font-bold text-blue-700">
                {form.budget_price ? formatPrice(form.budget_price) : '—'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400">Người gửi</span>
              <p className="text-xs text-gray-600">{user?.name}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function FormField({ label, name, type = 'text', placeholder, required = true, as = 'input', value, error, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{' '}
        {!required && <span className="text-gray-400 font-normal">(tuỳ chọn)</span>}
      </label>
      {as === 'textarea' ? (
        <textarea
          rows={3}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
            error ? 'border-red-400' : 'border-gray-300'
          }`}
        />
      ) : (
        <input
          type={type}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-400' : 'border-gray-300'
          }`}
        />
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error[0]}</p>}
    </div>
  )
}

export default function CreateOrderPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState({
    title: '',
    description: '',
    pickup_address: '',
    delivery_address: '',
    budget_price: '',
    note: '',
    pickup_time: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

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

  return (
    <div className="max-w-4xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
      >
        <ArrowLeft size={16} /> Quay lại
      </button>

      <h2 className="text-xl font-bold text-gray-900 mb-5">Tạo đơn hàng</h2>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-5">

          {/* Hàng hoá */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package size={15} className="text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">Hàng hoá</span>
            </div>
            <div className="flex flex-col gap-3">
              <FormField
                label="Tiêu đề"
                name="title"
                value={form.title}
                error={errors.title}
                onChange={set('title')}
                placeholder="VD: Tài liệu A4, Đồ điện tử..."
              />
              <FormField
                label="Mô tả"
                name="description"
                as="textarea"
                required={false}
                value={form.description}
                error={errors.description}
                onChange={set('description')}
                placeholder="Thông tin thêm về hàng hoá, kích thước, trọng lượng..."
              />
            </div>
          </div>

          {/* Địa chỉ */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={15} className="text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">Địa chỉ</span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-green-600 mt-[30px] shrink-0" />
                <div className="flex-1">
                  <FormField
                    label="Lấy hàng tại"
                    name="pickup_address"
                    value={form.pickup_address}
                    error={errors.pickup_address}
                    onChange={set('pickup_address')}
                    placeholder="Số nhà, tên đường, quận..."
                  />
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-red-500 mt-[30px] shrink-0" />
                <div className="flex-1">
                  <FormField
                    label="Giao đến"
                    name="delivery_address"
                    value={form.delivery_address}
                    error={errors.delivery_address}
                    onChange={set('delivery_address')}
                    placeholder="Số nhà, tên đường, quận..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Giá & ghi chú */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Banknote size={15} className="text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">Giá & ghi chú</span>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <FormField
                  label="Giá dự kiến (VND)"
                  name="budget_price"
                  type="number"
                  value={form.budget_price}
                  error={errors.budget_price}
                  onChange={set('budget_price')}
                  placeholder="VD: 50000"
                />
                {Number(form.budget_price) > 0 && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">{formatPrice(form.budget_price)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giờ lấy hàng <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.pickup_time}
                  onChange={set('pickup_time')}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.pickup_time ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {errors.pickup_time && <p className="text-xs text-red-600 mt-1">{errors.pickup_time[0]}</p>}
              </div>
              <FormField
                label="Ghi chú cho tài xế"
                name="note"
                as="textarea"
                required={false}
                value={form.note}
                error={errors.note}
                onChange={set('note')}
                placeholder="Hàng dễ vỡ, giao trong giờ hành chính..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Đang đăng...' : 'Đăng đơn hàng'}
          </button>
        </form>

        {/* Preview */}
        <div className="lg:col-span-2 lg:sticky lg:top-4">
          <OrderPreview form={form} user={user} />
        </div>
      </div>
    </div>
  )
}
