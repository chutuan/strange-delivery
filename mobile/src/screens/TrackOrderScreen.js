import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { C, field, btn } from './styles'

export default function TrackOrderScreen({ navigation }) {
  const [orderId, setOrderId] = useState('')

  const track = () => {
    const id = orderId.trim()
    if (!id || isNaN(Number(id))) return
    navigation.navigate('PublicTracking', { id: Number(id) })
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.container}>
        <Text style={s.emoji}>🚚</Text>
        <Text style={s.title}>Theo dõi đơn hàng</Text>
        <Text style={s.sub}>Nhập mã đơn hàng để theo dõi trạng thái giao hàng</Text>

        <TextInput
          style={s.input}
          value={orderId}
          onChangeText={setOrderId}
          onSubmitEditing={track}
          placeholder="Mã đơn hàng (VD: 123)"
          placeholderTextColor={C.placeholder}
          keyboardType="numeric"
          returnKeyType="search"
          autoFocus
        />

        <Pressable
          style={[btn.primary, !orderId.trim() && { opacity: 0.5 }]}
          onPress={track}
          disabled={!orderId.trim()}
        >
          <Text style={btn.primaryText}>Theo dõi</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')} style={{ marginTop: 20 }}>
          <Text style={s.loginLink}>Đăng nhập để xem đơn của bạn →</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  emoji: { fontSize: 52, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: C.text, textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 14, color: C.textSec, textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, color: C.text, backgroundColor: C.white, marginBottom: 14, textAlign: 'center', letterSpacing: 2 },
  loginLink: { fontSize: 13, color: C.primary, textAlign: 'center' },
})
