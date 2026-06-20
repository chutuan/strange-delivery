import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Truck, Star, Plus, Pencil, Trash2 } from 'lucide-react'
import styled, { css } from 'styled-components'
import { useAuth } from '../../contexts/AuthContext'
import { StarDisplay } from '../../components/StarRating'
import api from '../../lib/api'
import { Select, ErrorText } from '../../styles/index'

const VEHICLE_LABEL = { motorbike: 'Xe máy', car: 'Ô tô', truck: 'Xe tải' }
const VEHICLE_TYPES = ['motorbike', 'car', 'truck']

const EMPTY_FORM = { vehicle_type: 'motorbike', license_plate: '' }

// ─── Styled Components ────────────────────────────────────

const PageTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #0F172A;
  margin-bottom: 20px;
`

const ProfileCard = styled.div`
  background: white;
  border: 1px solid #F1F5F9;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`

const ProfileRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const ProfileAvatar = styled.div`
  width: 56px;
  height: 56px;
  background: #FFEDD5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #F97316;
`

const ProfileName = styled.p`
  font-size: 17px;
  font-weight: 700;
  color: #0F172A;
`

const ProfileEmail = styled.p`
  font-size: 13px;
  color: #64748B;
`

const VehicleBox = styled.div`
  background: white;
  border: 1px solid #F1F5F9;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`

const VehicleHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`

const VehicleHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const VehicleTitle = styled.span`
  font-weight: 600;
  color: #1E293B;
`

const RatingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

const RatingNum = styled.span`
  font-size: 13px;
  font-weight: 600;
`

const RatingCount = styled.span`
  font-size: 11px;
  color: #94A3B8;
`

const VehicleDivider = styled.div`
  border-top: 1px solid #F8FAFC;
`

const VehicleItemRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  opacity: ${p => p.$isPrimary ? 1 : 0.9};
`

const VehicleInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`

const VehicleDetails = styled.div`
  min-width: 0;
`

const VehicleNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const VehicleTypeName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #1E293B;
`

const PrimaryBadge = styled.span`
  font-size: 10px;
  background: #FFF7ED;
  color: #EA580C;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 9999px;
`

const LicensePlate = styled.span`
  font-size: 11px;
  font-family: monospace;
  color: #64748B;
`

const VehicleActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  margin-left: 8px;
`

const IconBtn = styled.button`
  padding: 6px;
  border-radius: 8px;
  color: #94A3B8;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  ${p => p.$variant === 'star' && css`&:hover { color: #F97316; background: #FFF7ED; }`}
  ${p => p.$variant === 'edit' && css`&:hover { color: #374151; background: #F1F5F9; }`}
  ${p => p.$variant === 'delete' && css`&:hover { color: #EF4444; background: #FEF2F2; }`}
`

const VehicleFormWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #F1F5F9;
`

const FormLabel = styled.label`
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
`

const FormInput = styled.input`
  width: 100%;
  border: 1px solid ${p => p.$hasError ? '#F87171' : '#E2E8F0'};
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  background: white;
  outline: none;
  font-family: inherit;
  transition: all 0.15s ease;
  &:focus {
    border-color: #F97316;
    box-shadow: 0 0 0 3px rgba(249,115,22,0.15);
  }
  &::placeholder { color: #CBD5E1; }
`

const FormSelect = styled(Select)`
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
`

const FormBtnRow = styled.div`
  display: flex;
  gap: 8px;
`

