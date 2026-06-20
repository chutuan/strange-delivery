import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import api from '../lib/api'
import StatusBadge from '../components/StatusBadge'
import { C, card } from './styles'

function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

export default function MyOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const fetchOrders = useCallback(async (p = 1, prepend = false) => {
    try {
      const res = await api.get('/orders/mine', { params: { page: p } })
      const { data, last_page } = res.data
      setOrders(prev => p === 1 ? data : [...prev, ...data])
      setLastPage(last_page)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchOrders(1) }, [fetchOrders])

  const onRefresh = () => { setRefreshing(true); setPage(1); fetchOrders(1) }
  const loadMore = () => {
    if (page < lastPage) { const next = page + 1; setPage(next); fetchOrders(next) }
  }

  const renderItem = ({ item }) => (
    <Pressable style={card.base} onPress={() => navigation.navigate('OrderDetail', { id: item.id })}>
      <View style={s.row}>
        <Text style={s.title} numberOfLines={1}>{item.title}</Text>
        <StatusBadge status={item.status} />
      </View>
      <Text style={s.addr} numberOfLines={1}>📍 {item.pickup_address}</Text>
      <Text style={s.addr} numberOfLines={1}>🏁 {item.delivery_address}</Text>
      <View style={s.footer}>
        <Text style={s.price}>{formatPrice(item.budget_price)}</Text>
        {item.bids?.length > 0 && (
          <Text style={s.bidCount}>{item.bids.length} báo giá</Text>
        )}
      </View>
    </Pressable>
  )

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FlatList
        data={orders}
        keyExtractor={i => String(i.id)}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={!loading && (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📦</Text>
            <Text style={s.emptyText}>Chưa có đơn hàng nào</Text>
            <Pressable style={s.createBtn} onPress={() => navigation.navigate('CreateOrder')}>
              <Text style={s.createBtnText}>+ Tạo đơn hàng</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  )
}

const s = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: C.text },
  addr: { fontSize: 13, color: C.textSec, marginBottom: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border },
  price: { fontSize: 15, fontWeight: '700', color: C.primary },
  bidCount: { fontSize: 12, color: C.textSec, backgroundColor: C.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: C.textSec, marginBottom: 20 },
  createBtn: { backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
})
