import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import api from '../lib/api'
import StatusBadge from '../components/StatusBadge'
import { C, card } from './styles'

function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

const FILTERS = [
  { v: '', l: 'Tất cả' },
  { v: 'in_progress', l: 'Đang giao' },
  { v: 'delivered', l: 'Đã giao' },
]

export default function DriverOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const fetchOrders = useCallback(async (p = 1, st = status) => {
    try {
      const params = { page: p }
      if (st) params.status = st
      const res = await api.get('/driver/orders', { params })
      const { data, last_page } = res.data
      setOrders(prev => p === 1 ? data : [...prev, ...data])
      setLastPage(last_page)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [status])

  useEffect(() => { fetchOrders(1, status) }, [status])

  const changeFilter = (v) => { setStatus(v); setPage(1) }
  const onRefresh = () => { setRefreshing(true); setPage(1); fetchOrders(1, status) }
  const loadMore = () => {
    if (page < lastPage) { const n = page + 1; setPage(n); fetchOrders(n) }
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={s.filterRow}>
        {FILTERS.map(({ v, l }) => (
          <Pressable key={v} style={[s.chip, status === v && s.chipActive]} onPress={() => changeFilter(v)}>
            <Text style={[s.chipText, status === v && s.chipTextActive]}>{l}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={orders}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => (
          <Pressable style={card.base} onPress={() => navigation.navigate('OrderDetail', { id: item.id })}>
            <View style={s.row}>
              <Text style={s.title} numberOfLines={1}>{item.title}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={s.addr} numberOfLines={1}>📍 {item.pickup_address}</Text>
            <Text style={s.addr} numberOfLines={1}>🏁 {item.delivery_address}</Text>
            <View style={s.footer}>
              <Text style={s.price}>
                {item.final_price ? formatPrice(item.final_price) : formatPrice(item.budget_price)}
              </Text>
              <Text style={s.sender}>{item.sender?.name}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={!loading && (
          <View style={s.empty}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>📋</Text>
            <Text style={s.emptyText}>Chưa có đơn hàng nào</Text>
          </View>
        )}
      />
    </View>
  )
}

const s = StyleSheet.create({
  filterRow: { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 12, color: C.textSec, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 32 },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: C.text },
  addr: { fontSize: 13, color: C.textSec, marginBottom: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border },
  price: { fontSize: 15, fontWeight: '700', color: C.primary },
  sender: { fontSize: 12, color: C.textSec },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 15, color: C.textSec },
})
