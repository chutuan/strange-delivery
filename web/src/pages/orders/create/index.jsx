import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, MapPin, User, Banknote, StickyNote, ArrowDown, Bike, Car, Truck, Zap, ListFilter } from 'lucide-react'
import styled, { keyframes, css } from 'styled-components'
import api from '../../../lib/api'
import FormSection from './FormSection'
import FormField from './FormField'
import { ErrorText } from '../../../styles/index'

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
    activeBg: '#FFFBEB', activeBorder: '#FCD34D', activeColor: '#92400E',
  },
  {
    value: 'bidding',
    label: 'Chọn tài xế',
    Icon: ListFilter,
    desc: 'Nhận báo giá, chọn tài xế phù hợp',
    activeBg: '#FFF7ED', activeBorder: '#F97316', activeColor: '#C2410C',
  },
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

const OrderTypeLabel = styled.p`
  font-size: 11px;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
`

const OrderTypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`

const OrderTypeBtn = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 16px;
  border-radius: 12px;
  border: 2px solid;
  text-align: left;
  transition: all 0.15s ease;
  cursor: pointer;
  ${p => p.$active ? css`
    background: ${p.$activeBg};
    border-color: ${p.$activeBorder};
    color: ${p.$activeColor};
  ` : css`
    background: white;
    border-color: #E2E8F0;
    color: #64748B;
    &:hover { border-color: #CBD5E1; }
  `}
`

const OrderTypeBtnTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 13px;
`

const OrderTypeBtnDesc = styled.p`
  font-size: 11px;
  line-height: 1.4;
  color: ${p => p.$active ? 'inherit' : '#94A3B8'};
`

const VehicleLabel = styled.label`
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
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
  border-radius: 12px;
  border: 1px solid;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;
  cursor: pointer;
  ${p => p.$active ? css`
    border-color: #F97316;
    background: #F97316;
    color: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  ` : css`
    border-color: #E2E8F0;
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

const NoteLabel = styled.label`
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
`

const NoteOptional = styled.span`
  text-transform: none;
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
  border: 1px solid #E2E8F0;
  background: white;
  border-radius: 12px;
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
  padding: 12px;
  border-radius: 12px;
  font-size: 13px;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 1px 3px rgba(249,115,22,0.3);
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
    <div>
      <BackBtn onClick={() => navigate(-1)}>
        <ArrowLeft size={15} /> Quay lại
      </BackBtn>

      <PageTitle>Tạo đơn hàng</PageTitle>
      <PageSub>Điền thông tin để đăng đơn cho tài xế nhận</PageSub>

      <Form onSubmit={handleSubmit}>
        <FormSection icon={Package} color="bg-orange-50 text-orange-700" title="Thông tin hàng hoá">
          <FormField label="Tên hàng hoá" name="title" placeholder="VD: Tài liệu A4, Đồ điện tử..." {...fieldProps} />
          <FormField label="Mô tả thêm" name="description" placeholder="Kích thước, trọng lượng, lưu ý đặc biệt..." as="textarea" required={false} {...fieldProps} />
        </FormSection>

        <FormSection icon={MapPin} color="bg-green-50 text-green-700" title="Tuyến đường">
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

        <div>
          <OrderTypeLabel>Hình thức giao hàng</OrderTypeLabel>
          <OrderTypeGrid>
            {ORDER_TYPES.map(({ value, label, Icon, desc, activeBg, activeBorder, activeColor }) => {
              const active = form.order_type === value
              return (
                <OrderTypeBtn
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, order_type: value }))}
                  $active={active}
                  $activeBg={activeBg}
                  $activeBorder={activeBorder}
                  $activeColor={activeColor}
                >
                  <OrderTypeBtnTitle>
                    <Icon size={16} />
                    {label}
                  </OrderTypeBtnTitle>
                  <OrderTypeBtnDesc $active={active}>{desc}</OrderTypeBtnDesc>
                </OrderTypeBtn>
              )
            })}
          </OrderTypeGrid>
        </div>

        <FormSection icon={User} color="bg-purple-50 text-purple-700" title="Người nhận">
          <GridTwo>
            <FormField label="Tên người nhận" name="recipient_name" placeholder="Nguyễn Văn A" {...fieldProps} />
            <FormField label="Số điện thoại" name="recipient_phone" type="tel" placeholder="0901 234 567" {...fieldProps} />
          </GridTwo>
        </FormSection>

        <FormSection icon={Banknote} color="bg-amber-50 text-amber-700" title="Giá & Ghi chú">
          <div>
            <VehicleLabel>Loại phương tiện</VehicleLabel>
            <VehicleGrid>
              {VEHICLE_OPTIONS.map(({ value, label, Icon }) => {
                const active = form.vehicle_type === value
                return (
                  <VehicleBtn
                    key={value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, vehicle_type: value }))}
                    $active={active}
                  >
                    <Icon size={20} />
                    {label}
                  </VehicleBtn>
                )
              })}
            </VehicleGrid>
          </div>
          <FormField
            label={form.order_type === 'instant' ? 'Giá cố định (VND)' : 'Giá đề xuất (VND)'}
            name="budget_price"
            type="number"
            placeholder="50000"
            {...fieldProps}
          />
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
        </FormSection>

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
