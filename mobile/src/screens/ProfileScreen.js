import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { StarDisplay } from '../components/StarRating'
import { C, btn, field } from './styles'

const VEHICLE_LABEL = { motorbike: 'Xe máy', car: 'Ô tô', truck: 'Xe tải' }
const VEHICLE_TYPES = ['motorbike', 'car', 'truck']

function VehicleForm({ initial = { vehicle_type: 'motorbike', license_plate: '' }, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})

  const handleSave = async () => {
    setErrors({})
    try {
      await onSave(form)
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors ?? {})
    }
  }

  return (
    <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border, marginTop: 8 }}>
      <Text style={field.label}>Loại phương tiện</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {VEHICLE_TYPES.map(t => (
          <Pressable
            key={t}
            style={[s.vehicleChip, form.vehicle_type === t && s.vehicleChipActive]}
            onPress={() => setForm(f => ({ ...f, vehicle_type: t }))}
          >
            <Text style={[s.vehicleChipText, form.vehicle_type === t && s.vehicleChipTextActive]}>{VEHICLE_LABEL[t]}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={field.label}>Biển số xe</Text>
      <TextInput
        style={[field.input, errors.license_plate && field.inputError]}
        value={form.license_plate}
        onChangeText={v => setForm(f => ({ ...f, license_plate: v }))}
        placeholder="VD: 51F-123.45"
        placeholderTextColor={C.placeholder}
        autoCapitalize="characters"
      />
      {errors.license_plate && <Text style={field.err}>{errors.license_plate[0]}</Text>}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <Pressable
          style={[btn.primary, { flex: 1, opacity: (saving || !form.license_plate.trim()) ? 0.5 : 1 }]}
          onPress={handleSave}
          disabled={saving || !form.license_plate.trim()}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={btn.primaryText}>Lưu</Text>}
        </Pressable>
        <Pressable style={[btn.outline, { flex: 1 }]} onPress={onCancel}>
          <Text style={btn.outlineText}>Huỷ</Text>
        </Pressable>
      </View>
    </View>
  )
}

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth()
  const [onlineToggling, setOnlineToggling] = useState(false)
  const [radius, setRadius] = useState(3)
  const [radiusSaving, setRadiusSaving] = useState(false)
  const [credits, setCredits] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [vehicleSaving, setVehicleSaving] = useState(false)

  useEffect(() => {
    if (user?.driver_profile) {
      api.get('/driver/profile').then(r => setRadius(r.data.notification_radius_km ?? 3)).catch(() => {})
      api.get('/driver/credits').then(r => setCredits(r.data.credits)).catch(() => {})
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
      await api.post('/driver/toggle-online')
      await refreshUser()
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái')
    } finally {
      setOnlineToggling(false)
    }
  }

  const handleAddVehicle = async (form) => {
    setVehicleSaving(true)
    try {
      await api.post('/driver/vehicles', form)
      await refreshUser()
      setShowAddForm(false)
    } finally {
      setVehicleSaving(false)
    }
  }

  const handleEditVehicle = async (form) => {
    setVehicleSaving(true)
    try {
      await api.put(`/driver/vehicles/${editingVehicle.id}`, form)
      await refreshUser()
      setEditingVehicle(null)
    } finally {
      setVehicleSaving(false)
    }
  }

  const handleDeleteVehicle = (vehicle) => {
    Alert.alert(
      'Xoá xe',
      `Xoá ${VEHICLE_LABEL[vehicle.vehicle_type]} - ${vehicle.license_plate}?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Xoá', style: 'destructive', onPress: async () => {
          await api.delete(`/driver/vehicles/${vehicle.id}`).catch(() => {})
          await refreshUser()
        }},
      ],
    )
  }

  const handleSetPrimary = async (vehicle) => {
    await api.post(`/driver/vehicles/${vehicle.id}/primary`).catch(() => {})
    await refreshUser()
  }

  const confirmLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ])
  }

  if (!user) return null

  const dp = user.driver_profile
  const vehicles = dp?.vehicles ?? []

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={s.container}>
      {/* Avatar + name */}
      <View style={s.avatarSection}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user.name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={s.name}>{user.name}</Text>
        <Text style={s.email}>{user.email}</Text>
        {user.phone && <Text style={s.email}>{user.phone}</Text>}
      </View>

      {/* Driver card */}
      {dp ? (
        <>
          {/* Online toggle */}
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

            {dp.rating_count > 0 && (
              <>
                <View style={s.divider} />
                <View style={s.cardRow}>
                  <Text style={s.cardLabel}>Đánh giá</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <StarDisplay score={Math.round(dp.rating_avg)} size={13} />
                    <Text style={s.cardValue}>{Number(dp.rating_avg).toFixed(1)} ({dp.rating_count})</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Vehicles */}
          <View style={s.card}>
            <Text style={[s.cardLabel, { fontWeight: '700', marginBottom: 10 }]}>🚗 Phương tiện</Text>
            {vehicles.map(v => (
              <View key={v.id}>
                {editingVehicle?.id === v.id ? (
                  <VehicleForm
                    initial={{ vehicle_type: v.vehicle_type, license_plate: v.license_plate }}
                    onSave={handleEditVehicle}
                    onCancel={() => setEditingVehicle(null)}
                    saving={vehicleSaving}
                  />
                ) : (
                  <View style={[s.vehicleRow, { borderBottomWidth: vehicles.indexOf(v) < vehicles.length - 1 ? 1 : 0, borderBottomColor: C.border }]}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: v.is_primary ? C.primary : C.text }}>
                          {VEHICLE_LABEL[v.vehicle_type]}
                        </Text>
                        {v.is_primary && (
                          <View style={{ backgroundColor: '#eff6ff', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: C.primary }}>Chính</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 12, color: C.textSec, marginTop: 1 }}>{v.license_plate}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      {!v.is_primary && (
                        <Pressable style={s.iconBtn} onPress={() => handleSetPrimary(v)}>
                          <Text style={{ fontSize: 14 }}>⭐</Text>
                        </Pressable>
                      )}
                      <Pressable style={s.iconBtn} onPress={() => setEditingVehicle(v)}>
                        <Text style={{ fontSize: 14 }}>✏️</Text>
                      </Pressable>
                      {vehicles.length > 1 && (
                        <Pressable style={s.iconBtn} onPress={() => handleDeleteVehicle(v)}>
                          <Text style={{ fontSize: 14 }}>🗑️</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                )}
              </View>
            ))}

            {showAddForm ? (
              <VehicleForm
                onSave={handleAddVehicle}
                onCancel={() => setShowAddForm(false)}
                saving={vehicleSaving}
              />
            ) : (
              <Pressable style={{ marginTop: 10 }} onPress={() => setShowAddForm(true)}>
                <Text style={{ fontSize: 13, color: C.primary, fontWeight: '600' }}>+ Thêm xe</Text>
              </Pressable>
            )}
          </View>

          {/* Driver quick links */}
          <View style={s.quickLinks}>
            <Pressable style={s.quickLink} onPress={() => navigation.navigate('DriverDashboard')}>
              <Text style={s.quickLinkIcon}>📊</Text>
              <Text style={s.quickLinkText}>Tổng quan</Text>
            </Pressable>
            <Pressable style={s.quickLink} onPress={() => navigation.navigate('DriverOrders')}>
              <Text style={s.quickLinkIcon}>📋</Text>
              <Text style={s.quickLinkText}>Lịch sử đơn</Text>
            </Pressable>
            <Pressable style={s.quickLink} onPress={() => navigation.navigate('DriverBids')}>
              <Text style={s.quickLinkIcon}>🏷</Text>
              <Text style={s.quickLinkText}>Lịch sử bid</Text>
            </Pressable>
          </View>

          {/* Notification radius */}
          <View style={[s.card, { marginBottom: 12 }]}>
            <Text style={s.cardLabel}>🔔 Thông báo đơn gần tôi</Text>
            <Text style={{ fontSize: 12, color: C.textSec, marginTop: 4, marginBottom: 10 }}>
              Nhận thông báo khi có đơn trong phạm vi <Text style={{ fontWeight: '700', color: C.primary }}>{radius}km</Text> từ vị trí của bạn.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
              {[1, 2, 3, 5, 10, 15, 20].map(v => (
                <Pressable
                  key={v}
                  onPress={() => saveRadius(v)}
                  style={[s.radiusChip, radius === v && s.radiusChipActive]}
                >
                  <Text style={[s.radiusChipText, radius === v && s.radiusChipTextActive]}>{v}km</Text>
                </Pressable>
              ))}
            </View>
            {radiusSaving && <Text style={{ fontSize: 11, color: C.primary }}>Đang lưu...</Text>}
          </View>

          {/* Credits */}
          {credits !== null && (
            <View style={[s.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }]}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: C.primary }}>{credits} credit</Text>
                <Text style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>1 credit = 1.000đ · dùng để báo giá</Text>
              </View>
              <View style={{ gap: 6, alignItems: 'flex-end' }}>
                <Pressable style={btn.primary} onPress={() => navigation.navigate('TopUp')}>
                  <Text style={btn.primaryText}>Nạp thêm</Text>
                </Pressable>
                <Pressable onPress={() => navigation.navigate('CreditHistory')}>
                  <Text style={{ fontSize: 11, color: C.primary }}>Lịch sử →</Text>
                </Pressable>
              </View>
            </View>
          )}
        </>
      ) : (
        <View style={s.card}>
          <Text style={{ fontSize: 14, color: C.textSec, textAlign: 'center', marginBottom: 4 }}>Bạn chưa đăng ký tài xế</Text>
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
  email: { fontSize: 13, color: C.textSec, marginTop: 2 },
  card: { backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  cardLabel: { fontSize: 13, color: C.textSec },
  cardValue: { fontSize: 13, fontWeight: '600', color: C.text },
  divider: { height: 1, backgroundColor: C.border },
  quickLinks: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  quickLink: { flex: 1, backgroundColor: C.white, borderRadius: 14, paddingVertical: 14, alignItems: 'center', gap: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  quickLinkIcon: { fontSize: 20 },
  quickLinkText: { fontSize: 11, fontWeight: '600', color: C.textSec },
  radiusChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  radiusChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  radiusChipText: { fontSize: 12, color: C.textSec, fontWeight: '500' },
  radiusChipTextActive: { color: '#fff' },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  vehicleChip: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  vehicleChipActive: { borderColor: C.primary, backgroundColor: '#eff6ff' },
  vehicleChipText: { fontSize: 13, fontWeight: '600', color: C.textSec },
  vehicleChipTextActive: { color: C.primary },
})
