import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, MapPin, User, Banknote, StickyNote, ArrowDown, Bike, Car, Truck, Zap, ListFilter, ChevronDown } from 'lucide-react'
import styled, { keyframes, css } from 'styled-components'
import api from '../../../lib/api'
import FormSection from './FormSection'
import FormField from './FormField'
import AddressPicker from './AddressPicker'

const VEHICLE_OPTIONS = [
  { value: 'motorbike', label: 'Xe máy', Icon: Bike },
  { value: 'car',       label: 'Ô tô',   Icon: Car },
  { value: 'truck',     label: 'Xe tải',  Icon: Truck },
]

const ORDER_TYPES = [
  { value: 'instant', label: 'Giao luôn', Icon: Zap, desc: 'Tài xế nhận ngay theo giá bạn đặt.' },
  { value: 'bidding', label: 'Đấu giá',   Icon: ListFilter, desc: 'Nhận báo giá rồi chọn tài xế phù hợp.' },
]

// ─── Styled Components ────────────────────────────────────

const BackBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748B;
  background: none;
  border: none;
  cursor: pointer;
  margin-bottom: 20px;
  transition: color 0.15s ease;
  &:hover { color: #1E293B; }
`

const PageTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0F172A;
  margin-bottom: 4px;
`

const PageSub = styled.p`
  font-size: 13px;
  color: #64748B;
  margin-bottom: 24px;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const QuickFill = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
`

const QuickFillLabel = styled.span`
  font-size: 12px;
  color: #94A3B8;
  margin-right: 2px;
`

const FieldLabel = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
`

// Compact segmented toggle for delivery type (replaces two large cards)
const TypeToggle = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  background: #F1F5F9;
  padding: 4px;
  border-radius: 10px;
`

const TypeToggleBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
  ${p => p.$active ? css`
    background: #FFFFFF;
    color: #C2410C;
    box-shadow: 0 1px 2px rgba(16,24,40,0.1);
  ` : css`
    background: transparent;
    color: #64748B;
    &:hover { color: #334155; }
  `}
`

const TypeHint = styled.p`
  font-size: 12px;
  color: #94A3B8;
  margin-top: 8px;
`

const VehicleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`

const VehicleBtn = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 0;
  border-radius: 10px;
  border: 1px solid;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;
  cursor: pointer;
  ${p => p.$active ? css`
    border-color: #F97316;
    background: #FFF7ED;
    color: #C2410C;
  ` : css`
    border-color: #E5E7EB;
    background: white;
    color: #64748B;
    &:hover { border-color: #CBD5E1; }
  `}
`

const RouteVisualWrap = styled.div`
  display: flex;
  gap: 12px;
`

const RouteLineWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 32px;
  flex-shrink: 0;
`

const DotGreen = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #22C55E;
  box-shadow: 0 0 0 4px #DCFCE7;
`

const RouteLineSegment = styled.div`
  width: 1px;
  height: 32px;
  background: #E2E8F0;
  margin: 4px 0;
`

const ArrowWrap = styled.div`
  color: #94A3B8;
  margin: -4px 0;
`

const DotRed = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #EF4444;
  box-shadow: 0 0 0 4px #FEE2E2;
`

const FieldsCol = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

// ─── Optional details (progressive disclosure) ────────────

const MoreToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.15s ease;
  &:hover { color: #F97316; }
  svg {
    transition: transform 0.2s ease;
    transform: rotate(${p => (p.$open ? '180deg' : '0deg')});
  }
`

const MoreContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 4px;
`

const NoteLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
`

const NoteOptional = styled.span`
  font-weight: 400;
  color: #94A3B8;
  margin-left: 4px;
`

const NoteWrap = styled.div`
  position: relative;
`

const NoteIcon = styled.span`
  position: absolute;
  left: 14px;
  top: 12px;
  color: #94A3B8;
  pointer-events: none;
  display: flex;
`

const NoteTextarea = styled.textarea`
  width: 100%;
  border: 1px solid #CBD5E1;
  background: white;
  border-radius: 10px;
  padding: 10px 14px 10px 36px;
  font-size: 13px;
  outline: none;
  resize: none;
  font-family: inherit;
  transition: all 0.15s ease;
  &:focus {
    border-color: #F97316;
    box-shadow: 0 0 0 3px rgba(249,115,22,0.15);
  }
  &::placeholder { color: #CBD5E1; }
`

const spin = keyframes`to { transform: rotate(360deg); }`

const SpinnerIcon = styled.span`
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
  display: inline-block;
`

const SubmitBtn = styled.button`
  width: 100%;
  background: #F97316;
  color: white;
  font-weight: 600;
  padding: 13px;
  border-radius: 10px;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 1px 2px rgba(249,115,22,0.3);
  &:hover:not(:disabled) { background: #EA580C; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`

const GridTwo = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`

// ─── Page ─────────────────────────────────────────────────

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
  const [showDetails, setShowDetails] = useState(false)
  const [addresses, setAddresses] = useState([])

  useEffect(() => {
    api.get('/addresses').then(r => setAddresses(r.data ?? [])).catch(() => {})
  }, [])

  const onChange = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const fillPickup = (a) => setForm(f => ({ ...f, pickup_address: a.address }))
  const fillDelivery = (a) => setForm(f => ({
    ...f,
    delivery_address: a.address,
    recipient_name: a.recipient_name || f.recipient_name,
    recipient_phone: a.recipient_phone || f.recipient_phone,
  }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      const { data } = await api.post('/orders', form)
      navigate(`/orders/${data.order_code ?? data.id}`)
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {})
        // Reveal optional fields if the error is on one of them
        if (err.response.data.errors?.description || err.response.data.errors?.note) {
          setShowDetails(true)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const fieldProps = { form, errors, onChange }
  const activeType = ORDER_TYPES.find(t => t.value === form.order_type)

  return (
    <div>
      <BackBtn onClick={() => navigate(-1)}>
        <ArrowLeft size={15} /> Quay lại
      </BackBtn>

      <PageTitle>Tạo đơn hàng</PageTitle>
      <PageSub>Chỉ vài bước để đăng đơn cho tài xế nhận</PageSub>

      <Form onSubmit={handleSubmit}>
        <FormSection icon={MapPin} title="Tuyến đường">
          {addresses.length > 0 && (
            <QuickFill>
              <QuickFillLabel>Điền nhanh:</QuickFillLabel>
              <AddressPicker addresses={addresses} label="Lấy hàng" onSelect={fillPickup} />
              <AddressPicker addresses={addresses} label="Giao đến" onSelect={fillDelivery} />
            </QuickFill>
          )}
          <RouteVisualWrap>
            <RouteLineWrap>
              <DotGreen />
              <RouteLineSegment />
              <ArrowWrap><ArrowDown size={14} /></ArrowWrap>
              <RouteLineSegment />
              <DotRed />
            </RouteLineWrap>
            <FieldsCol>
              <FormField label="Lấy hàng tại" name="pickup_address" placeholder="Số nhà, đường, phường, quận..." {...fieldProps} />
              <FormField label="Giao hàng đến" name="delivery_address" placeholder="Số nhà, đường, phường, quận..." {...fieldProps} />
            </FieldsCol>
          </RouteVisualWrap>
        </FormSection>

        <FormSection icon={Package} title="Hàng hoá">
          <FormField label="Tên hàng hoá" name="title" placeholder="VD: Tài liệu A4, Đồ điện tử..." {...fieldProps} />
        </FormSection>

        <FormSection icon={User} title="Người nhận">
          <GridTwo>
            <FormField label="Tên người nhận" name="recipient_name" placeholder="Nguyễn Văn A" {...fieldProps} />
            <FormField label="Số điện thoại" name="recipient_phone" type="tel" placeholder="0901 234 567" {...fieldProps} />
          </GridTwo>
        </FormSection>

        <FormSection icon={Banknote} title="Hình thức & Giá">
          <div>
            <FieldLabel>Hình thức giao hàng</FieldLabel>
            <TypeToggle>
              {ORDER_TYPES.map(({ value, label, Icon }) => (
                <TypeToggleBtn
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, order_type: value }))}
                  $active={form.order_type === value}
                >
                  <Icon size={15} />
                  {label}
                </TypeToggleBtn>
              ))}
            </TypeToggle>
            <TypeHint>{activeType?.desc}</TypeHint>
          </div>

          <div>
            <FieldLabel>Phương tiện</FieldLabel>
            <VehicleGrid>
              {VEHICLE_OPTIONS.map(({ value, label, Icon }) => (
                <VehicleBtn
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, vehicle_type: value }))}
                  $active={form.vehicle_type === value}
                >
                  <Icon size={20} />
                  {label}
                </VehicleBtn>
              ))}
            </VehicleGrid>
          </div>

          <FormField
            label={form.order_type === 'instant' ? 'Giá cố định (VND)' : 'Giá đề xuất (VND)'}
            name="budget_price"
            type="number"
            placeholder="50000"
            {...fieldProps}
          />
        </FormSection>

        <MoreToggle type="button" onClick={() => setShowDetails(s => !s)} $open={showDetails}>
          <ChevronDown size={16} />
          {showDetails ? 'Ẩn chi tiết' : 'Thêm chi tiết (tuỳ chọn)'}
        </MoreToggle>

        {showDetails && (
          <MoreContent>
            <FormField label="Mô tả hàng hoá" name="description" placeholder="Kích thước, trọng lượng, lưu ý đặc biệt..." as="textarea" required={false} {...fieldProps} />
            <div>
              <NoteLabel>
                Ghi chú cho tài xế <NoteOptional>(tuỳ chọn)</NoteOptional>
              </NoteLabel>
              <NoteWrap>
                <NoteIcon><StickyNote size={14} /></NoteIcon>
                <NoteTextarea
                  rows={2}
                  value={form.note}
                  onChange={onChange('note')}
                  placeholder="Hàng dễ vỡ, giao giờ hành chính, gọi trước khi giao..."
                />
              </NoteWrap>
            </div>
          </MoreContent>
        )}

        <SubmitBtn type="submit" disabled={loading}>
          {loading ? (
            <>
              <SpinnerIcon />
              Đang đăng...
            </>
          ) : 'Đăng đơn hàng'}
        </SubmitBtn>
      </Form>
    </div>
  )
}
