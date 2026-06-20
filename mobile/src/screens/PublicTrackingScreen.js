import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import axios from 'axios'
import { C, card } from './styles'

const STATUS_LABEL = {
  open: { text: 'Đang chờ tài xế', color: '#1d4ed8', bg: '#eff6ff', icon: '🔍' },
  in_progress: { text: 'Đang giao hàng', color: '#b45309', bg: '#fffbeb', icon: '🚚' },
  delivered: { text: 'Đã giao thành công', color: '#15803d', bg: '#f0fdf4', icon: '✅' },
  cancelled: { text: 'Đã hủy', color: '#b91c1c', bg: '#fef2f2', icon: '❌' },
}

const VEHICLE_LABEL = { motorbike: 'Xe máy', car: 'Ô tô', truck: 'Xe tải' }

function formatDate(s) {
  if (!s) return ''
  return new Date(s).toLocaleString('vi-VN')
}

const publicApi = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

export default function PublicTrackingScreen({ route, navigation }) {
  const { id } = route.params
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const intervalRef = useRef(null)

  const fetchOrder = () => {
    publicApi.get(`/track/${id}`)
      .then(res => { setOrder(res.data); setError('') })
      .catch(err => setError(err.response?.status === 404 ? 'Không tìm thấy đơn hàng.' : 'Lỗi kết nối.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchOrder()
    intervalRef.current = setInterval(fetchOrder, 30000)
    return () => clearInterval(intervalRef.current)
  }, [id])

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
  )

  if (error) return (
    <View style={s.center}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>❌</Text>
      <Text style={{ fontSize: 15, color: C.error, textAlign: 'center', marginBottom: 24 }}>{error}</Text>
      <Pressable style={s.backBtn} onPress={() => navigation.goBack()}>
        <Text style={s.backBtnText}>← Quay lại</Text>
      </Pressable>
    </View>
  )

  const status = order ? (STATUS_LABEL[order.status] ?? { text: order.status, color: C.text, bg: C.bg, icon: '📦' }) : null

  const timeline = order ? [
    { label: 'Đã đăng đơn', time: order.created_at, done: true },
    { label: 'Đã chọn tài xế', time: order.accepted_at, done: !!order.accepted_at },
    { label: 'Đã giao hàng', time: order.delivered_at, done: !!order.delivered_at },
  ] : []

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <Text style={s.meta}>Đơn hàng #{id}</Text>

      {/* Status badge */}
      <View style={[card.base, { backgroundColor: status.bg, alignItems: 'center', paddingVertical: 20 }]}>
        <Text style={{ fontSize: 48, marginBottom: 8 }}>{status.icon}</Text>
        <Text style={[s.statusText, { color: status.color }]}>{status.text}</Text>
        <Text style={{ fontSize: 14, color: C.textSec, marginTop: 4 }}>{order.title}</Text>
      </View>

      {/* Addresses */}
      <View style={card.base}>
        <View style={s.addrRow}>
          <Text style={s.addrDot}>🟢</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.addrLabel}>Lấy hàng tại</Text>
            <Text style={s.addrText}>{order.pickup_address}</Text>
          </View>
        </View>
        <View style={s.divider} />
        <View style={s.addrRow}>
          <Text style={s.addrDot}>🔴</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.addrLabel}>Giao đến</Text>
            <Text style={s.addrText}>{order.delivery_address}</Text>
          </View>
        </View>
      </View>

      {/* Timeline */}
      <View style={card.base}>
        <Text style={s.sectionTitle}>Tiến trình</Text>
        {timeline.map((step, i) => (
          <View key={i} style={s.timelineRow}>
            <View style={{ alignItems: 'center', width: 20 }}>
              <View style={[s.dot, step.done && s.dotDone]} />
              {i < timeline.length - 1 && (
                <View style={[s.line, step.done && timeline[i + 1].done && s.lineDone]} />
              )}
            </View>
            <View style={{ flex: 1, paddingBottom: i < timeline.length - 1 ? 16 : 0 }}>
              <Text style={[s.timelineLabel, !step.done && { opacity: 0.4 }]}>{step.label}</Text>
              {step.time ? <Text style={s.timelineSub}>{formatDate(step.time)}</Text> : null}
            </View>
          </View>
        ))}
      </View>

      {/* Delivery note */}
      {order.delivery_note ? (
        <View style={[card.base, { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' }]}>
          <Text style={{ fontSize: 13, color: '#15803d' }}>🚚 <Text style={{ fontWeight: '700' }}>Ghi chú giao hàng:</Text> {order.delivery_note}</Text>
        </View>
      ) : null}

      {/* Driver card */}
      {order.driver ? (
        <View style={card.base}>
          <Text style={s.sectionTitle}>Tài xế</Text>
          <View style={s.personRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{order.driver.name?.[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.personName}>{order.driver.name}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                {order.driver.vehicle_type ? (
                  <Text style={s.vehicleTag}>{VEHICLE_LABEL[order.driver.vehicle_type] ?? order.driver.vehicle_type}</Text>
                ) : null}
                {order.driver.license_plate ? (
                  <Text style={s.plateTag}>{order.driver.license_plate}</Text>
                ) : null}
              </View>
              {order.driver.rating_count > 0 ? (
                <Text style={{ fontSize: 12, color: '#b45309', marginTop: 4 }}>
                  ⭐ {Number(order.driver.rating_avg).toFixed(1)} ({order.driver.rating_count} đánh giá)
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}

      <Pressable style={s.loginBtn} onPress={() => navigation.navigate('Login')}>
        <Text style={s.loginBtnText}>Đăng nhập để xem đơn của bạn →</Text>
      </Pressable>

      <Text style={s.refreshNote}>Tự động cập nhật mỗi 30 giây</Text>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  meta: { fontSize: 12, color: C.textSec, marginBottom: 12 },
  statusText: { fontSize: 20, fontWeight: '800' },
  addrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  addrDot: { fontSize: 14, marginTop: 2 },
  addrLabel: { fontSize: 11, color: C.placeholder },
  addrText: { fontSize: 14, fontWeight: '600', color: C.text, marginTop: 1 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 12 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: C.border, backgroundColor: C.white, marginTop: 2 },
  dotDone: { backgroundColor: C.success, borderColor: C.success },
  line: { width: 2, flex: 1, minHeight: 16, backgroundColor: C.border, marginTop: 2 },
  lineDone: { backgroundColor: '#86efac' },
  timelineLabel: { fontSize: 13, fontWeight: '600', color: C.text },
  timelineSub: { fontSize: 11, color: C.placeholder, marginTop: 1 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: C.primary },
  personName: { fontSize: 15, fontWeight: '700', color: C.text },
  vehicleTag: { fontSize: 12, color: C.textSec, backgroundColor: C.bg, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: C.border },
  plateTag: { fontSize: 11, fontFamily: 'monospace', color: C.text, backgroundColor: C.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: C.border },
  loginBtn: { marginTop: 4, padding: 16, alignItems: 'center' },
  loginBtnText: { fontSize: 13, color: C.primary, fontWeight: '600' },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border },
  backBtnText: { fontSize: 14, color: C.text, fontWeight: '600' },
  refreshNote: { fontSize: 11, color: C.placeholder, textAlign: 'center', marginBottom: 24 },
})
