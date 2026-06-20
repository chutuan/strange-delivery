import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useAuth } from '../contexts/AuthContext'
import { C, field, btn } from './styles'

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }))

  const handleRegister = async () => {
    setErrors({})
    setLoading(true)
    try {
      await register(form)
    } catch (e) {
      if (e.response?.status === 422) setErrors(e.response.data.errors ?? {})
    } finally {
      setLoading(false)
    }
  }

  const F = ({ label, field: k, placeholder, secure, keyboard }) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={field.label}>{label}</Text>
      <TextInput
        style={[field.input, errors[k] && field.inputError]}
        value={form[k]}
        onChangeText={set(k)}
        placeholder={placeholder}
        placeholderTextColor={C.placeholder}
        secureTextEntry={secure}
        keyboardType={keyboard}
        autoCapitalize={k === 'name' ? 'words' : 'none'}
        autoCorrect={false}
      />
      {errors[k] && <Text style={field.err}>{errors[k][0]}</Text>}
    </View>
  )

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Tạo tài khoản</Text>
        <Text style={s.sub}>Điền thông tin để đăng ký</Text>

        <View style={s.card}>
          <F label="Họ và tên" field="name" placeholder="Nguyễn Văn A" />
          <F label="Email" field="email" placeholder="you@example.com" keyboard="email-address" />
          <F label="Số điện thoại (tuỳ chọn)" field="phone" placeholder="0901234567" keyboard="phone-pad" />
          <F label="Mật khẩu" field="password" placeholder="ít nhất 8 ký tự" secure />
          <F label="Xác nhận mật khẩu" field="password_confirmation" placeholder="nhập lại mật khẩu" secure />

          <Pressable style={[btn.primary, { marginTop: 8 }]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={btn.primaryText}>Đăng ký</Text>}
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={s.link}>Đã có tài khoản? <Text style={s.linkBold}>Đăng nhập</Text></Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: C.bg, padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 4 },
  sub: { fontSize: 14, color: C.textSec, marginBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, marginBottom: 16 },
  link: { textAlign: 'center', fontSize: 14, color: C.textSec },
  linkBold: { color: C.primary, fontWeight: '600' },
})
