import { User, CheckCircle, BadgeCheck } from 'lucide-react'
import styled, { css } from 'styled-components'
import StatusBadge from '../../../components/StatusBadge'
import { formatPrice } from '../../../lib/format'

const ListBox = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`

const ListTitle = styled.h3`
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 12px;
`

const BidItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const BidRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid;
  ${p => p.$accepted ? css`
    border-color: #A7F3D0;
    background: #ECFDF5;
  ` : css`
    border-color: #F1F5F9;
    background: #FFF7ED;
  `}
`

const BidAvatar = styled.div`
  width: 32px;
  height: 32px;
  background: #FFEDD5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #F97316;
  ${p => p.$clickable && css`
    cursor: pointer;
    transition: filter 0.15s ease;
    &:hover { filter: brightness(0.94); }
  `}
`

const BidInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const BidHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const BidDriverName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #1E293B;
  ${p => p.$clickable && css`
    cursor: pointer;
    &:hover { color: #EA580C; text-decoration: underline; }
  `}
`

const BidPrice = styled.p`
  color: #F97316;
  font-weight: 700;
  font-size: 13px;
  margin-top: 2px;
`

const BidNote = styled.p`
  font-size: 11px;
  color: #64748B;
  margin-top: 2px;
`

const AcceptBtn = styled.button`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  background: #F97316;
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
  &:hover:not(:disabled) { background: #EA580C; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`

export default function BidList({ bids, isSender, orderStatus, onAccept, actionLoading, onShowDriver }) {
  if (!bids?.length) return null

  return (
    <ListBox>
      <ListTitle>{bids.length} Báo giá</ListTitle>
      <BidItems>
        {bids.map(bid => (
          <BidRow key={bid.id} $accepted={bid.status === 'accepted'}>
            <BidAvatar $clickable={!!onShowDriver} onClick={() => onShowDriver?.(bid.driver_id)}>
              <User size={15} />
            </BidAvatar>
            <BidInfo>
              <BidHeader>
                <BidDriverName $clickable={!!onShowDriver} onClick={() => onShowDriver?.(bid.driver_id)}>{bid.driver?.name}</BidDriverName>
                {bid.driver?.driver_profile?.is_verified && (
                  <BadgeCheck size={14} style={{ color: '#059669', flexShrink: 0 }} aria-label="Đã xác minh" />
                )}
                <StatusBadge status={bid.status} />
              </BidHeader>
              <BidPrice>{formatPrice(bid.price)}</BidPrice>
              {bid.note && <BidNote>{bid.note}</BidNote>}
            </BidInfo>
            {isSender && orderStatus === 'open' && bid.status === 'pending' && (
              <AcceptBtn
                onClick={() => onAccept(bid.id)}
                disabled={actionLoading}
              >
                <CheckCircle size={13} /> Chọn
              </AcceptBtn>
            )}
          </BidRow>
        ))}
      </BidItems>
    </ListBox>
  )
}
