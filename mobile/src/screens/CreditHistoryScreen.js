import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import api from '../lib/api'
import { C } from './styles'

const TX_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'topup', label: 'Nạp tiền' },
  { value: 'bid_deduction', label: 'Báo giá' },
]

function txConfig(type, amount) {
  if (type === 'topup') return { icon: '⬇', color: '#059669', prefix: '+' }
  if (type === 'bid_deduction') return { icon: '📋', color: '#dc2626', prefix: '' }
  return { icon: '↕', color: amount > 0 ? '#059669' : '#dc2626', prefix: amount > 0 ? '+' : '' }
}

function formatDate(d) {
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function TransactionRow({ tx }) {
  const cfg = txConfig(tx.type, tx.amount)
  return (
    <View style={s.txRow}>
      <View style={[s.txIcon, {
        backgroundColor: tx.type === 'topup' ? '#dcfce7' :
                         tx.type === 'bid_deduction' ? '#fee2e2' : C.bg
      }]}>
        <Text style={{ fontSize: 16 }}>{cfg.icon}</Text>
      </View>
      <View style={{ flex: 1, marginHorizontal: 10 }}>
        <Text style={s.txDesc}>{tx.description}</Text>
        <Text style={s.txDate}>{formatDate(tx.created_at)}</Text>
      </View>
      <Text style={[s.txAmount, { color: cfg.color }]}>
        {cfg.prefix}{tx.amount} credit
      </Text>
    </View>
  )
}

export default function CreditHistoryScreen({ navigation }) {
  const [credits, setCredits] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState('')

  const fetchBalance = useCallback(() => {
    api.get('/driver/credits').then(r => setCredits(r.data.credits)).catch(() => {})
  }, [])

  const fetchPage = useCallback(async (p = 1, type = filter) => {
    if (p === 1) { setLoading(true); setTransactions([]) } else setLoadingMore(true)
    try {
      const params = { page: p }
      if (type) params.type = type
      const res = await api.get('/driver/credits/history', { params })
      setTransactions(prev => p === 1 ? res.data.data : [...prev, ...res.data.data])
      setLastPage(res.data.last_page)
      setTotal(res.data.total ?? 0)
      setPage(p)
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setRefreshing(false)
    }
  }, [filter])

  useEffect(() => { fetchBalance(); fetchPage(1, filter) }, [filter])

  const onRefresh = () => { setRefreshing(true); fetchBalance(); fetchPage(1, filter) }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Balance card */}
      <View style={s.balanceCard}>
        <Text style={s.balanceLabel}>Số dư hiện tại</Text>
        <Text style={s.balanceValue}>{credits ?? '—'} <Text style={s.balanceUnit}>credit</Text></Text>
        <Text style={s.balanceHint}>1 credit = 1.000đ · Mỗi lần báo giá tốn 1 credit</Text>
        <Pressable style={s.topUpBtn} onPress={() => navigation.navigate('TopUp')}>
          <Text style={s.topUpBtnText}>+ Nạp thêm credit</Text>
        </Pressable>
      </View>

      {/* Filter chips */}
      <View style={s.filterRow}>
        {TX_FILTERS.map(f => (
          <Pressable
            key={f.value}
            style={[s.filterChip, filter === f.value && s.filterChipActive]}
            onPress={() => { if (f.value !== filter) setFilter(f.value) }}
          >
            <Text style={[s.filterChipText, filter === f.value && s.filterChipTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
        {!loading && <Text style={s.totalLabel}>{total} giao dịch</Text>}
      </View>

      {/* List */}
      <FlatList
        data={transactions}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={() => {
          if (!loadingMore && page < lastPage) fetchPage(page + 1)
        }}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => <TransactionRow tx={item} />}
        ListEmptyComponent={!loading && (
          <View style={s.empty}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>📊</Text>
            <Text style={s.emptyText}>Chưa có giao dịch nào</Text>
          </View>
        )}
        ListFooterComponent={loadingMore ? (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <ActivityIndicator color={C.primary} />
          </View>
        ) : null}
      />
    </View>
  )
}

const s = StyleSheet.create({
  balanceCard: { backgroundColor: C.primary, padding: 20, paddingTop: 24 },
  balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  balanceValue: { fontSize: 32, fontWeight: '800', color: '#fff' },
  balanceUnit: { fontSize: 20, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  balanceHint: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4, marginBottom: 12 },
  topUpBtn: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  topUpBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.border },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  filterChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: C.textSec },
  filterChipTextActive: { color: '#fff' },
  totalLabel: { marginLeft: 'auto', fontSize: 11, color: C.placeholder },
  list: { padding: 12, paddingBottom: 32 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: '#fff', paddingHorizontal: 4 },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txDesc: { fontSize: 13, fontWeight: '500', color: C.text, marginBottom: 2 },
  txDate: { fontSize: 11, color: C.textSec },
  txAmount: { fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: C.textSec },
})