const SaveBtn = styled.button`
  flex: 1;
  background: #F97316;
  color: white;
  font-size: 13px;
  font-weight: 500;
  padding: 8px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
  &:hover:not(:disabled) { background: #EA580C; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const CancelBtn = styled.button`
  flex: 1;
  border: 1px solid #E2E8F0;
  color: #475569;
  font-size: 13px;
  font-weight: 500;
  padding: 8px;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: background 0.15s ease;
  &:hover { background: #F8FAFC; }
`

const AddVehicleBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #F97316;
  background: none;
  border: none;
  cursor: pointer;
  margin-top: 12px;
  transition: color 0.15s ease;
  &:hover { color: #EA580C; }
`

const BecomeDriverBox = styled.div`
  background: #FFF7ED;
  border: 1px solid #FDBA74;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
`

const BecomeDriverRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`

const BecomeDriverTitle = styled.span`
  font-weight: 600;
  color: #92400E;
`

const BecomeDriverDesc = styled.p`
  font-size: 13px;
  color: #C2410C;
  margin-bottom: 12px;
`

const RegisterDriverBtn = styled.button`
  background: #F97316;
  color: white;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
  &:hover { background: #EA580C; }
`

const LogoutBtn = styled.button`
  width: 100%;
  border: 1px solid #FECACA;
  color: #EF4444;
  font-size: 13px;
  font-weight: 500;
  padding: 10px;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: background 0.15s ease;
  &:hover:not(:disabled) { background: #FEF2F2; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`

// ─── VehicleForm ──────────────────────────────────────────

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
    <VehicleFormWrap>
      <div>
        <FormLabel>Loại phương tiện</FormLabel>
        <FormSelect
          value={form.vehicle_type}
          onChange={set('vehicle_type')}
        >
          {VEHICLE_TYPES.map(t => (
            <option key={t} value={t}>{VEHICLE_LABEL[t]}</option>
          ))}
        </FormSelect>
      </div>
      <div>
        <FormLabel>Biển số xe</FormLabel>
        <FormInput
          type="text"
          value={form.license_plate}
          onChange={set('license_plate')}
          placeholder="VD: 51F-123.45"
          $hasError={!!errors.license_plate}
        />
        {errors.license_plate && <ErrorText>{errors.license_plate[0]}</ErrorText>}
      </div>
      <FormBtnRow>
        <SaveBtn
          onClick={handleSave}
          disabled={saving || !form.license_plate.trim()}
        >
          {saving ? 'Đang lưu...' : 'Lưu'}
        </SaveBtn>
        <CancelBtn onClick={onCancel}>Huỷ</CancelBtn>
      </FormBtnRow>
    </VehicleFormWrap>
  )
}

// ─── VehicleCard ──────────────────────────────────────────

function VehicleCard({ vehicle, isOnly, onEdit, onDelete, onSetPrimary }) {
  return (
    <VehicleItemRow $isPrimary={vehicle.is_primary}>
      <VehicleInfo>
        <Truck size={16} style={{ color: vehicle.is_primary ? '#F97316' : '#94A3B8', flexShrink: 0 }} />
        <VehicleDetails>
          <VehicleNameRow>
            <VehicleTypeName>{VEHICLE_LABEL[vehicle.vehicle_type]}</VehicleTypeName>
            {vehicle.is_primary && <PrimaryBadge>Chính</PrimaryBadge>}
          </VehicleNameRow>
          <LicensePlate>{vehicle.license_plate}</LicensePlate>
        </VehicleDetails>
      </VehicleInfo>
      <VehicleActions>
        {!vehicle.is_primary && (
          <IconBtn
            onClick={() => onSetPrimary(vehicle)}
            title="Đặt làm xe chính"
            $variant="star"
          >
            <Star size={14} />
          </IconBtn>
        )}
        <IconBtn onClick={() => onEdit(vehicle)} $variant="edit">
          <Pencil size={14} />
        </IconBtn>
        {!isOnly && (
          <IconBtn onClick={() => onDelete(vehicle)} $variant="delete">
            <Trash2 size={14} />
          </IconBtn>
        )}
      </VehicleActions>
    </VehicleItemRow>
  )
}

// ─── Page ─────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, role, refreshUser, logout } = useAuth()
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
    <div>
      <PageTitle>Hồ sơ</PageTitle>

      <ProfileCard>
        <ProfileRow>
          <ProfileAvatar>
            <User size={28} />
          </ProfileAvatar>
          <div>
            <ProfileName>{user?.name}</ProfileName>
            <ProfileEmail>{user?.email}</ProfileEmail>
            {user?.phone && <ProfileEmail>{user.phone}</ProfileEmail>}
          </div>
        </ProfileRow>
      </ProfileCard>

      {dp && role === 'driver' ? (
        <VehicleBox>
          <VehicleHeader>
            <VehicleHeaderLeft>
              <Truck size={18} style={{ color: '#16A34A' }} />
              <VehicleTitle>Phương tiện</VehicleTitle>
            </VehicleHeaderLeft>
            <RatingRow>
              <StarDisplay score={Math.round(dp.rating_avg)} size={14} />
              <RatingNum>{Number(dp.rating_avg).toFixed(1)}</RatingNum>
              <RatingCount>({dp.rating_count})</RatingCount>
            </RatingRow>
          </VehicleHeader>

          <VehicleDivider>
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
          </VehicleDivider>

          {showAddForm ? (
            <VehicleForm
              onSave={handleAddVehicle}
              onCancel={() => setShowAddForm(false)}
              saving={saving}
            />
          ) : (
            <AddVehicleBtn onClick={() => setShowAddForm(true)}>
              <Plus size={15} />
              Thêm xe
            </AddVehicleBtn>
          )}
        </VehicleBox>
      ) : (
        <BecomeDriverBox>
          <BecomeDriverRow>
            <Truck size={18} style={{ color: '#F97316' }} />
            <BecomeDriverTitle>Trở thành tài xế</BecomeDriverTitle>
          </BecomeDriverRow>
          <BecomeDriverDesc>Đăng ký để nhận đơn và kiếm thêm thu nhập.</BecomeDriverDesc>
          <RegisterDriverBtn onClick={() => navigate('/driver/register')}>
            Đăng ký tài xế
          </RegisterDriverBtn>
        </BecomeDriverBox>
      )}

      <LogoutBtn onClick={handleLogout} disabled={loggingOut}>
        {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
      </LogoutBtn>
    </div>
  )
}
