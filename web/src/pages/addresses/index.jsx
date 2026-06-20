import { useEffect, useState } from 'react'
import { MapPin, Plus, Pencil, Trash2, Star, Check, X } from 'lucide-react'
import styled from 'styled-components'
import api from '../../lib/api'
import Spinner from '../../components/Spinner'
import {
  PageTitle, PageSubtitle, Button, ButtonOutline, Input, Textarea, Label, FormGroup,
  EmptyStateWrapper, EmptyIcon,
} from '../../styles/index'

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
`

const FormCard = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(16,24,40,0.04);
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`

const CheckRow = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  user-select: none;
`

const Actions = styled.div`
  display: flex;
  gap: 8px;
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const Item = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(16,24,40,0.04);
  display: flex;
  align-items: flex-start;
  gap: 12px;
`

const Pin = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #FFF7ED;
  color: #F97316;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

const ItemBody = styled.div`
  flex: 1;
  min-width: 0;
`

const ItemTop = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`

const ItemLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
`

const DefaultBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 600;
  color: #C2410C;
  background: #FFF7ED;
  border-radius: 9999px;
  padding: 2px 8px;
`

const ItemAddr = styled.p`
  font-size: 13px;
  color: #475569;
  margin-top: 3px;
  line-height: 1.45;
`

const ItemRecipient = styled.p`
  font-size: 12px;
  color: #94A3B8;
  margin-top: 3px;
`

const ItemActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`

const IconBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${p => p.$danger ? '#EF4444' : '#64748B'};
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  &:hover { background: ${p => p.$danger ? '#FEF2F2' : '#F1F5F9'}; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`

const EMPTY_FORM = { label: '', address: '', recipient_name: '', recipient_phone: '', is_default: false }

export default function AddressesPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(null) // null = closed; object = add/edit
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const fetchAll = () => {
    setLoading(true)
    api.get('/addresses').then(res => setItems(res.data ?? [])).finally(() => setLoading(false))
  }
  useEffect(() => { fetchAll() }, [])

  const openAdd = () => setForm({ ...EMPTY_FORM })
  const openEdit = (a) => setForm({ ...a })

  const change = (field) => (e) => {
    const val = field === 'is_default' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [field]: val }))
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (form.id) await api.put(`/addresses/${form.id}`, form)
      else await api.post('/addresses', form)
      setForm(null)
      fetchAll()
    } finally {
      setSaving(false)
    }
  }

  const remove = async (a) => {
    if (!confirm(`Xoá địa chỉ "${a.label}"?`)) return
    setBusyId(a.id)
    try { await api.delete(`/addresses/${a.id}`); fetchAll() }
    finally { setBusyId(null) }
  }

  const setDefault = async (a) => {
    setBusyId(a.id)
    try { await api.put(`/addresses/${a.id}`, { ...a, is_default: true }); fetchAll() }
    finally { setBusyId(null) }
  }

  return (
    <div>
      <Header>
        <div>
          <PageTitle>Sổ địa chỉ</PageTitle>
          <PageSubtitle>Lưu địa chỉ thường dùng để tạo đơn nhanh hơn</PageSubtitle>
        </div>
        {!form && <Button onClick={openAdd}><Plus size={16} /> Thêm địa chỉ</Button>}
      </Header>

      {form && (
        <FormCard as="form" onSubmit={save}>
          <FormGroup>
            <Label>Nhãn</Label>
            <Input value={form.label} onChange={change('label')} placeholder="VD: Nhà, Công ty, Kho hàng" required maxLength={50} />
          </FormGroup>
          <FormGroup>
            <Label>Địa chỉ</Label>
            <Textarea rows={2} value={form.address} onChange={change('address')} placeholder="Số nhà, đường, phường, quận, thành phố..." required />
          </FormGroup>
          <Grid2>
            <FormGroup>
              <Label>Tên người nhận <span style={{ color: '#94A3B8', fontWeight: 400 }}>(tuỳ chọn)</span></Label>
              <Input value={form.recipient_name ?? ''} onChange={change('recipient_name')} placeholder="Nguyễn Văn A" />
            </FormGroup>
            <FormGroup>
              <Label>Số điện thoại <span style={{ color: '#94A3B8', fontWeight: 400 }}>(tuỳ chọn)</span></Label>
              <Input value={form.recipient_phone ?? ''} onChange={change('recipient_phone')} placeholder="0901 234 567" />
            </FormGroup>
          </Grid2>
          <CheckRow>
            <input type="checkbox" checked={!!form.is_default} onChange={change('is_default')} />
            Đặt làm địa chỉ mặc định
          </CheckRow>
          <Actions>
            <Button type="submit" disabled={saving}>
              <Check size={16} /> {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
            <ButtonOutline type="button" onClick={() => setForm(null)}><X size={16} /> Huỷ</ButtonOutline>
          </Actions>
        </FormCard>
      )}

      {loading ? (
        <Spinner />
      ) : items.length === 0 && !form ? (
        <EmptyStateWrapper>
          <EmptyIcon><MapPin size={26} /></EmptyIcon>
          <p>Chưa có địa chỉ nào được lưu</p>
        </EmptyStateWrapper>
      ) : (
        <List>
          {items.map(a => (
            <Item key={a.id}>
              <Pin><MapPin size={18} /></Pin>
              <ItemBody>
                <ItemTop>
                  <ItemLabel>{a.label}</ItemLabel>
                  {a.is_default && <DefaultBadge><Star size={11} style={{ fill: '#F97316', color: '#F97316' }} /> Mặc định</DefaultBadge>}
                </ItemTop>
                <ItemAddr>{a.address}</ItemAddr>
                {(a.recipient_name || a.recipient_phone) && (
                  <ItemRecipient>{[a.recipient_name, a.recipient_phone].filter(Boolean).join(' · ')}</ItemRecipient>
                )}
              </ItemBody>
              <ItemActions>
                {!a.is_default && (
                  <IconBtn onClick={() => setDefault(a)} disabled={busyId === a.id} title="Đặt mặc định">
                    <Star size={16} />
                  </IconBtn>
                )}
                <IconBtn onClick={() => openEdit(a)} title="Sửa"><Pencil size={16} /></IconBtn>
                <IconBtn $danger onClick={() => remove(a)} disabled={busyId === a.id} title="Xoá"><Trash2 size={16} /></IconBtn>
              </ItemActions>
            </Item>
          ))}
        </List>
      )}
    </div>
  )
}
