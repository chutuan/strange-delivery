import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import api from '../../../lib/api'
import { formatPrice } from '../../../lib/format'
import { Input, Textarea, Label, AlertError, Button } from '../../../styles/index'

const MyBidBox = styled.div`
  background: #FFF7ED;
  border: 1px solid #FDBA74;
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
`

const MyBidTitle = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: #92400E;
`

const MyBidPrice = styled.p`
  color: #F97316;
  font-weight: 700;
  margin-top: 4px;
`

const MyBidNote = styled.p`
  font-size: 11px;
  color: #475569;
  margin-top: 4px;
`

const FormBox = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 20px;
  margin-top: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`

const FormTitle = styled.h3`
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 12px;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const SubmitBtn = styled(Button)`
  align-self: flex-start;
  padding: 8px 20px;
`

export default function BidForm({ orderId, budgetPrice, myBid, onSuccess }) {
  const navigate = useNavigate()
  const [price, setPrice] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (myBid) {
    return (
      <MyBidBox>
        <MyBidTitle>Báo giá của bạn</MyBidTitle>
        <MyBidPrice>{formatPrice(myBid.price)}</MyBidPrice>
        {myBid.note && <MyBidNote>{myBid.note}</MyBidNote>}
      </MyBidBox>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post(`/orders/${orderId}/bids`, { price, note })
      setPrice('')
      setNote('')
      onSuccess()
    } catch (err) {
      const msg = err.response?.data?.message || ''
      if (msg.toLowerCase().includes('credit')) {
        navigate('/top-up', { state: { reason: msg } })
        return
      }
      setError(msg || 'Lỗi khi đặt giá.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormBox>
      <FormTitle>Báo giá</FormTitle>
      {error && <AlertError style={{ marginBottom: 12 }}>{error}</AlertError>}
      <Form onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="bid-price">Giá của bạn (VND)</Label>
          <Input
            id="bid-price"
            type="number"
            required
            min="0"
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder={`Giá đăng: ${formatPrice(budgetPrice)}`}
          />
        </div>
        <div>
          <Label htmlFor="bid-note">
            Ghi chú <span style={{ color: '#94A3B8', fontWeight: 400 }}>(tuỳ chọn)</span>
          </Label>
          <Textarea
            id="bid-note"
            rows={2}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Lý do báo giá, thời gian dự kiến..."
            style={{ resize: 'none' }}
          />
        </div>
        <SubmitBtn type="submit" disabled={loading}>
          {loading ? 'Đang gửi...' : 'Gửi báo giá'}
        </SubmitBtn>
      </Form>
    </FormBox>
  )
}
