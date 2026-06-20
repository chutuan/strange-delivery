import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { C, field, btn } from './styles'

const VEHICLE_TYPES = [
  { v: 'motorbike', l: '🛵 Xe máy' },
  { v: 'car', l: '🚗 Ô tô' },
  { v: 'truck', l: '🚚 Xe tải' },
  { v: 'bicycle', l: '🚲 Xe đạp' },
]

export default function DriverRegisterScreen({ navigation }) {
  const { setUser } = useAuth()
  const [form, setForm] = useState({ vehicle_type: 'motorbike', license_plate: '', bio: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (k) => (v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }))
  }

  const handleSubmit = async () => {
    setErrors({})
    setLoading(true)
    try {
      const { data } = await api.post('/driver/register', form)
      setUser(u => ({ ...u, driver_profile: data.driver_profile }))
      navigation.goBack()
    } catch (e) {
      if (e.response?.status === 422) setErrors(e.response.data.errors ?? {})
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.section}>
          <Text style={s.sectionTitle}>🚗 Thông tin phương tiện</Text>

          <Text style={field.label}>Loại phương tiện</Text>
          <View style={s.typeRow}>
            {VEHICLE_TYPES.map(({ v, l }) => (
              <Pressable
                key={v}
                style={[s.typeChip, form.vehicle_type === v && s.typeChipActive]}
                onPress={() => set('vehicle_type')(v)}
              >
                <Text style={[s.typeChipText, form.vehicle_type === v && s.typeChipTextActive]}>{l}</Text>
              </Pressable>
            ))}
          </View>
          {errors.vehicle_type && <Text style={field.err}>{errors.vehicle_type[0]}</Text>}

          <View style={{ marginTop: 14 }}>
            <Text style={field.label}>Biển số xe <Text style={{ color: C.error }}>*</Text></Text>
            <TextInput
              style={[field.input, errors.license_plate && field.inputError]}
              value={form.license_plate}
              onChangeText={set('license_plate')}
              placeholder="VD: 51A-123.45"
              placeholderTextColor={C.placeholder}
              autoCapitalize="characters"
            />
            {errors.license_plate && <Text style={field.err}>{errors.license_plate[0]}</Text>}
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={field.label}>Giới thiệu bản thân <Text style={{ color: C.placeholder, fontWeight: '400' }}>(tuỳ chọn)</Text></Text>
            <TextInput
              style={[field.input, { height: 80, textAlignVertical: 'top' }, errors.bio && field.inputError]}
              value={form.bio}
              onChangeText={set('bio')}
              placeholder="Kinh nghiệm, khu vực hoạt động..."
              placeholderTextColor={C.placeholder}
              multiline
            />
            {errors.bio && <Text style={field.err}>{errors.bio[0]}</Text>}
          </View>
        </View>

        <View style={s.notice}>
          <Text style={s.noticeText}>✅ Sau khi đăng ký bạn có thể nhận đơn hàng và kiếm thu nhập từ ứng dụng.</Text>
        </View>

        <Pressable style={[btn.primary, loading && { opacity: 0.5 }]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={btn.primaryText}>Đăng ký tài xế</Text>}
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
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  typeChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  typeChipText: { fontSize: 13, color: C.textSec, fontWeight: '500' },
  typeChipTextActive: { color: '#fff' },
  notice: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#bbf7d0' },
  noticeText: { fontSize: 13, color: '#16a34a', lineHeight: 20 },
})
