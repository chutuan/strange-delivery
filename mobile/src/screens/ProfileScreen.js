import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Slider, StyleSheet, Switch, Text, View } from 'react-native'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { C, btn } from './styles'

function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

export default function ProfileScreen({ navigation }) {
  const { user, logout, setUser } = useAuth()
  const [stats, setStats] = useState(null)
  const [onlineToggling, setOnlineToggling] = useState(false)
  const [radius, setRadius] = useState(3)
  const [radiusSaving, setRadiusSaving] = useState(false)

  useEffect(() => {
    if (user?.driver_profile) {
      api.get('/driver/stats').then(r => setStats(r.data)).catch(() => {})
      api.get('/driver/profile').then(r => setRadius(r.data.notification_radius_km ?? 3)).catch(() => {})
    }
  }, [user])

  const saveRadius = async (val) => {
    setRadiusSaving(true)
    try {
      await api.put('/driver/profile', { notification_radius_km: val })
      setRadius(val)
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu bán kính thông báo')
    } finally {
      setRadiusSaving(false)
    }
  }

  const toggleOnline = async () => {
    setOnlineToggling(true)
    try {
      const { data } = await api.post('/driver/toggle-online')
      setUser(u => ({ ...u, driver_profile: { ...u.driver_profile, is_active: data.is_active } }))
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái')
    } finally {
      setOnlineToggling(false)
    }
  }

  const confirmLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ])
  }

  if (!user) return null

  const dp = user.driver_profile

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={s.container}>
      {/* Avatar + name */}
      <View style={s.avatarSection}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user.name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={s.name}>{user.name}</Text>
        <Text style={s.email}>{user.email}</Text>
        {user.phone && <Text style={s.phone}>{user.phone}</Text>}
      </View>

      {/* Driver card */}
      {dp ? (
        <>
          <View style={s.card}>
            <View style={s.cardRow}>
              <Text style={s.cardLabel}>Trạng thái</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 13, color: dp.is_active ? C.success : C.textSec }}>
                  {dp.is_active ? '🟢 Đang online' : '⚫ Offline'}
                </Text>
                {onlineToggling
                  ? <ActivityIndicator size="small" color={C.primary} />
                  : <Switch value={!!dp.is_active} onValueChange={toggleOnline} trackColor={{ true: C.primary }} />
                }
              </View>
            </View>
            <View style={s.divider} />
            <View style={s.cardRow}>
              <Text style={s.cardLabel}>Phương tiện</Text>
              <Text style={s.cardValue}>{dp.vehicle_type}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.cardRow}>
              <Text style={s.cardLabel}>Biển số</Text>
              <Text style={s.cardValue}>{dp.license_plate}</Text>
            </View>
            {dp.rating_count > 0 && (
              <>
                <View style={s.divider} />
                <View style={s.cardRow}>
                  <Text style={s.cardLabel}>Đánh giá</Text>
                  <Text style={s.cardValue}>⭐ {Number(dp.rating_avg).toFixed(1)} ({dp.rating_count} đánh giá)</Text>
                </View>
              </>
            )}
          </View>

          {/* Stats */}
          {stats && (
            <View style={s.statsRow}>
              <View style={s.statBox}>
                <Text style={s.statVal}>{formatPrice(stats.total_earnings)}</Text>
                <Text style={s.statLabel}>Tổng thu nhập</Text>
              </View>
              <View style={[s.statBox, { borderLeftWidth: 1, borderLeftColor: C.border }]}>
                <Text style={s.statVal}>{stats.completed_count}</Text>
                <Text style={s.statLabel}>Đơn hoàn thành</Text>
              </View>
            </View>
          )}

          {/* Notification radius */}
          <View style={[s.card, { marginBottom: 12 }]}>
            <Text style={s.cardLabel}>🔔 Thông báo đơn gần tôi</Text>
            <Text style={{ fontSize: 12, color: C.textSec, marginTop: 4, marginBottom: 10 }}>
              Nhận thông báo khi có đơn trong phạm vi <Text style={{ fontWeight: '700', color: C.primary }}>{radius}km</Text> từ vị trí của bạn.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              {[1, 2, 3, 5, 10, 15, 20].map(v => (
                <Pressable
                  key={v}
                  onPress={() => saveRadius(v)}
                  style={[
                    s.radiusChip,
                    radius === v && s.radiusChipActive,
                  ]}
                >
                  <Text style={[s.radiusChipText, radius === v && s.radiusChipTextActive]}>
                    {v}km
                  </Text>
                </Pressable>
              ))}
            </View>
            {radiusSaving && <Text style={{ fontSize: 11, color: C.primary }}>Đang lưu...</Text>}
          </View>

          <Pressable style={[btn.outline, { marginBottom: 8 }]} onPress={() => navigation.navigate('DriverOrders')}>
            <Text style={btn.outlineText}>📋 Lịch sử đơn hàng</Text>
          </Pressable>
        </>
      ) : (
        <View style={s.card}>
          <Text style={s.registerHint}>Bạn chưa đăng ký tài xế</Text>
          <Pressable style={[btn.primary, { marginTop: 12 }]} onPress={() => navigation.navigate('DriverRegister')}>
            <Text style={btn.primaryText}>Đăng ký làm tài xế</Text>
          </Pressable>
        </View>
      )}

      <Pressable style={[btn.danger, { marginTop: 8 }]} onPress={confirmLogout}>
        <Text style={btn.dangerText}>Đăng xuất</Text>
      </Pressable>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 2 },
  email: { fontSize: 13, color: C.textSec },
  phone: { fontSize: 13, color: C.textSec, marginTop: 2 },
  card: { backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  cardLabel: { fontSize: 13, color: C.textSec },
  cardValue: { fontSize: 13, fontWeight: '600', color: C.text },
  divider: { height: 1, backgroundColor: C.border },
  statsRow: { flexDirection: 'row', backgroundColor: C.white, borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  statBox: { flex: 1, alignItems: 'center', padding: 16 },
  statVal: { fontSize: 16, fontWeight: '700', color: C.primary, marginBottom: 4 },
  statLabel: { fontSize: 12, color: C.textSec },
  registerHint: { fontSize: 14, color: C.textSec, textAlign: 'center', marginBottom: 4 },
  radiusChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  radiusChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  radiusChipText: { fontSize: 12, color: C.textSec, fontWeight: '500' },
  radiusChipTextActive: { color: '#fff' },
})
