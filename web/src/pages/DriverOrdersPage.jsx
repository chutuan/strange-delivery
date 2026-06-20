import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Clock, Zap, ListFilter, PackageCheck, Loader2 } from 'lucide-react'
import styled, { css, keyframes } from 'styled-components'
import api from '../lib/api'
import { formatPrice } from '../lib/format'
import StatusBadge from '../components/StatusBadge'
import Spinner from '../components/Spinner'

const TABS = [
  { value: '',            label: 'Tất cả' },
  { value: 'in_progress', label: 'Đang giao' },
  { value: 'delivered',   label: 'Đã giao' },
  { value: 'cancelled',   label: 'Đã hủy' },
]

function timeAgo(dateStr) {
  if (!dateStr) return null
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)    return `${diff}s trước`
  if (diff < 3600)  return `${Math.floor(diff / 60)}p trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h trước`
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
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

const TabRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 4px;
  &::-webkit-scrollbar { display: none; }
`

const TabBtn = styled.button`
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  ${p => p.$active ? css`
    background: #F97316;
    color: white;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  ` : css`
    background: white;
    border: 1px solid #E2E8F0;
    color: #475569;
    &:hover { border-color: #CBD5E1; }
  `}
`

const OrderList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const CardLink = styled(Link)`
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(249,115,22,0.05);
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  text-decoration: none;
  transition: all 0.2s ease;
  &:hover {
    box-shadow: 0 4px 6px rgba(0,0,0,0.07);
    border-color: rgba(249,115,22,0.2);
  }
`

const TopStripe = styled.div`
  height: 4px;
  width: 100%;
  background: ${p => p.$color};
`

const CardInner = styled.div`
  padding: 16px;
`

const CardTopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
`

const CardLeft = styled.div`
  flex: 1;
  min-width: 0;
`

const OrderCode = styled.p`
  font-size: 11px;
  font-family: monospace;
  color: #94A3B8;
  margin-bottom: 4px;
`

const BadgesRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
`

const TypeTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 9999px;
  background: ${p => p.$bg};
  color: ${p => p.$color};
  border: 1px solid ${p => p.$border};
`

