import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import * as Location from 'expo-location'
import api from '../lib/api'
import { C, field, btn } from './styles'

function formatPrice(n) {
  if (!n || isNaN(Number(n))) return ''
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n))
}

const VEHICLE_OPTIONS = [
  { value: 'motorbike', label: 'Xe máy' },
  { value: 'car', label: 'Ô tô' },
  { value: 'truck', label: 'Xe tải' },
]

export default function CreateOrderScreen({ navigation }) {
  const [form, setForm] = useState({
    title: '', description: '', pickup_address: '', delivery_address: '',
    recipient_name: '', recipient_phone: '',
    budget_price: '', note: '',
    vehicle_type: 'motorbike', order_type: 'instant',
    pickup_lat: null, pickup_lng: null,
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoGranted, setGeoGranted] = useState(false)

  const set = (k) => (v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }))
  }

  const detectPickupLocation = async () => {
    setGeoLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      setForm(f => ({ ...f, pickup_lat: pos.coords.latitude, pickup_lng: pos.coords.longitude }))
      setGeoGranted(true)
    } finally {
      setGeoLoading(false)
    }
  }

  const handleSubmit = async () => {
    setErrors({})
    setLoading(true)
    try {
      const payload = { ...form }
      if (!form.pickup_lat) { delete payload.pickup_lat; delete payload.pickup_lng }
      const { data } = await api.post('/orders', payload)
      navigation.replace('OrderDetail', { code: data.order_code })
    } catch (e) {
      if (e.response?.status === 422) setErrors(e.response.data.errors ?? {})
    } finally {
      setLoading(false)
    }
  }

  const F = ({ label, k, placeholder, as, keyboard, required = true }) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={field.label}>
        {label}{!required && <Text style={{ color: C.placeholder, fontWeight: '400' }}> (tuỳ chọn)</Text>}
      </Text>
      <TextInput
        style={[field.input, as === 'area' && { height: 80, textAlignVertical: 'top' }, errors[k] && field.inputError]}
        value={form[k]}
        onChangeText={set(k)}
        placeholder={placeholder}
        placeholderTextColor={C.placeholder}
        multiline={as === 'area'}
        keyboardType={keyboard}
        autoCorrect={false}
      />
      {errors[k] && <Text style={field.err}>{errors[k][0]}</Text>}
    </View>
  )

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

        {/* Hàng hoá */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>📦 Hàng hoá</Text>
          <F label="Tiêu đề" k="title" placeholder="VD: Tài liệu A4, Đồ điện tử..." />
          <F label="Mô tả" k="description" placeholder="Thông tin thêm về hàng hoá..." as="area" required={false} />
        </View>

        {/* Loại đơn */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>🚀 Hình thức giao</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              { value: 'instant', label: '⚡ Giao luôn', desc: 'Tài xế nhận ngay theo giá bạn đặt' },
              { value: 'bidding', label: '📋 Chọn tài xế', desc: 'Nhận báo giá, chọn tài xế phù hợp' },
            ].map(({ value, label, desc }) => (
              <Pressable
                key={value}
                style={[s.typeBtn, form.order_type === value && s.typeBtnActive]}
                onPress={() => set('order_type')(value)}
              >
                <Text style={[s.typeBtnLabel, form.order_type === value && s.typeBtnLabelActive]}>{label}</Text>
                <Text style={[s.typeBtnDesc, form.order_type === value && { color: C.primary }]}>{desc}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Địa chỉ */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>📍 Địa chỉ</Text>
          <F label="🟢 Lấy hàng tại" k="pickup_address" placeholder="Số nhà, đường, quận..." />
          <Pressable
            style={[s.gpsBtn, geoGranted && s.gpsBtnActive]}
            onPress={detectPickupLocation}
            disabled={geoLoading}
          >
            {geoLoading
              ? <ActivityIndicator size="small" color={C.primary} />
              : <Text style={[s.gpsBtnText, geoGranted && { color: C.primary }]}>
                  {geoGranted ? '📍 Đã lấy tọa độ điểm lấy hàng' : '📍 Lấy vị trí GPS cho điểm lấy hàng'}
                </Text>
            }
          </Pressable>
          <F label="🔴 Giao đến" k="delivery_address" placeholder="Số nhà, đường, quận..." />
        </View>

        {/* Người nhận */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>👤 Người nhận</Text>
          <F label="Tên người nhận" k="recipient_name" placeholder="Nguyễn Văn A" />
          <F label="Số điện thoại" k="recipient_phone" placeholder="0901 234 567" keyboard="phone-pad" />
        </View>

        {/* Giá & Phương tiện */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>💰 Giá & Phương tiện</Text>

          <Text style={field.label}>Loại phương tiện</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            {VEHICLE_OPTIONS.map(({ value, label }) => (
              <Pressable
                key={value}
                style={[s.vehicleChip, form.vehicle_type === value && s.vehicleChipActive]}
                onPress={() => set('vehicle_type')(value)}
              >
                <Text style={[s.vehicleChipText, form.vehicle_type === value && s.vehicleChipTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          <F
            label={form.order_type === 'instant' ? 'Giá cố định (VND)' : 'Giá đề xuất (VND)'}
            k="budget_price"
            placeholder="VD: 50000"
            keyboard="numeric"
          />
          {Number(form.budget_price) > 0 && (
            <Text style={s.priceHint}>{formatPrice(form.budget_price)}</Text>
          )}
          <F label="Ghi chú cho tài xế" k="note" placeholder="Hàng dễ vỡ, giao giờ hành chính..." as="area" required={false} />
        </View>

        <Pressable
          style={[btn.primary, { opacity: loading ? 0.5 : 1 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={btn.primaryText}>Đăng đơn hàng</Text>
          }
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { padding: 16 },
  section: { backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 14 },
  priceHint: { fontSize: 13, color: C.primary, fontWeight: '600', marginTop: -8, marginBottom: 14 },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 10, marginBottom: 14 },
  gpsBtnActive: { borderColor: C.primary, backgroundColor: '#eff6ff' },
  gpsBtnText: { fontSize: 13, color: C.textSec, fontWeight: '500' },
  typeBtn: { flex: 1, borderWidth: 2, borderColor: C.border, borderRadius: 12, padding: 12 },
  typeBtnActive: { borderColor: C.primary, backgroundColor: '#eff6ff' },
  typeBtnLabel: { fontSize: 13, fontWeight: '700', color: C.textSec, marginBottom: 3 },
  typeBtnLabelActive: { color: C.primary },
  typeBtnDesc: { fontSize: 11, color: C.placeholder, lineHeight: 15 },
  vehicleChip: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  vehicleChipActive: { borderColor: C.primary, backgroundColor: '#eff6ff' },
  vehicleChipText: { fontSize: 13, fontWeight: '600', color: C.textSec },
  vehicleChipTextActive: { color: C.primary },
})
