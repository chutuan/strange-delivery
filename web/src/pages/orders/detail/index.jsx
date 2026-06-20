import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Zap, User, Phone, Lock, Camera, X } from 'lucide-react'
import styled, { keyframes } from 'styled-components'
import api from '../../../lib/api'
import { useAuth } from '../../../contexts/AuthContext'
import Spinner from '../../../components/Spinner'
import OrderInfo from './OrderInfo'
import PersonCard from './PersonCard'
import BidList from './BidList'
import BidForm from './BidForm'
import RatingSection from './RatingSection'
import DriverProfileModal from '../../../components/DriverProfileModal'

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
  border: 1px solid #E5E7EB;
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
  border: 1px solid #E5E7EB;
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
  border: 1px solid #E5E7EB;
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
  color: #EA580C;
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

const DeliverCard = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`

const DeliverLabel = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 10px;
`

const Optional = styled.span`
  font-weight: 400;
  color: #94A3B8;
  margin-left: 4px;
`

const PhotoPickBtn = styled.label`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  background: #F8FAFC;
  border: 1px dashed #CBD5E1;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  &:hover { border-color: #FDBA74; color: #EA580C; }
`

const PreviewWrap = styled.div`
  position: relative;
  margin-bottom: 12px;
`

const PreviewImg = styled.img`
  max-height: 200px;
  max-width: 100%;
  border-radius: 10px;
  border: 1px solid #E5E7EB;
  display: block;
`

const RemovePreview = styled.button`
  position: absolute;
  top: 8px;
  left: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(15,23,42,0.65);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`

const ProofCard = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`

const ProofLabel = styled.p`
  font-size: 11px;
  font-weight: 600;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
`

const ProofImg = styled.img`
  width: 100%;
  max-height: 360px;
  object-fit: contain;
  border-radius: 10px;
  border: 1px solid #E5E7EB;
  background: #F8FAFC;
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
          <RecipientIconCircle $bg="#FFEDD5" $color="#F97316">
            <User size={15} />
          </RecipientIconCircle>
          <RecipientName>{recipient.recipient_name}</RecipientName>
        </RecipientRow>
        <RecipientRow>
          <RecipientIconCircle $bg="#FFF7ED" $color="#EA580C">
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
  const [profileDriverId, setProfileDriverId] = useState(null)
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)

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
  const myBid = order.my_bid
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

  const onPickProof = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProofFile(file)
    setProofPreview(URL.createObjectURL(file))
  }

  const clearProof = () => {
    setProofFile(null)
    setProofPreview(null)
  }

  const markDelivered = async () => {
    setActionLoading(true)
    try {
      const fd = new FormData()
      if (proofFile) fd.append('photo', proofFile)
      const { data } = await api.post(`/orders/${code}/deliver`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setOrder(data)
      clearProof()
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
      {isSender && order.driver && <PersonCard person={order.driver} role="driver" onClick={() => setProfileDriverId(order.driver.id)} />}

      {(isSender || (isDriver && driverAccepted)) && <RecipientInfo orderId={code} />}

      {order.status === 'delivered' && order.proof_photo && (
        <ProofCard>
          <ProofLabel>Ảnh giao hàng</ProofLabel>
          <ProofImg src={`${import.meta.env.VITE_API_URL}/track/${order.order_code}/proof`} alt="Ảnh giao hàng" />
        </ProofCard>
      )}

      {isSender && order.status === 'open' && (
        <CancelRow>
          <CancelBtn onClick={cancelOrder} disabled={actionLoading}>
            <XCircle size={15} /> Hủy đơn
          </CancelBtn>
        </CancelRow>
      )}

      {isDriver && order.status === 'in_progress' && (
        <DeliverCard>
          <DeliverLabel>Ảnh giao hàng <Optional>(tuỳ chọn)</Optional></DeliverLabel>
          {proofPreview ? (
            <PreviewWrap>
              <PreviewImg src={proofPreview} alt="preview" />
              <RemovePreview type="button" onClick={clearProof}><X size={14} /></RemovePreview>
            </PreviewWrap>
          ) : (
            <PhotoPickBtn>
              <Camera size={16} /> Chụp / chọn ảnh giao hàng
              <input type="file" accept="image/*" hidden onChange={onPickProof} />
            </PhotoPickBtn>
          )}
          <DeliverBtn onClick={markDelivered} disabled={actionLoading} style={{ marginBottom: 0 }}>
            <CheckCircle size={18} /> Xác nhận đã giao
          </DeliverBtn>
        </DeliverCard>
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
            onShowDriver={setProfileDriverId}
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

      {profileDriverId && (
        <DriverProfileModal driverId={profileDriverId} onClose={() => setProfileDriverId(null)} />
      )}
    </div>
  )
}
