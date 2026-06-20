import { X, Star, Truck, Bike, Car, CalendarDays, PackageCheck, BadgeCheck } from 'lucide-react'
import styled from 'styled-components'

const VEHICLE = {
  motorbike: { label: 'Xe máy', Icon: Bike },
  car:       { label: 'Ô tô',   Icon: Car },
  truck:     { label: 'Xe tải',  Icon: Truck },
}

const CRITERIA = [
  { key: 'punctuality', label: 'Đúng giờ' },
  { key: 'attitude', label: 'Thái độ' },
  { key: 'care', label: 'Cẩn thận' },
]

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 20px 16px;
  position: relative;
`

const Avatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #F97316;
  color: white;
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

const HeadInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`

const Name = styled.h3`
  font-size: 17px;
  font-weight: 700;
  color: #0F172A;
  letter-spacing: -0.01em;
`

const VerifiedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 600;
  color: #047857;
  background: #ECFDF5;
  border-radius: 9999px;
  padding: 2px 8px;
`

const OnlineRow = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 3px;
  font-size: 12px;
  color: ${p => (p.$online ? '#059669' : '#94A3B8')};
`

const Dot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${p => (p.$online ? '#10B981' : '#CBD5E1')};
`

const CloseBtn = styled.button`
  position: absolute;
  top: 14px;
  right: 14px;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  &:hover { background: #F1F5F9; color: #475569; }
`

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 0 20px 16px;
`

const StatBox = styled.div`
  background: #F8FAFC;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  padding: 12px 10px;
  text-align: center;
`

const StatValue = styled.div`
  font-size: 17px;
  font-weight: 700;
  color: #0F172A;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
`

const StatLabel = styled.div`
  font-size: 11px;
  color: #94A3B8;
  margin-top: 2px;
`

const Section = styled.div`
  padding: 16px 20px;
  border-top: 1px solid #F1F5F9;
`

const SectionTitle = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
`

const VehicleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const VehicleChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  background: #F1F5F9;
  border-radius: 9999px;
  padding: 5px 12px;
`

const CritRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 5px 0;
`

const CritName = styled.span`
  font-size: 13px;
  color: #475569;
`

const CritRight = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`

const CritVal = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: #0F172A;
  min-width: 22px;
  text-align: right;
`

const ReviewItem = styled.div`
  padding: 12px 0;
  border-bottom: 1px solid #F1F5F9;
  &:last-child { border-bottom: none; padding-bottom: 0; }
`

const ReviewTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`

const ReviewName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #1E293B;
`

const ReviewComment = styled.p`
  font-size: 13px;
  color: #475569;
  margin-top: 4px;
  line-height: 1.5;
`

const ReviewDate = styled.span`
  font-size: 11px;
  color: #94A3B8;
`

const Stars = styled.span`
  display: inline-flex;
  gap: 1px;
`

const Empty = styled.p`
  font-size: 13px;
  color: #94A3B8;
  text-align: center;
  padding: 8px 0;
`

function StarRow({ score, size = 13 }) {
  const rounded = Math.round(score)
  return (
    <Stars>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          style={{
            fill: i <= rounded ? '#FBBF24' : 'none',
            color: i <= rounded ? '#FBBF24' : '#D1D5DB',
          }}
        />
      ))}
    </Stars>
  )
}

// Shared trust-profile body — used by the in-app modal and the public share page.
export default function DriverProfileContent({ data, onClose }) {
  return (
    <>
      <Header>
        <Avatar>{data.name?.charAt(0)?.toUpperCase() ?? '?'}</Avatar>
        <HeadInfo>
          <NameRow>
            <Name>{data.name}</Name>
            {data.is_verified && (
              <VerifiedBadge><BadgeCheck size={13} /> Đã xác minh</VerifiedBadge>
            )}
          </NameRow>
          <OnlineRow $online={data.is_active}>
            <Dot $online={data.is_active} />
            {data.is_active ? 'Đang hoạt động' : 'Ngoại tuyến'}
          </OnlineRow>
        </HeadInfo>
        {onClose && <CloseBtn onClick={onClose}><X size={18} /></CloseBtn>}
      </Header>

      <Stats>
        <StatBox>
          <StatValue>
            <Star size={14} style={{ fill: '#FBBF24', color: '#FBBF24' }} />
            {data.rating_count > 0 ? data.rating_avg.toFixed(1) : '—'}
          </StatValue>
          <StatLabel>{data.rating_count} đánh giá</StatLabel>
        </StatBox>
        <StatBox>
          <StatValue><PackageCheck size={15} style={{ color: '#10B981' }} />{data.total_delivered}</StatValue>
          <StatLabel>Chuyến hoàn thành</StatLabel>
        </StatBox>
        <StatBox>
          <StatValue><CalendarDays size={15} style={{ color: '#94A3B8' }} /></StatValue>
          <StatLabel>Từ {new Date(data.member_since).toLocaleDateString('vi-VN', { month: 'numeric', year: 'numeric' })}</StatLabel>
        </StatBox>
      </Stats>

      {data.vehicle_types?.length > 0 && (
        <Section>
          <SectionTitle>Phương tiện</SectionTitle>
          <VehicleRow>
            {data.vehicle_types.map(v => {
              const meta = VEHICLE[v] ?? { label: v, Icon: Truck }
              const Icon = meta.Icon
              return <VehicleChip key={v}><Icon size={13} />{meta.label}</VehicleChip>
            })}
          </VehicleRow>
        </Section>
      )}

      {data.criteria && CRITERIA.some(c => data.criteria[c.key] != null) && (
        <Section>
          <SectionTitle>Đánh giá theo tiêu chí</SectionTitle>
          {CRITERIA.filter(c => data.criteria[c.key] != null).map(c => (
            <CritRow key={c.key}>
              <CritName>{c.label}</CritName>
              <CritRight>
                <StarRow score={data.criteria[c.key]} size={12} />
                <CritVal>{data.criteria[c.key].toFixed(1)}</CritVal>
              </CritRight>
            </CritRow>
          ))}
        </Section>
      )}

      <Section>
        <SectionTitle>Đánh giá gần đây</SectionTitle>
        {data.reviews?.length > 0 ? (
          data.reviews.map(r => (
            <ReviewItem key={r.id}>
              <ReviewTop>
                <ReviewName>{r.sender?.name ?? 'Người gửi'}</ReviewName>
                <StarRow score={r.score} />
              </ReviewTop>
              {r.comment && <ReviewComment>{r.comment}</ReviewComment>}
              <ReviewDate>{new Date(r.created_at).toLocaleDateString('vi-VN')}</ReviewDate>
            </ReviewItem>
          ))
        ) : (
          <Empty>Chưa có đánh giá nào</Empty>
        )}
      </Section>
    </>
  )
}
