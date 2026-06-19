import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Truck } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

export default function DriverRegisterPage() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [form, setForm] = useState({ vehicle_type: 'motorbike', license_plate: '', id_card_number: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await api.post('/driver/register', form)
      await refreshUser()
      navigate('/profile')
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors ?? {})
      else setErrors({ general: err.response?.data?.message || 'Đăng ký thất bại.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors">
        <ArrowLeft size={16} /> Quay lại
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Truck size={20} className="text-blue-700" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Đăng ký tài xế</h2>
          <p className="text-sm text-gray-500">Điền thông tin phương tiện của bạn</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{errors.general}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Loại phương tiện</label>
          <select
            value={form.vehicle_type}
            onChange={set('vehicle_type')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="motorbike">Xe máy</option>
            <option value="car">Ô tô</option>
            <option value="truck">Xe tải</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Biển số xe</label>
          <input
            type="text"
            required
            value={form.license_plate}
            onChange={set('license_plate')}
            placeholder="VD: 51F-123.45"
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.license_plate ? 'border-red-400' : 'border-gray-300'}`}
          />
          {errors.license_plate && <p className="text-xs text-red-600 mt-1">{errors.license_plate[0]}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số CCCD <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
          </label>
          <input
            type="text"
            value={form.id_card_number}
            onChange={set('id_card_number')}
            placeholder="12 chữ số"
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.id_card_number ? 'border-red-400' : 'border-gray-300'}`}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors mt-2"
        >
          {loading ? 'Đang đăng ký...' : 'Hoàn tất đăng ký'}
        </button>
      </form>
    </div>
  )
}