const OrderTitle = styled.h3`
  font-weight: 600;
  color: #0F172A;
  font-size: 13px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ChevronIcon = styled.span`
  color: #CBD5E1;
  flex-shrink: 0;
  margin-top: 4px;
  transition: color 0.15s ease;
  ${CardLink}:hover & { color: #FB923C; }
`

const RouteWrap = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
`

const RouteIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 4px;
  flex-shrink: 0;
`

const DotGreen = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22C55E;
  box-shadow: 0 0 0 3px #DCFCE7;
`

const RouteLine = styled.div`
  width: 1px;
  flex: 1;
  background: #E2E8F0;
  margin: 4px 0;
`

const DotRed = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #EF4444;
  box-shadow: 0 0 0 3px #FEE2E2;
`

const AddressCol = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
`

const AddressText = styled.p`
  font-size: 11px;
  color: #64748B;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #F8FAFC;
`

const CardPrice = styled.span`
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${p => p.$color};
`

const FooterRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const SenderAvatar = styled.span`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #F1F5F9;
  color: #64748B;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

const SenderName = styled.span`
  font-size: 11px;
  color: #94A3B8;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: none;
  @media (min-width: 640px) { display: block; }
`

const TimeText = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #94A3B8;
`

const EmptyWrap = styled.div`
  text-align: center;
  padding: 96px 0;
`

const EmptyIconBox = styled.div`
  width: 64px;
  height: 64px;
  background: #F1F5F9;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: #CBD5E1;
`

const EmptyTitle = styled.p`
  font-weight: 600;
  color: #64748B;
  margin-bottom: 4px;
`

const EmptyDesc = styled.p`
  font-size: 13px;
  color: #94A3B8;
`

const spin = keyframes`to { transform: rotate(360deg); }`

const LoadMoreBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #F97316;
  font-weight: 600;
  border: 1px solid #FDBA74;
  background: white;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s ease;
  margin: 20px auto 0;
  &:hover:not(:disabled) { background: #FFF7ED; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

// ─── OrderCard ────────────────────────────────────────────

function OrderCard({ order }) {
  const isInstant = order.order_type === 'instant'
  const price = order.final_price ?? order.budget_price
  const stripeColor =
    order.status === 'delivered' ? '#34D399' :
    order.status === 'cancelled' ? '#FCA5A5' : '#F97316'
  const priceColor =
    order.status === 'delivered' ? '#059669' : '#EA580C'

  return (
    <CardLink to={`/orders/${order.order_code}`}>
      <TopStripe $color={stripeColor} />
      <CardInner>
        <CardTopRow>
          <CardLeft>
            {order.order_code && (
              <OrderCode>#{order.order_code}</OrderCode>
            )}
            <BadgesRow>
              <StatusBadge status={order.status} />
              {isInstant ? (
                <TypeTag $bg="#FFFBEB" $color="#D97706" $border="#FDE68A">
                  <Zap size={10} strokeWidth={2.5} /> Giao luôn
                </TypeTag>
              ) : (
                <TypeTag $bg="#F5F3FF" $color="#7C3AED" $border="#DDD6FE">
                  <ListFilter size={10} strokeWidth={2.5} /> Đấu giá
                </TypeTag>
              )}
            </BadgesRow>
            <OrderTitle>{order.title}</OrderTitle>
          </CardLeft>
          <ChevronIcon>
            <ChevronRight size={16} />
          </ChevronIcon>
        </CardTopRow>

        <RouteWrap>
          <RouteIndicator>
            <DotGreen />
            <RouteLine />
            <DotRed />
          </RouteIndicator>
          <AddressCol>
            <AddressText>{order.pickup_address}</AddressText>
            <AddressText>{order.delivery_address}</AddressText>
          </AddressCol>
        </RouteWrap>

        <CardFooter>
          <CardPrice $color={priceColor}>{formatPrice(price)}</CardPrice>
          <FooterRight>
            {order.sender && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <SenderAvatar>{order.sender.name?.charAt(0).toUpperCase()}</SenderAvatar>
                <SenderName>{order.sender.name}</SenderName>
              </span>
            )}
            <TimeText>
              <Clock size={11} />
              {timeAgo(order.accepted_at ?? order.created_at)}
            </TimeText>
          </FooterRight>
        </CardFooter>
      </CardInner>
    </CardLink>
  )
}

// ─── Page ─────────────────────────────────────────────────

export default function DriverOrdersPage() {
  const [orders, setOrders]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [status, setStatus]           = useState('')
  const [page, setPage]               = useState(1)
  const [lastPage, setLastPage]       = useState(1)
  const [total, setTotal]             = useState(0)

  const fetchOrders = (p = 1, st = status) => {
    if (p === 1) { setLoading(true); setOrders([]) } else setLoadingMore(true)
    api.get('/driver/orders', { params: { page: p, ...(st ? { status: st } : {}) } })
      .then(res => {
        setOrders(prev => p === 1 ? res.data.data : [...prev, ...res.data.data])
        setLastPage(res.data.last_page)
        setTotal(res.data.total)
        setPage(p)
      })
      .finally(() => { setLoading(false); setLoadingMore(false) })
  }

  useEffect(() => { fetchOrders(1, status) }, [status])

  const changeTab = (val) => {
    if (val === status) return
    setStatus(val)
    setPage(1)
  }

  return (
    <div>
      <PageHeader>
        <PageTitle>Lịch sử đơn hàng</PageTitle>
        {!loading && <PageSub>{total} đơn</PageSub>}
      </PageHeader>

      <TabRow>
        {TABS.map(tab => (
          <TabBtn
            key={tab.value}
            onClick={() => changeTab(tab.value)}
            $active={status === tab.value}
          >
            {tab.label}
          </TabBtn>
        ))}
      </TabRow>

      {loading ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <EmptyWrap>
          <EmptyIconBox>
            <PackageCheck size={28} />
          </EmptyIconBox>
          <EmptyTitle>Chưa có đơn nào</EmptyTitle>
          <EmptyDesc>
            {status ? 'Không có đơn ở trạng thái này' : 'Bắt đầu nhận đơn ở trang Tìm đơn'}
          </EmptyDesc>
        </EmptyWrap>
      ) : (
        <>
          <OrderList>
            {orders.map(order => <OrderCard key={order.id} order={order} />)}
          </OrderList>

          {page < lastPage && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <LoadMoreBtn
                onClick={() => fetchOrders(page + 1)}
                disabled={loadingMore}
              >
                {loadingMore && <Loader2 size={15} style={{ animation: `${spin} 0.7s linear infinite` }} />}
                {loadingMore ? 'Đang tải...' : 'Tải thêm'}
              </LoadMoreBtn>
            </div>
          )}
        </>
      )}
    </div>
  )
}
