import { useEffect, useState } from 'react'
import {
  ActivityIndicator, Image, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native'
import api from '../lib/api'
import { C, btn, field } from './styles'

function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

function vietQrUrl(bankId, accountNo, accountName, amount, content) {
  const name = encodeURIComponent(accountName)
  const info = encodeURIComponent(content)
  return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${info}&accountName=${name}`
}

const QUICK_AMOUNTS = [5, 10, 20, 50, 100, 200]

export default function TopUpScreen({ navigation }) {
  const [creditInfo, setCreditInfo] = useState(null)
  const [history, setHistory] = useState([])
  const [amount, setAmount] = useState(10)
  const [customAmount, setCustomAmount] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/driver/credits'),
      api.get('/driver/credits/history'),
    ]).then(([c, h]) => {
      setCreditInfo(c.data)
      setHistory(h.data.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const selectedAmount = customAmount ? (parseInt(customAmount) || 0) : amount
  const bank = creditInfo?.bank_setting
  const transferContent = `NAPTIEN ${creditInfo?.driver_id}`

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={s.container}>
      {/* Balance */}
      <View style={s.balanceCard}>
        <Text style={s.balanceLabel}>Số dư hiện tại</Text>
        <Text style={s.balanceVal}>{creditInfo?.credits ?? 0} credit</Text>
        <Text style={s.balanceHint}>1 credit = 1.000đ · Mỗi lần báo giá tốn 1 credit</Text>
      </View>

      {/* Amount picker */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Chọn số credit muốn nạp</Text>
        <View style={s.quickRow}>
          {QUICK_AMOUNTS.map(v => (
            <Pressable
              key={v}
              style={[s.chip, selectedAmount === v && !customAmount && s.chipActive]}
              onPress={() => { setAmount(v); setCustomAmount('') }}
            >
              <Text style={[s.chipText, selectedAmount === v && !customAmount && s.chipTextActive]}>{v}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={[field.input, { marginTop: 10 }]}
          value={customAmount}
          onChangeText={v => { setCustomAmount(v.replace(/[^0-9]/g, '')); }}
          keyboardType="numeric"
          placeholder="Nhập số khác..."
          placeholderTextColor={C.placeholder}
        />
        {selectedAmount > 0 && (
          <Text style={s.priceHint}>= {formatPrice(selectedAmount * 1000)}</Text>
        )}
      </View>

      {/* QR */}
      {bank ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Quét QR để chuyển khoản</Text>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Image
              source={{ uri: vietQrUrl(bank.bank_id, bank.account_number, bank.account_name, selectedAmount * 1000, transferContent) }}
              style={s.qrImage}
              resizeMode="contain"
            />
          </View>

          <View style={s.infoBox}>
            {[
              ['Ngân hàng', bank.bank_id],
              ['Số tài khoản', bank.account_number],
              ['Chủ tài khoản', bank.account_name],
              ['Số tiền', formatPrice(selectedAmount * 1000)],
              ['Nội dung CK', transferContent],
            ].map(([label, value]) => (
              <View key={label} style={s.infoRow}>
                <Text style={s.infoLabel}>{label}</Text>
                <Text style={[s.infoValue, label === 'Nội dung CK' && { color: C.primary, fontWeight: '700' }]}>{value}</Text>
              </View>
            ))}
          </View>

          <View style={s.warningBox}>
            <Text style={s.warningText}>
              ⚠️ Vui lòng ghi đúng nội dung chuyển khoản. Admin sẽ xác nhận và cộng credit sớm nhất có thể.
            </Text>
          </View>
        </View>
      ) : (
        <View style={[s.section, { backgroundColor: '#fef3c7' }]}>
          <Text style={{ fontSize: 14, color: '#92400e', textAlign: 'center' }}>
            Admin chưa thiết lập tài khoản ngân hàng. Vui lòng liên hệ hỗ trợ.
          </Text>
        </View>
      )}

      {/* History */}
      {history.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Lịch sử giao dịch</Text>
          {history.map(tx => (
            <View key={tx.id} style={s.txRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.txDesc}>{tx.description}</Text>
                <Text style={s.txDate}>{new Date(tx.created_at).toLocaleString('vi-VN')}</Text>
              </View>
              <Text style={[s.txAmount, { color: tx.amount > 0 ? C.success : '#ef4444' }]}>
                {tx.amount > 0 ? '+' : ''}{tx.amount}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { padding: 16 },
  balanceCard: { backgroundColor: C.primary, borderRadius: 20, padding: 20, marginBottom: 12 },
  balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  balanceVal: { fontSize: 32, fontWeight: '800', color: '#fff' },
  balanceHint: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  section: { backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 12 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: C.textSec },
  chipTextActive: { color: '#fff' },
  priceHint: { fontSize: 13, color: C.primary, fontWeight: '600', marginTop: 8 },
  qrImage: { width: 220, height: 220, borderRadius: 12 },
  infoBox: { backgroundColor: C.bg, borderRadius: 12, padding: 12, gap: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 13, color: C.textSec },
  infoValue: { fontSize: 13, fontWeight: '600', color: C.text },
  warningBox: { backgroundColor: '#fef3c7', borderRadius: 10, padding: 12, marginTop: 12 },
  warningText: { fontSize: 12, color: '#92400e', lineHeight: 18 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  txDesc: { fontSize: 13, fontWeight: '500', color: C.text },
  txDate: { fontSize: 11, color: C.textSec, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
})
