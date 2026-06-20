import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Zap, User, Phone, Lock } from 'lucide-react'
import styled, { keyframes } from 'styled-components'
import api from '../../../lib/api'
import { useAuth } from '../../../contexts/AuthContext'
import Spinner from '../../../components/Spinner'
import OrderInfo from './OrderInfo'
import PersonCard from './PersonCard'
import BidList from './BidList'
import BidForm from './BidForm'
import RatingSection from './RatingSection'

// ─── Styled Components ────────────────────────────────────

const BackBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #94A3B8;
  background: none;
  border: none;
  cursor: pointer;
  margin-bottom: 16px;
  transition: color 0.15s ease;
  &:hover { color: #F97316; }
`

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`

const RecipientLoading = styled.div`
  background: white;
  border: 1px solid #F1F5F9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  animation: ${pulse} 1.5s ease infinite;
`

const SkeletonLine = styled.div`
  height: 14px;
  background: #F1F5F9;
  border-radius: 4px;
  width: ${p => p.$w || '50%'};
  margin-bottom: ${p => p.$mb || '0'};
`

const RecipientLocked = styled.div`
  background: #F8FAFC;
  border: 1px solid #F1F5F9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #94A3B8;
`

const LockedText = styled.p`
  font-size: 13px;
`

const RecipientCard = styled.div`
  background: white;
  border: 1px solid #F1F5F9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`

const RecipientHeader = styled.p`
  font-size: 11px;
  font-weight: 600;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
`

const RecipientItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const RecipientRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const RecipientIconCircle = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${p => p.$bg};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${p => p.$color};
`

const RecipientName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #1E293B;
`

const RecipientPhone = styled.a`
  font-size: 13px;
  font-weight: 500;
  color: #7C3AED;
  &:hover { text-decoration: underline; }
`

const CancelRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
`

const CancelBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #EF4444;
  border: 1px solid #FECACA;
  padding: 8px 16px;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: background 0.15s ease;
  &:hover:not(:disabled) { background: #FEF2F2; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`

const DeliverBtn = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #16A34A;
  color: white;
  font-weight: 500;
  padding: 10px;
  border-radius: 12px;
  margin-bottom: 16px;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
  &:hover:not(:disabled) { background: #15803D; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const AcceptInstantBtn = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #F97316;
  color: white;
  font-weight: 600;
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 16px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s ease;
  &:hover:not(:disabled) { background: #EA580C; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

// ─── RecipientCard component ──────────────────────────────

function RecipientInfo({ orderId }) {
  const [recipient, setRecipient] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/orders/${orderId}/recipient`)
      .then(res => setRecipient(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) return (
    <RecipientLoading>
      <SkeletonLine $w="33%" $mb="8px" />
      <SkeletonLine $w="50%" />
    </RecipientLoading>
  )

  if (!recipient) return (
    <RecipientLocked>
      <Lock size={16} />
      <LockedText>Thông tin người nhận sẽ hiện khi đơn được chấp nhận</LockedText>
    </RecipientLocked>
  )

  return (
    <RecipientCard>
      <RecipientHeader>Người nhận</RecipientHeader>
      <RecipientItems>
        <RecipientRow>
          <RecipientIconCircle $bg="#F3E8FF" $color="#7C3AED">
            <User size={15} />
          </RecipientIconCircle>
          <RecipientName>{recipient.recipient_name}</RecipientName>
        </RecipientRow>
        <RecipientRow>
          <RecipientIconCircle $bg="#FAF5FF" $color="#8B5CF6">
            <Phone size={15} />
          </RecipientIconCircle>
          <RecipientPhone href={`tel:${recipient.recipient_phone}`}>
            {recipient.recipient_phone}
          </RecipientPhone>
        </RecipientRow>
      </RecipientItems>
    </RecipientCard>
  )
}

// ─── Page ─────────────────────────────────────────────────

export default function OrderDetailPage() {
  const { code } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchOrder = () => {
    api.get(`/orders/${code}`)
      .then(res => setOrder(res.data))
      .catch(() => navigate('/orders/mine'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrder() }, [code])

  if (loading) return <Spinner />
  if (!order) return null

  const isSender = order.sender_id === user.id
  const isDriver = order.driver_id === user.id
  const myBid = order.bids?.find(b => b.driver_id === user.id)
  const isInstant = order.order_type === 'instant'
  const canAcceptInstant = !isSender && isInstant && order.status === 'open' && user.driver_profile
  const driverAccepted = ['in_progress', 'delivered'].includes(order.status)

  const acceptBid = async (bidId) => {
    setActionLoading(true)
    try {
      const { data } = await api.post(`/orders/${code}/accept-bid/${bidId}`)
      setOrder(data)
    } finally {
      setActionLoading(false)
    }
  }

  const cancelOrder = async () => {
    if (!confirm('Bạn có chắc muốn hủy đơn này?')) return
    setActionLoading(true)
    try {
      const { data } = await api.post(`/orders/${code}/cancel`)
      setOrder(data)
    } finally {
      setActionLoading(false)
    }
  }

  const acceptInstant = async () => {
    setActionLoading(true)
    try {
      const { data } = await api.post(`/orders/${code}/accept`)
      setOrder(data)
    } finally {
      setActionLoading(false)
    }
  }

  const markDelivered = async () => {
    setActionLoading(true)
    try {
      const { data } = await api.post(`/orders/${code}/deliver`)
      setOrder(data)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div>
      <BackBtn onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Quay lại
      </BackBtn>

      <OrderInfo order={order} />

      {!isSender && order.sender && <PersonCard person={order.sender} role="sender" />}
      {isSender && order.driver && <PersonCard person={order.driver} role="driver" />}

      {(isSender || (isDriver && driverAccepted)) && <RecipientInfo orderId={code} />}

      {isSender && order.status === 'open' && (
        <CancelRow>
          <CancelBtn onClick={cancelOrder} disabled={actionLoading}>
            <XCircle size={15} /> Hủy đơn
          </CancelBtn>
        </CancelRow>
      )}

      {isDriver && order.status === 'in_progress' && (
        <DeliverBtn onClick={markDelivered} disabled={actionLoading}>
          <CheckCircle size={18} /> Xác nhận đã giao
        </DeliverBtn>
      )}

      <RatingSection
        orderId={code}
        rating={order.rating}
        isSender={isSender}
        isDriver={isDriver}
        orderStatus={order.status}
        onSuccess={fetchOrder}
      />

      {canAcceptInstant && (
        <AcceptInstantBtn onClick={acceptInstant} disabled={actionLoading}>
          <Zap size={18} /> Nhận đơn ngay
        </AcceptInstantBtn>
      )}

      {!isInstant && (
        <>
          <BidList
            bids={order.bids}
            isSender={isSender}
            orderStatus={order.status}
            onAccept={acceptBid}
            actionLoading={actionLoading}
          />
          {!isSender && user.driver_profile && order.status === 'open' && (
            <BidForm
              orderId={code}
              budgetPrice={order.budget_price}
              myBid={myBid}
              onSuccess={fetchOrder}
            />
          )}
        </>
      )}
    </div>
  )
}
