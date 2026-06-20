import { StyleSheet, Text, View } from 'react-native'

const CONFIG = {
  open:        { label: 'Đang mở',       bg: '#dcfce7', text: '#15803d' },
  in_progress: { label: 'Đang giao',     bg: '#dbeafe', text: '#1d4ed8' },
  delivered:   { label: 'Đã giao',       bg: '#f3f4f6', text: '#374151' },
  cancelled:   { label: 'Đã hủy',        bg: '#fee2e2', text: '#dc2626' },
  pending:     { label: 'Chờ duyệt',     bg: '#fef9c3', text: '#a16207' },
  accepted:    { label: 'Được chọn',     bg: '#dcfce7', text: '#15803d' },
  rejected:    { label: 'Không được chọn', bg: '#fee2e2', text: '#dc2626' },
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
