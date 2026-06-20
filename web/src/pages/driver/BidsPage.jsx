import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ClipboardList, CheckCircle2, XCircle, Clock } from 'lucide-react'
import styled, { css } from 'styled-components'
import api from '../../lib/api'
import { formatPrice, formatDateTime } from '../../lib/format'
import Spinner from '../../components/Spinner'
import Pagination from '../../components/Pagination'

const FILTERS = [
  { key: '', label: 'Tất cả' },
  { key: 'pending', label: 'Đang chờ' },
  { key: 'accepted', label: 'Được chọn' },
  { key: 'rejected', label: 'Bị từ chối' },
]

const BID_STATUS = {
  pending:  { label: 'Đang chờ',   icon: Clock,        bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  accepted: { label: 'Được chọn',  icon: CheckCircle2, bg: '#ECFDF5', color: '#15803D', border: '#A7F3D0' },
  rejected: { label: 'Bị từ chối', icon: XCircle,      bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
}

const ORDER_STATUS_LABEL = {
  open:        'Đang mở',
  in_progress: 'Đang giao',
  delivered:   'Đã giao',
  cancelled:   'Đã huỷ',
}

// ─── Styled Components ────────────────────────────────────

const PageHeader = styled.div`
  margin-bottom: 20px;
`

const PageTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #0F172A;
`

const PageSub = styled.p`
  font-size: 13px;
  color: #94A3B8;
  margin-top: 2px;
`

const FilterRow = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`

const FilterPill = styled.button`
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.15s ease;
  ${p => p.$active ? css`
    background: #F97316;
    color: white;
    border-color: #F97316;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  ` : css`
    background: white;
    color: #475569;
    border-color: #E2E8F0;
    &:hover { border-color: #FDBA74; color: #EA580C; }
  `}
`

const BidList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
`

const BidLink = styled(Link)`
  background: white;
  border: 1px solid #F1F5F9;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 12px;
  text-decoration: none;
  transition: box-shadow 0.15s ease;
  &:hover { box-shadow: 0 2px 4px rgba(0,0,0,0.06); }
`

const BidStatusIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid ${p => p.$border};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${p => p.$bg};
  color: ${p => p.$color};
`

const BidContent = styled.div`
  flex: 1;
  min-width: 0;
`

const BidTopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
`

const BidOrderTitle = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: #1E293B;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const BidStatusLabel = styled.span`
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 9999px;
  border: 1px solid ${p => p.$border};
  background: ${p => p.$bg};
  color: ${p => p.$color};
  white-space: nowrap;
  flex-shrink: 0;
`

const RouteRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #94A3B8;
  margin-bottom: 8px;
`

const RouteText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const BidFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`

const BidPrice = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: #EA580C;
`

const FinalPriceText = styled.span`
  font-size: 11px;
  color: #94A3B8;
`

const BidDate = styled.span`
  font-size: 11px;
  color: #94A3B8;
  margin-left: auto;
`

const BidNote = styled.p`
  font-size: 11px;
  color: #94A3B8;
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 6px;
`

const OrderStatusText = styled.div`
  margin-top: 8px;
  font-size: 11px;
  color: #94A3B8;
`

const BidChevron = styled.span`
  color: #CBD5E1;
  flex-shrink: 0;
  align-self: center;
  transition: color 0.15s ease;
  ${BidLink}:hover & { color: #64748B; }
`

const EmptyWrap = styled.div`
  text-align: center;
  padding: 64px 0;
  color: #94A3B8;
`

const EmptyIcon = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
  opacity: 0.3;
`

const EmptyText = styled.p`
  font-size: 13px;
  font-weight: 500;
`

const EmptyLink = styled(Link)`
  display: inline-block;
  margin-top: 12px;
  font-size: 13px;
  color: #F97316;
  &:hover { text-decoration: underline; }
`

// ─── BidCard ──────────────────────────────────────────────

function BidCard({ bid }) {
  const order = bid.order
  const cfg = BID_STATUS[bid.status] ?? BID_STATUS.pending
  const Icon = cfg.icon

  return (
    <BidLink to={`/orders/${order?.order_code}`}>
      <BidStatusIcon $bg={cfg.bg} $color={cfg.color} $border={cfg.border}>
        <Icon size={17} />
      </BidStatusIcon>

      <BidContent>
        <BidTopRow>
          <BidOrderTitle>{order?.title}</BidOrderTitle>
          <BidStatusLabel $bg={cfg.bg} $color={cfg.color} $border={cfg.border}>
            {cfg.label}
          </BidStatusLabel>
        </BidTopRow>

        <RouteRow>
          <RouteText>{order?.pickup_address}</RouteText>
          <span>→</span>
          <RouteText>{order?.delivery_address}</RouteText>
        </RouteRow>

        <BidFooter>
          <BidPrice>{formatPrice(bid.price)}</BidPrice>
          {order?.final_price && bid.status === 'accepted' && (
            <FinalPriceText>
              Chốt: <strong style={{ color: '#374151' }}>{formatPrice(order.final_price)}</strong>
            </FinalPriceText>
          )}
          <BidDate>{formatDateTime(bid.created_at)}</BidDate>
        </BidFooter>

        {bid.note && (
          <BidNote>&ldquo;{bid.note}&rdquo;</BidNote>
        )}

        <OrderStatusText>
          Đơn: <span style={{ fontWeight: 500, color: '#475569' }}>{ORDER_STATUS_LABEL[order?.status] ?? order?.status}</span>
        </OrderStatusText>
      </BidContent>

      <BidChevron>
        <ChevronRight size={15} />
      </BidChevron>
    </BidLink>
  )
}

// ─── Page ─────────────────────────────────────────────────

export default function DriverBidsPage() {
  const [bids, setBids] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 })
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page })
    if (filter) params.set('status', filter)

    api.get(`/driver/bids?${params}`)
      .then(res => {
        setBids(res.data.data)
        setMeta({ current_page: res.data.current_page, last_page: res.data.last_page })
      })
      .finally(() => setLoading(false))
  }, [filter, page])

  const handleFilter = (key) => {
    if (key === filter) return
    setFilter(key)
    setPage(1)
  }

  return (
    <div>
      <PageHeader>
        <PageTitle>Lịch sử bid</PageTitle>
        <PageSub>Các đơn hàng bạn đã đặt giá</PageSub>
      </PageHeader>

      <FilterRow>
        {FILTERS.map(({ key, label }) => (
          <FilterPill
            key={key}
            onClick={() => handleFilter(key)}
            $active={filter === key}
          >
            {label}
          </FilterPill>
        ))}
      </FilterRow>

      {loading ? (
        <Spinner />
      ) : bids.length === 0 ? (
        <EmptyWrap>
          <EmptyIcon><ClipboardList size={40} /></EmptyIcon>
          <EmptyText>Chưa có bid nào</EmptyText>
          <EmptyLink to="/orders/open">Tìm đơn để bid →</EmptyLink>
        </EmptyWrap>
      ) : (
        <>
          <BidList>
            {bids.map(bid => <BidCard key={bid.id} bid={bid} />)}
          </BidList>
          <Pagination page={meta.current_page} lastPage={meta.last_page} onPage={setPage} />
        </>
      )}
    </div>
  )
}
