import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import StatusBadge from '../components/StatusBadge'
import { C, card } from './styles'

function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

const SORTS = [
  { v: 'newest', l: 'Mới nhất' },
  { v: 'price_asc', l: 'Giá thấp' },
  { v: 'price_desc', l: 'Giá cao' },
]

export default function OpenOrdersScreen({ navigation }) {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const fetchOrders = useCallback(async (p = 1, opts = {}) => {
    try {
      const res = await api.get('/orders/open', {
        params: { page: p, sort: opts.sort ?? sort, ...(opts.q ?? q ? { q: opts.q ?? q } : {}) },
      })
      const { data, last_page } = res.data
      setOrders(prev => p === 1 ? data : [...prev, ...data])
      setLastPage(last_page)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [q, sort])

  useEffect(() => { if (user?.driver_profile) fetchOrders(1) }, [user, fetchOrders])

  const search = () => { setPage(1); fetchOrders(1, { q }) }
  const changeSort = (v) => { setSort(v); setPage(1); fetchOrders(1, { sort: v }) }
  const onRefresh = () => { setRefreshing(true); setPage(1); fetchOrders(1) }
  const loadMore = () => { if (page < lastPage) { const n = page + 1; setPage(n); fetchOrders(n) } }

  if (!user?.driver_profile) {
    return (
      <View style={s.center}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>🚗</Text>
        <Text style={s.emptyTitle}>Bạn chưa đăng ký tài xế</Text>
        <Text style={s.emptySub}>Đăng ký để nhận đơn và kiếm thu nhập</Text>
        <Pressable style={s.regBtn} onPress={() => navigation.navigate('DriverRegister')}>
          <Text style={s.regBtnText}>Đăng ký tài xế</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Search bar */}
      <View style={s.searchBar}>
        <TextInput
          style={s.searchInput}
          value={q}
          onChangeText={setQ}
          onSubmitEditing={search}
          placeholder="Tìm theo tiêu đề, địa chỉ..."
          placeholderTextColor={C.placeholder}
          returnKeyType="search"
        />
        <Pressable style={s.searchBtn} onPress={search}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Tìm</Text>
        </Pressable>
      </View>

      {/* Sort chips */}
      <View style={s.sortRow}>
        {SORTS.map(({ v, l }) => (
          <Pressable key={v} style={[s.chip, sort === v && s.chipActive]} onPress={() => changeSort(v)}>
            <Text style={[s.chipText, sort === v && s.chipTextActive]}>{l}</Text>
          </Pressable>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : (
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
                <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
                <StatusBadge status={item.status} />
              </View>
              <Text style={s.addr} numberOfLines={1}>📍 {item.pickup_address}</Text>
              <Text style={s.addr} numberOfLines={1}>🏁 {item.delivery_address}</Text>
              <View style={s.footer}>
                <Text style={s.price}>{formatPrice(item.budget_price)}</Text>
                <Text style={s.sender}>{item.sender?.name}</Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>🔍</Text>
              <Text style={s.emptyTitle}>Không tìm thấy đơn nào</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  searchBar: { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  searchInput: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: C.text },
  searchBtn: { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  sortRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 12, color: C.textSec, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: C.text },
  addr: { fontSize: 13, color: C.textSec, marginBottom: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border },
  price: { fontSize: 15, fontWeight: '700', color: C.primary },
  sender: { fontSize: 12, color: C.textSec },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.textSec, marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 13, color: C.placeholder, textAlign: 'center', marginBottom: 20 },
  regBtn: { backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  regBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
})
