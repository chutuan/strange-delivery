import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import api from '../lib/api'
import StatusBadge from '../components/StatusBadge'
import { C, card } from './styles'

function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

const STATUS_FILTERS = [
  { key: 'open',        label: 'Đang mở',   numColor: '#1d4ed8' },
  { key: 'in_progress', label: 'Đang giao', numColor: '#d97706' },
  { key: 'delivered',   label: 'Đã giao',   numColor: '#16a34a' },
  { key: 'cancelled',   label: 'Đã hủy',    numColor: '#9ca3af' },
]

export default function MyOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [filter, setFilter] = useState('in_progress')
  const [counts, setCounts] = useState({})

  const fetchOrders = useCallback(async (p = 1, status = filter) => {
    try {
      const params = { page: p }
      if (status) params.status = status
      const res = await api.get('/orders/mine', { params })
      const { data, last_page, counts: c } = res.data
      setOrders(prev => p === 1 ? data : [...prev, ...data])
      setLastPage(last_page)
      if (c) setCounts(c)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filter])

  useEffect(() => {
    setLoading(true)
    setOrders([])
    setPage(1)
    fetchOrders(1, filter)
  }, [filter])

  const onRefresh = () => { setRefreshing(true); setPage(1); fetchOrders(1, filter) }
  const loadMore = () => {
    if (page < lastPage) { const next = page + 1; setPage(next); fetchOrders(next) }
  }

  const renderItem = ({ item }) => (
    <Pressable style={card.base} onPress={() => navigation.navigate('OrderDetail', { code: item.order_code })}>
      <View style={s.row}>
        <Text style={s.title} numberOfLines={1}>{item.title}</Text>
        <StatusBadge status={item.status} />
      </View>
      {item.order_code && <Text style={s.orderCode}>#{item.order_code}</Text>}
      <Text style={s.addr} numberOfLines={1}>📍 {item.pickup_address}</Text>
      <Text style={s.addr} numberOfLines={1}>🏁 {item.delivery_address}</Text>
      <View style={s.footer}>
        <Text style={s.price}>{formatPrice(item.budget_price)}</Text>
        {item.bids?.length > 0 && (
          <Text style={s.bidCount}>{item.bids.length} báo giá</Text>
        )}
        {item.driver && (
          <Text style={s.driverBadge}>🚗 {item.driver.name}</Text>
        )}
      </View>
    </Pressable>
  )

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Summary bar */}
      <View style={s.summaryBar}>
        {STATUS_FILTERS.map(({ key, label, numColor }) => {
          const isActive = filter === key
          return (
            <Pressable
              key={key}
              style={[s.summaryCell, isActive && s.summaryCellActive]}
              onPress={() => setFilter(isActive ? '' : key)}
            >
              <Text style={[s.summaryNum, { color: numColor }]}>{counts[key] ?? 0}</Text>
              <Text style={[s.summaryLabel, isActive && { fontWeight: '700', color: C.text }]}>{label}</Text>
            </Pressable>
          )
        })}
      </View>

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
            <Text style={s.emptyText}>
              {filter ? 'Không có đơn ở trạng thái này' : 'Chưa có đơn hàng nào'}
            </Text>
            {filter ? (
              <Pressable onPress={() => setFilter('')} style={{ marginTop: 8 }}>
                <Text style={{ color: C.primary, fontSize: 13, fontWeight: '600' }}>Xem tất cả đơn</Text>
              </Pressable>
            ) : (
              <Pressable style={s.createBtn} onPress={() => navigation.navigate('CreateOrder')}>
                <Text style={s.createBtnText}>+ Tạo đơn hàng</Text>
              </Pressable>
            )}
          </View>
        )}
      />
    </View>
  )
}

const s = StyleSheet.create({
  summaryBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.border },
  summaryCell: { flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  summaryCellActive: { borderBottomColor: C.primary },
  summaryNum: { fontSize: 18, fontWeight: '800' },
  summaryLabel: { fontSize: 10, color: C.textSec, marginTop: 1 },
  list: { padding: 16, paddingBottom: 32 },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: C.text },
  orderCode: { fontSize: 11, color: C.placeholder, marginBottom: 4 },
  addr: { fontSize: 13, color: C.textSec, marginBottom: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border },
  price: { fontSize: 15, fontWeight: '700', color: C.primary },
  bidCount: { fontSize: 12, color: C.textSec, backgroundColor: C.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  driverBadge: { fontSize: 12, color: '#d97706', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: C.textSec, marginBottom: 20 },
  createBtn: { backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
})
