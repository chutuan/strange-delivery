import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useAuth } from '../contexts/AuthContext'
import { C, field, btn } from './styles'

export default function LoginScreen({ navigation }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) { setError('Vui lòng điền đầy đủ thông tin.'); return }
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
    } catch (e) {
      setError(e.response?.data?.errors?.email?.[0] || e.response?.data?.message || 'Thông tin đăng nhập không đúng.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={s.logo}>🚚</Text>
        <Text style={s.title}>Strange Delivery</Text>
        <Text style={s.sub}>Đăng nhập để tiếp tục</Text>

        <View style={s.card}>
          {error ? <Text style={s.error}>{error}</Text> : null}

          <Text style={field.label}>Email</Text>
          <TextInput
            style={field.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={C.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[field.label, { marginTop: 12 }]}>Mật khẩu</Text>
          <TextInput
            style={field.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={C.placeholder}
            secureTextEntry
          />

          <Pressable style={[btn.primary, { marginTop: 20 }]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={btn.primaryText}>Đăng nhập</Text>}
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.navigate('Register')}>
          <Text style={s.link}>Chưa có tài khoản? <Text style={s.linkBold}>Đăng ký</Text></Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: C.bg, padding: 24, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 52, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 4 },
  sub: { fontSize: 14, color: C.textSec, marginBottom: 28 },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  error: { color: '#dc2626', fontSize: 13, marginBottom: 12, backgroundColor: '#fee2e2', padding: 10, borderRadius: 8 },
  link: { marginTop: 20, fontSize: 14, color: C.textSec },
  linkBold: { color: C.primary, fontWeight: '600' },
})
