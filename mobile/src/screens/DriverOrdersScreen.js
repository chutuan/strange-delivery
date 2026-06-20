import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import api from '../lib/api'
import { C } from './styles'

function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

function timeAgo(dateStr) {
  if (!dateStr) return null
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return `${diff}s trước`
  if (diff < 3600) return `${Math.floor(diff / 60)}p trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h trước`
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

const TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'in_progress', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
]

function OrderCard({ order, onPress }) {
  const isInstant = order.order_type === 'instant'
  const price = order.final_price ?? order.budget_price
  const stripeColor =
    order.status === 'delivered' ? '#34d399' :
    order.status === 'cancelled' ? '#fca5a5' : '#3b82f6'
  const priceColor =
    order.status === 'delivered' ? '#059669' : C.primary

  return (
    <Pressable style={s.card} onPress={onPress}>
      <View style={[s.stripe, { backgroundColor: stripeColor }]} />
      <View style={s.cardBody}>
        {/* Header */}
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            {order.order_code && (
              <Text style={s.orderCode}>#{order.order_code}</Text>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
              {isInstant ? (
                <View style={[s.typeBadge, { backgroundColor: '#fef3c7' }]}>
                  <Text style={[s.typeBadgeText, { color: '#92400e' }]}>⚡ Giao luôn</Text>
                </View>
              ) : (
                <View style={[s.typeBadge, { backgroundColor: '#f3e8ff' }]}>
                  <Text style={[s.typeBadgeText, { color: '#7c3aed' }]}>📋 Đấu giá</Text>
                </View>
              )}
              <View style={s.statusBadge}>
                <Text style={[s.statusText, {
                  color: order.status === 'delivered' ? '#059669' :
                         order.status === 'cancelled' ? '#dc2626' :
                         order.status === 'in_progress' ? '#d97706' : C.primary
                }]}>
                  {order.status === 'delivered' ? 'Đã giao' :
                   order.status === 'cancelled' ? 'Đã hủy' :
                   order.status === 'in_progress' ? 'Đang giao' : 'Đang mở'}
                </Text>
              </View>
            </View>
            <Text style={s.title} numberOfLines={1}>{order.title}</Text>
          </View>
        </View>

        {/* Route */}
        <View style={{ flexDirection: 'row', gap: 10, marginVertical: 10 }}>
          <View style={{ alignItems: 'center', paddingTop: 3 }}>
            <View style={s.routeDot} />
            <View style={s.routeLine} />
            <View style={[s.routeDot, { backgroundColor: '#ef4444' }]} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={s.addr} numberOfLines={1}>{order.pickup_address}</Text>
            <Text style={s.addr} numberOfLines={1}>{order.delivery_address}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footerRow}>
          <Text style={[s.price, { color: priceColor }]}>{formatPrice(price)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {order.sender && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{order.sender.name?.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={s.senderName} numberOfLines={1}>{order.sender.name}</Text>
              </View>
            )}
            <Text style={s.timeAgo}>{timeAgo(order.accepted_at ?? order.created_at)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

export default function DriverOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchOrders = useCallback(async (p = 1, st = status) => {
    if (p === 1) setLoading(true)
    try {
      const params = { page: p }
      if (st) params.status = st
      const res = await api.get('/driver/orders', { params })
      const { data, last_page, total: t } = res.data
      setOrders(prev => p === 1 ? data : [...prev, ...data])
      setLastPage(last_page)
      setTotal(t ?? 0)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [status])

  useEffect(() => {
    setOrders([])
    setPage(1)
    fetchOrders(1, status)
  }, [status])

  const changeTab = (val) => {
    if (val === status) return
    setStatus(val)
  }
  const onRefresh = () => { setRefreshing(true); setPage(1); fetchOrders(1, status) }
  const loadMore = () => {
    if (page < lastPage) { const n = page + 1; setPage(n); fetchOrders(n) }
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Tab row */}
      <View style={s.tabRow}>
        {TABS.map(({ value, label }) => (
          <Pressable
            key={value}
            style={[s.tab, status === value && s.tabActive]}
            onPress={() => changeTab(value)}
          >
            <Text style={[s.tabText, status === value && s.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {!loading && total > 0 && (
        <Text style={s.totalLabel}>{total} đơn</Text>
      )}

      <FlatList
        data={orders}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => navigation.navigate('OrderDetail', { code: item.order_code })}
          />
        )}
        ListEmptyComponent={!loading && (
          <View style={s.empty}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>📋</Text>
            <Text style={s.emptyTitle}>
              {status ? 'Không có đơn ở trạng thái này' : 'Chưa có đơn hàng nào'}
            </Text>
            {!status && (
              <Text style={s.emptySub}>Bắt đầu nhận đơn ở trang Tìm đơn</Text>
            )}
          </View>
        )}
      />
    </View>
  )
}

const s = StyleSheet.create({
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 8, paddingVertical: 8, gap: 6 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  tabActive: { backgroundColor: C.primary, borderColor: C.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: C.textSec },
  tabTextActive: { color: '#fff' },
  totalLabel: { fontSize: 12, color: C.textSec, paddingHorizontal: 16, paddingVertical: 6 },
  list: { padding: 12, paddingBottom: 32, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, flexDirection: 'row' },
  stripe: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  orderCode: { fontSize: 10, color: C.placeholder, marginBottom: 3 },
  typeBadge: { borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  statusBadge: {},
  statusText: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 14, fontWeight: '700', color: C.text },
  routeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginBottom: 2 },
  routeLine: { width: 1, flex: 1, backgroundColor: C.border, minHeight: 14 },
  addr: { fontSize: 12, color: C.textSec },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  price: { fontSize: 15, fontWeight: '800' },
  avatar: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 9, fontWeight: '700', color: C.textSec },
  senderName: { fontSize: 11, color: C.textSec, maxWidth: 70 },
  timeAgo: { fontSize: 11, color: C.placeholder },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: C.textSec, marginBottom: 6 },
  emptySub: { fontSize: 13, color: C.placeholder },
})
