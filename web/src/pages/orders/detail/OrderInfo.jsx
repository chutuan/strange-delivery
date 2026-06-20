import { MapPin, Bike, Car, Truck, Zap, ListFilter } from 'lucide-react'
import styled from 'styled-components'
import StatusBadge from '../../../components/StatusBadge'
import { formatPrice, formatDateTime } from '../../../lib/format'

const VEHICLE_ICON = { motorbike: Bike, car: Car, truck: Truck }
const VEHICLE_LABEL = { motorbike: 'Xe máy', car: 'Ô tô', truck: 'Xe tải' }

const CardBox = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`

const CardTopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
`

const TitleArea = styled.div``

const OrderTitle = styled.h2`
  font-size: 17px;
  font-weight: 700;
  color: #0F172A;
`

const OrderCode = styled.p`
  font-size: 11px;
  font-family: monospace;
  color: #94A3B8;
  margin-top: 2px;
`

const BadgesRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`

const TypeTag = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 9999px;
  background: ${p => p.$bg};
  color: ${p => p.$color};
`

const Description = styled.p`
  font-size: 13px;
  color: #475569;
  margin-bottom: 16px;
`

const RouteList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 16px;
`

const RouteRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
`

const RouteLabel = styled.span`
  font-size: 11px;
  color: #94A3B8;
  display: block;
`

const RouteAddr = styled.p`
  color: #1E293B;
`

const NoteBox = styled.p`
  font-size: 13px;
  color: #64748B;
  background: #F8FAFC;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 16px;
`

const Footer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #F1F5F9;
  flex-wrap: wrap;
`

const FooterItem = styled.div``

const FooterLabel = styled.span`
  font-size: 11px;
  color: #94A3B8;
  display: block;
`

const BudgetPrice = styled.p`
  font-weight: 700;
  color: #F97316;
`

const FinalPrice = styled.p`
  font-weight: 700;
  color: #0F172A;
`

const VehicleItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #475569;
`

const DateInfo = styled.div`
  margin-left: auto;
  text-align: right;
`

const DateText = styled.p`
  font-size: 11px;
  color: #475569;
`

export default function OrderInfo({ order }) {
  return (
    <CardBox>
      <CardTopRow>
        <TitleArea>
          <OrderTitle>{order.title}</OrderTitle>
          {order.order_code && (
            <OrderCode>#{order.order_code}</OrderCode>
          )}
        </TitleArea>
        <BadgesRow>
          {order.order_type === 'instant'
            ? <TypeTag $bg="#FEF3C7" $color="#B45309"><Zap size={11} />Giao luôn</TypeTag>
            : <TypeTag $bg="#FFEDD5" $color="#C2410C"><ListFilter size={11} />Chọn tài xế</TypeTag>
          }
          <StatusBadge status={order.status} />
        </BadgesRow>
      </CardTopRow>

      {order.description && (
        <Description>{order.description}</Description>
      )}

      <RouteList>
        <RouteRow>
          <MapPin size={15} style={{ color: '#16A34A', marginTop: 2, flexShrink: 0 }} />
          <div>
            <RouteLabel>Lấy hàng</RouteLabel>
            <RouteAddr>{order.pickup_address}</RouteAddr>
          </div>
        </RouteRow>
        <RouteRow>
          <MapPin size={15} style={{ color: '#EF4444', marginTop: 2, flexShrink: 0 }} />
          <div>
            <RouteLabel>Giao đến</RouteLabel>
            <RouteAddr>{order.delivery_address}</RouteAddr>
          </div>
        </RouteRow>
      </RouteList>

      {order.note && (
        <NoteBox>📝 {order.note}</NoteBox>
      )}

      <Footer>
        <FooterItem>
          <FooterLabel>Giá đăng</FooterLabel>
          <BudgetPrice>{formatPrice(order.budget_price)}</BudgetPrice>
        </FooterItem>
        {order.final_price && (
          <FooterItem>
            <FooterLabel>Giá chốt</FooterLabel>
            <FinalPrice>{formatPrice(order.final_price)}</FinalPrice>
          </FooterItem>
        )}
        {order.vehicle_type && (() => {
          const VIcon = VEHICLE_ICON[order.vehicle_type]
          return (
            <VehicleItem>
              {VIcon && <VIcon size={14} style={{ color: '#94A3B8' }} />}
              <span>{VEHICLE_LABEL[order.vehicle_type]}</span>
            </VehicleItem>
          )
        })()}
        <DateInfo>
          <FooterLabel>Ngày đăng</FooterLabel>
          <DateText>{formatDateTime(order.created_at)}</DateText>
        </DateInfo>
      </Footer>
    </CardBox>
  )
}
