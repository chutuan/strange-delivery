import styled from 'styled-components'
import { OrderStatus, BidStatus } from '../lib/enums'

const variants = {
  [OrderStatus.DRAFT]:       { label: 'Nháp',       color: '#6B7280', bg: '#F3F4F6', border: 'transparent' },
  [OrderStatus.OPEN]:        { label: 'Đang mở',    color: '#3B82F6', bg: '#EFF6FF', border: 'rgba(59,130,246,0.2)' },
  [OrderStatus.IN_PROGRESS]: { label: 'Đang giao',  color: '#F97316', bg: '#FFF7ED', border: 'rgba(249,115,22,0.2)' },
  [OrderStatus.DELIVERED]:   { label: 'Đã giao',    color: '#10B981', bg: '#ECFDF5', border: 'rgba(16,185,129,0.2)' },
  [OrderStatus.CANCELLED]:   { label: 'Đã hủy',     color: '#6B7280', bg: '#F3F4F6', border: 'transparent' },
  [BidStatus.PENDING]:       { label: 'Chờ duyệt',  color: '#B45309', bg: '#FFFBEB', border: 'rgba(180,83,9,0.15)' },
  [BidStatus.ACCEPTED]:      { label: 'Được chọn',  color: '#10B981', bg: '#ECFDF5', border: 'rgba(16,185,129,0.2)' },
  [BidStatus.REJECTED]:      { label: 'Bị từ chối', color: '#6B7280', bg: '#F3F4F6', border: 'transparent' },
}

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;
  background: ${p => p.$bg};
  color: ${p => p.$color};
  box-shadow: inset 0 0 0 1px ${p => p.$border};
`

export default function StatusBadge({ status }) {
  const v = variants[status] ?? { label: status, color: '#6B7280', bg: '#F3F4F6', border: 'transparent' }
  return <Pill $bg={v.bg} $color={v.color} $border={v.border}>{v.label}</Pill>
}
