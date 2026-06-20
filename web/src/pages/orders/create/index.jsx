import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, MapPin, User, Banknote, StickyNote, ArrowDown, Bike, Car, Truck, Zap, ListFilter } from 'lucide-react'
import api from '../../../lib/api'
import FormSection from './FormSection'
import FormField from './FormField'

const VEHICLE_OPTIONS = [
  { value: 'motorbike', label: 'Xe máy', Icon: Bike },
  { value: 'car',       label: 'Ô tô',   Icon: Car },
  { value: 'truck',     label: 'Xe tải',  Icon: Truck },
]

const ORDER_TYPES = [
  {
    value: 'instant',
    label: 'Giao luôn',
    Icon: Zap,
    desc: 'Tài xế nhận ngay theo giá bạn đặt',
    color: 'border-amber-400 bg-amber-50 text-amber-700',
    inactive: 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300',
  },
  {
    value: 'bidding',
    label: 'Chọn tài xế',
    Icon: ListFilter,
    desc: 'Nhận báo giá, chọn tài xế phù hợp',
    color: 'border-blue-500 bg-blue-50 text-blue-700',
    inactive: 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300',
  },
]

export default function CreateOrderPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    pickup_address: '',
    delivery_address: '',
    recipient_name: '',
    recipient_phone: '',
    budget_price: '',
    vehicle_type: 'motorbike',
    order_type: 'instant',
    note: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const onChange = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

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

  const fieldProps = { form, errors, onChange }

  return (
    <div className="max-w-xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft size={15} /> Quay lại
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-1">Tạo đơn hàng</h2>
      <p className="text-sm text-gray-500 mb-6">Điền thông tin để đăng đơn cho tài xế nhận</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormSection icon={Package} color="bg-blue-50 text-blue-700" title="Thông tin hàng hoá">
          <FormField label="Tên hàng hoá" name="title" placeholder="VD: Tài liệu A4, Đồ điện tử..." {...fieldProps} />
          <FormField label="Mô tả thêm" name="description" placeholder="Kích thước, trọng lượng, lưu ý đặc biệt..." as="textarea" required={false} {...fieldProps} />
        </FormSection>

        <FormSection icon={MapPin} color="bg-green-50 text-green-700" title="Tuyến đường">
          <div className="flex gap-3">
            <div className="flex flex-col items-center pt-8 shrink-0">
              <div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-100" />
              <div className="w-0.5 h-8 bg-gray-200 my-1" />
              <ArrowDown size={14} className="text-gray-400 -my-1" />
              <div className="w-0.5 h-8 bg-gray-200 my-1" />
              <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-100" />
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <FormField label="Lấy hàng tại" name="pickup_address" placeholder="Số nhà, đường, phường, quận..." {...fieldProps} />
              <FormField label="Giao hàng đến" name="delivery_address" placeholder="Số nhà, đường, phường, quận..." {...fieldProps} />
            </div>
          </div>
        </FormSection>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Hình thức giao hàng</p>
          <div className="grid grid-cols-2 gap-3">
            {ORDER_TYPES.map(({ value, label, Icon, desc, color, inactive }) => {
              const active = form.order_type === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, order_type: value }))}
                  className={`flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all ${active ? color : inactive}`}
                >
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Icon size={16} />
                    {label}
                  </div>
                  <p className={`text-xs leading-snug ${active ? '' : 'text-gray-400'}`}>{desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        <FormSection icon={User} color="bg-purple-50 text-purple-700" title="Người nhận">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tên người nhận" name="recipient_name" placeholder="Nguyễn Văn A" {...fieldProps} />
            <FormField label="Số điện thoại" name="recipient_phone" type="tel" placeholder="0901 234 567" {...fieldProps} />
          </div>
        </FormSection>

        <FormSection icon={Banknote} color="bg-amber-50 text-amber-700" title="Giá & Ghi chú">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Loại phương tiện</label>
            <div className="grid grid-cols-3 gap-2">
              {VEHICLE_OPTIONS.map(({ value, label, Icon }) => {
                const active = form.vehicle_type === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, vehicle_type: value }))}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-medium transition-all ${
                      active
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-white'
                    }`}
                  >
                    <Icon size={20} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
          <FormField
            label={form.order_type === 'instant' ? 'Giá cố định (VND)' : 'Giá đề xuất (VND)'}
            name="budget_price"
            type="number"
            placeholder="50000"
            {...fieldProps}
          />
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Ghi chú cho tài xế <span className="normal-case text-gray-400 font-normal ml-1">(tuỳ chọn)</span>
            </label>
            <div className="relative">
              <StickyNote size={14} className="absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
              <textarea
                rows={2}
                value={form.note}
                onChange={onChange('note')}
                placeholder="Hàng dễ vỡ, giao giờ hành chính, gọi trước khi giao..."
                className="w-full border border-gray-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-shadow resize-none"
              />
            </div>
          </div>
        </FormSection>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang đăng...
            </>
          ) : 'Đăng đơn hàng'}
        </button>
      </form>
    </div>
  )
}
