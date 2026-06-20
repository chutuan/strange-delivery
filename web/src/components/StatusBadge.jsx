import styled from 'styled-components'
import { OrderStatus, BidStatus } from '../lib/enums'

const variants = {
  [OrderStatus.DRAFT]:       { label: 'Nháp',       color: '#475569', bg: '#F1F5F9', dot: '#94A3B8' },
  [OrderStatus.OPEN]:        { label: 'Đang mở',    color: '#1D4ED8', bg: '#EFF6FF', dot: '#3B82F6' },
  [OrderStatus.IN_PROGRESS]: { label: 'Đang giao',  color: '#C2410C', bg: '#FFF7ED', dot: '#F97316' },
  [OrderStatus.DELIVERED]:   { label: 'Đã giao',    color: '#047857', bg: '#ECFDF5', dot: '#10B981' },
  [OrderStatus.CANCELLED]:   { label: 'Đã hủy',     color: '#64748B', bg: '#F1F5F9', dot: '#CBD5E1' },
  [BidStatus.PENDING]:       { label: 'Chờ duyệt',  color: '#B45309', bg: '#FFFBEB', dot: '#F59E0B' },
  [BidStatus.ACCEPTED]:      { label: 'Được chọn',  color: '#047857', bg: '#ECFDF5', dot: '#10B981' },
  [BidStatus.REJECTED]:      { label: 'Bị từ chối', color: '#64748B', bg: '#F1F5F9', dot: '#CBD5E1' },
}

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;
  background: ${p => p.$bg};
  color: ${p => p.$color};
`

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${p => p.$color};
`

export default function StatusBadge({ status }) {
  const v = variants[status] ?? { label: status, color: '#64748B', bg: '#F1F5F9', dot: '#CBD5E1' }
  return <Pill $bg={v.bg} $color={v.color}><Dot $color={v.dot} />{v.label}</Pill>
}
