import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import * as Location from 'expo-location'
import api from '../lib/api'
import { C, field, btn } from './styles'

function formatPrice(n) {
  if (!n || isNaN(Number(n))) return ''
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n))
}

export default function CreateOrderScreen({ navigation }) {
  const [form, setForm] = useState({
    title: '', description: '', pickup_address: '', delivery_address: '',
    budget_price: '', note: '', required_before: '',
    pickup_lat: null, pickup_lng: null,
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(null) // 'draft' | 'publish' | null
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

  const handleSubmit = async (publish) => {
    setErrors({})
    setLoading(publish ? 'publish' : 'draft')
    try {
      const payload = { ...form, publish }
      if (!form.pickup_lat) { delete payload.pickup_lat; delete payload.pickup_lng }
      const { data } = await api.post('/orders', payload)
      navigation.replace('OrderDetail', { id: data.id })
    } catch (e) {
      if (e.response?.status === 422) setErrors(e.response.data.errors ?? {})
    } finally {
      setLoading(null)
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
        <View style={s.section}>
          <Text style={s.sectionTitle}>📦 Hàng hoá</Text>
          <F label="Tiêu đề" k="title" placeholder="VD: Tài liệu A4, Đồ điện tử..." />
          <F label="Mô tả" k="description" placeholder="Thông tin thêm về hàng hoá..." as="area" required={false} />
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>📍 Địa chỉ</Text>
          <F label="🟢 Lấy hàng tại" k="pickup_address" placeholder="Số nhà, đường, quận..." />

          {/* GPS capture for pickup */}
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

        <View style={s.section}>
          <Text style={s.sectionTitle}>💰 Giá & ghi chú</Text>
          <F label="Giá dự kiến (VND)" k="budget_price" placeholder="VD: 50000" keyboard="numeric" />
          {Number(form.budget_price) > 0 && (
            <Text style={s.priceHint}>{formatPrice(form.budget_price)}</Text>
          )}
          <F label="Giao trước lúc" k="required_before" placeholder="VD: 2026-06-25 14:00" required={false} />
          <F label="Ghi chú cho tài xế" k="note" placeholder="Hàng dễ vỡ, giao giờ hành chính..." as="area" required={false} />
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            style={[btn.outline, { flex: 1, opacity: loading ? 0.5 : 1 }]}
            onPress={() => handleSubmit(false)}
            disabled={!!loading}
          >
            {loading === 'draft'
              ? <ActivityIndicator color={C.text} />
              : <Text style={btn.outlineText}>Lưu nháp</Text>
            }
          </Pressable>
          <Pressable
            style={[btn.primary, { flex: 1, opacity: loading ? 0.5 : 1 }]}
            onPress={() => handleSubmit(true)}
            disabled={!!loading}
          >
            {loading === 'publish'
              ? <ActivityIndicator color="#fff" />
              : <Text style={btn.primaryText}>Tìm tài xế ngay</Text>
            }
          </Pressable>
        </View>

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
})
