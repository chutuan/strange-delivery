import { StyleSheet, Text, View } from 'react-native'
import { OrderStatus, BidStatus } from '../lib/enums'

const CONFIG = {
  [OrderStatus.DRAFT]:       { label: 'Nháp',              bg: '#f3f4f6', text: '#6b7280' },
  [OrderStatus.OPEN]:        { label: 'Đang mở',           bg: '#dcfce7', text: '#15803d' },
  [OrderStatus.IN_PROGRESS]: { label: 'Đang giao',         bg: '#dbeafe', text: '#1d4ed8' },
  [OrderStatus.DELIVERED]:   { label: 'Đã giao',           bg: '#f3f4f6', text: '#374151' },
  [OrderStatus.CANCELLED]:   { label: 'Đã hủy',            bg: '#fee2e2', text: '#dc2626' },
  [BidStatus.PENDING]:       { label: 'Chờ duyệt',         bg: '#fef9c3', text: '#a16207' },
  [BidStatus.ACCEPTED]:      { label: 'Được chọn',         bg: '#dcfce7', text: '#15803d' },
  [BidStatus.REJECTED]:      { label: 'Không được chọn',   bg: '#fee2e2', text: '#dc2626' },
}

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] ?? { label: status, bg: '#f3f4f6', text: '#374151' }
  return (
    <View style={[s.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[s.text, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  badge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '600' },
})
