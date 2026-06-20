import { Link } from 'react-router-dom'
import { ChevronRight, Truck } from 'lucide-react'
import styled from 'styled-components'
import { formatPrice, formatDate } from '../../../lib/format'

const STATUS = {
  open:        { label: 'Đang mở',   accentColor: '#60A5FA', badgeBg: '#EFF6FF', badgeColor: '#1D4ED8', dotColor: '#60A5FA' },
  in_progress: { label: 'Đang giao', accentColor: '#FB923C', badgeBg: '#FFF7ED', badgeColor: '#EA580C', dotColor: '#FB923C' },
  delivered:   { label: 'Đã giao',   accentColor: '#34D399', badgeBg: '#ECFDF5', badgeColor: '#059669', dotColor: '#34D399' },
  cancelled:   { label: 'Đã hủy',    accentColor: '#CBD5E1', badgeBg: '#F1F5F9', badgeColor: '#64748B', dotColor: '#CBD5E1' },
}

const CardLink = styled(Link)`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(16,24,40,0.04);
  padding: 16px;
  display: flex;
  gap: 12px;
  transition: all 0.15s ease;
  text-decoration: none;
  &:hover {
    border-color: #CBD5E1;
    box-shadow: 0 4px 12px rgba(16,24,40,0.08);
  }
`

const CardBody = styled.div`
  flex: 1;
  min-width: 0;
`

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
`

const CardTitle = styled.span`
  font-weight: 600;
  color: #0F172A;
  line-height: 1.3;
`

const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 9999px;
  background: ${p => p.$bg};
  color: ${p => p.$color};
  white-space: nowrap;
`

const StatusDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${p => p.$color};
  flex-shrink: 0;
`

const OrderCode = styled.p`
  font-size: 11px;
  font-family: monospace;
  color: #94A3B8;
  margin-bottom: 8px;
`

const RouteWrap = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
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
`

const RouteLine = styled.div`
  width: 1px;
  height: 16px;
  background: #E2E8F0;
  margin: 2px 0;
`

const DotRed = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #EF4444;
`

const RouteAddresses = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const AddressText = styled.p`
  font-size: 13px;
  color: #475569;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const Price = styled.span`
  font-weight: 700;
  color: #F97316;
`

const BidCount = styled.span`
  font-size: 11px;
  color: #94A3B8;
  background: #F1F5F9;
  padding: 2px 8px;
  border-radius: 9999px;
`

const DriverTag = styled.span`
  font-size: 11px;
  color: #475569;
  background: #F1F5F9;
  padding: 2px 8px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
`

const DateText = styled.span`
  font-size: 11px;
  color: #94A3B8;
  margin-left: auto;
`

const ChevronWrap = styled.div`
  color: #CBD5E1;
  flex-shrink: 0;
  margin-top: 4px;
  transition: color 0.15s ease;
  ${CardLink}:hover & {
    color: #64748B;
  }
`

function LocalStatusBadge({ status }) {
  const s = STATUS[status] ?? { label: status, badgeBg: '#F1F5F9', badgeColor: '#64748B', dotColor: '#CBD5E1' }
  return (
    <StatusPill $bg={s.badgeBg} $color={s.badgeColor}>
      <StatusDot $color={s.dotColor} />
      {s.label}
    </StatusPill>
  )
}

export default function OrderCard({ order }) {
  return (
    <CardLink to={`/orders/${order.order_code}`}>
      <CardBody>
        <CardHeader>
          <CardTitle>{order.title}</CardTitle>
          <LocalStatusBadge status={order.status} />
        </CardHeader>
        {order.order_code && (
          <OrderCode>#{order.order_code}</OrderCode>
        )}

        <RouteWrap>
          <RouteIndicator>
            <DotGreen />
            <RouteLine />
            <DotRed />
          </RouteIndicator>
          <RouteAddresses>
            <AddressText>{order.pickup_address}</AddressText>
            <AddressText>{order.delivery_address}</AddressText>
          </RouteAddresses>
        </RouteWrap>

        <CardFooter>
          <Price>{formatPrice(order.budget_price)}</Price>
          {order.bids?.length > 0 && (
            <BidCount>{order.bids.length} báo giá</BidCount>
          )}
          {order.driver && (
            <DriverTag>
              <Truck size={11} /> {order.driver.name}
            </DriverTag>
          )}
          <DateText>{formatDate(order.created_at)}</DateText>
        </CardFooter>
      </CardBody>

      <ChevronWrap>
        <ChevronRight size={16} />
      </ChevronWrap>
    </CardLink>
  )
}
