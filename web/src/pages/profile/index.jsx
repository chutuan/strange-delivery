import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Truck, Star, Plus, Pencil, Trash2, Check } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { StarDisplay } from '../../components/StarRating'
import api from '../../lib/api'

const VEHICLE_LABEL = { motorbike: 'Xe máy', car: 'Ô tô', truck: 'Xe tải' }
const VEHICLE_TYPES = ['motorbike', 'car', 'truck']

const EMPTY_FORM = { vehicle_type: 'motorbike', license_plate: '' }

function VehicleForm({ initial = EMPTY_FORM, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSave = async () => {
    setErrors({})
    try {
      await onSave(form)
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors ?? {})
    }
  }

  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Loại phương tiện</label>
        <select
          value={form.vehicle_type}
          onChange={set('vehicle_type')}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
        >
          {VEHICLE_TYPES.map(t => (
            <option key={t} value={t}>{VEHICLE_LABEL[t]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Biển số xe</label>
        <input
          type="text"
          value={form.license_plate}
          onChange={set('license_plate')}
          placeholder="VD: 51F-123.45"
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 ${errors.license_plate ? 'border-red-400' : 'border-gray-200'}`}
        />
        {errors.license_plate && <p className="text-xs text-red-600 mt-1">{errors.license_plate[0]}</p>}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !form.license_plate.trim()}
          className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium py-2 rounded-lg transition-colors"
        >
          Huỷ
        </button>
      </div>
    </div>
  )
}

function VehicleCard({ vehicle, isOnly, onEdit, onDelete, onSetPrimary }) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${vehicle.is_primary ? 'opacity-100' : 'opacity-90'}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <Truck size={16} className={vehicle.is_primary ? 'text-blue-600 shrink-0' : 'text-gray-400 shrink-0'} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-gray-800">{VEHICLE_LABEL[vehicle.vehicle_type]}</span>
            {vehicle.is_primary && (
              <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.5 rounded-full">Chính</span>
            )}
          </div>
          <span className="text-xs font-mono text-gray-500">{vehicle.license_plate}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-2">
        {!vehicle.is_primary && (
          <button
            onClick={() => onSetPrimary(vehicle)}
            title="Đặt làm xe chính"
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Star size={14} />
          </button>
        )}
        <button
          onClick={() => onEdit(vehicle)}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Pencil size={14} />
        </button>
        {!isOnly && (
          <button
            onClick={() => onDelete(vehicle)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)

  const dp = user?.driver_profile
  const vehicles = dp?.vehicles ?? []

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    navigate('/login')
  }

  const handleAddVehicle = async (form) => {
    setSaving(true)
    try {
      await api.post('/driver/vehicles', form)
      await refreshUser()
      setShowAddForm(false)
    } finally {
      setSaving(false)
    }
  }

  const handleEditVehicle = async (form) => {
    setSaving(true)
    try {
      await api.put(`/driver/vehicles/${editingVehicle.id}`, form)
      await refreshUser()
      setEditingVehicle(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (vehicle) => {
    if (!confirm(`Xoá ${VEHICLE_LABEL[vehicle.vehicle_type]} - ${vehicle.license_plate}?`)) return
    await api.delete(`/driver/vehicles/${vehicle.id}`)
    await refreshUser()
  }

  const handleSetPrimary = async (vehicle) => {
    await api.post(`/driver/vehicles/${vehicle.id}/primary`)
    await refreshUser()
  }

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-bold text-gray-900 mb-5">Hồ sơ</h2>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
            <User size={28} className="text-blue-700" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            {user?.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
          </div>
        </div>
      </div>

      {dp ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-green-600" />
              <span className="font-semibold text-gray-800">Phương tiện</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <StarDisplay score={Math.round(dp.rating_avg)} size={14} />
                <span className="text-sm font-semibold">{Number(dp.rating_avg).toFixed(1)}</span>
                <span className="text-xs text-gray-400">({dp.rating_count})</span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {vehicles.map(v => (
              <div key={v.id}>
                {editingVehicle?.id === v.id ? (
                  <VehicleForm
                    initial={{ vehicle_type: v.vehicle_type, license_plate: v.license_plate }}
                    onSave={handleEditVehicle}
                    onCancel={() => setEditingVehicle(null)}
                    saving={saving}
                  />
                ) : (
                  <VehicleCard
                    vehicle={v}
                    isOnly={vehicles.length === 1}
                    onEdit={setEditingVehicle}
                    onDelete={handleDelete}
                    onSetPrimary={handleSetPrimary}
                  />
                )}
              </div>
            ))}
          </div>

          {showAddForm ? (
            <VehicleForm
              onSave={handleAddVehicle}
              onCancel={() => setShowAddForm(false)}
              saving={saving}
            />
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-3 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Plus size={15} />
              Thêm xe
            </button>
          )}

        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Truck size={18} className="text-blue-600" />
            <span className="font-semibold text-blue-800">Trở thành tài xế</span>
          </div>
          <p className="text-sm text-blue-700 mb-3">Đăng ký để nhận đơn và kiếm thêm thu nhập.</p>
          <button
            onClick={() => navigate('/driver/register')}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Đăng ký tài xế
          </button>
        </div>
      )}

      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-40"
      >
        {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
      </button>
    </div>
  )
}
