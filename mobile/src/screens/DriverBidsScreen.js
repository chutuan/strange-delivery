import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import api from '../lib/api'
import { C } from './styles'

function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return `${diff}s trước`
  if (diff < 3600) return `${Math.floor(diff / 60)}p trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h trước`
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

const TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt', color: '#d97706', bg: '#fef3c7' },
  { value: 'accepted', label: 'Trúng thầu', color: '#059669', bg: '#dcfce7' },
  { value: 'rejected', label: 'Bị từ chối', color: '#dc2626', bg: '#fee2e2' },
]

function BidStatusBadge({ status }) {
  const cfg = {
    pending:  { label: 'Chờ duyệt',   color: '#d97706', bg: '#fef3c7' },
    accepted: { label: 'Trúng thầu',  color: '#059669', bg: '#dcfce7' },
    rejected: { label: 'Bị từ chối',  color: '#dc2626', bg: '#fee2e2' },
  }[status] ?? { label: status, color: C.textSec, bg: C.bg }
  return (
    <View style={{ backgroundColor: cfg.bg, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: cfg.color }}>{cfg.label}</Text>
    </View>
  )
}

function BidCard({ bid, onPress }) {
  const order = bid.order
  const isInstant = order?.order_type === 'instant'
  const displayPrice = order?.final_price ?? order?.budget_price

  return (
    <Pressable style={s.card} onPress={onPress}>
      {/* Header */}
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          {order?.order_code && (
            <Text style={s.orderCode}>#{order.order_code}</Text>
          )}
          <Text style={s.title} numberOfLines={1}>{order?.title ?? '—'}</Text>
        </View>
        <BidStatusBadge status={bid.status} />
      </View>

      {/* Route */}
      <View style={{ gap: 3, marginVertical: 8 }}>
        <Text style={s.addr} numberOfLines={1}>📍 {order?.pickup_address}</Text>
        <Text style={s.addr} numberOfLines={1}>🏁 {order?.delivery_address}</Text>
      </View>

      {/* Footer */}
      <View style={s.footer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ alignItems: 'flex-start' }}>
            <Text style={s.footerLabel}>Giá báo</Text>
            <Text style={s.bidPrice}>{formatPrice(bid.price)}</Text>
          </View>
          {displayPrice && bid.status === 'accepted' && (
            <View style={{ alignItems: 'flex-start' }}>
              <Text style={s.footerLabel}>Giá chốt</Text>
              <Text style={[s.bidPrice, { color: '#059669' }]}>{formatPrice(displayPrice)}</Text>
            </View>
          )}
        </View>
        <Text style={s.timeAgo}>{timeAgo(bid.created_at)}</Text>
      </View>

      {bid.note && (
        <Text style={s.note} numberOfLines={1}>💬 {bid.note}</Text>
      )}
    </Pressable>
  )
}

export default function DriverBidsScreen({ navigation }) {
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchBids = useCallback(async (p = 1, st = status) => {
    if (p === 1) setLoading(true)
    try {
      const params = { page: p }
      if (st) params.status = st
      const res = await api.get('/driver/bids', { params })
      const { data, last_page, total: t } = res.data
      setBids(prev => p === 1 ? data : [...prev, ...data])
      setLastPage(last_page)
      setTotal(t ?? 0)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [status])

  useEffect(() => {
    setBids([])
    setPage(1)
    fetchBids(1, status)
  }, [status])

  const onRefresh = () => { setRefreshing(true); setPage(1); fetchBids(1, status) }
  const loadMore = () => {
    if (page < lastPage) { const n = page + 1; setPage(n); fetchBids(n) }
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Filter tabs */}
      <View style={s.tabRow}>
        {TABS.map(({ value, label }) => (
          <Pressable
            key={value}
            style={[s.tab, status === value && s.tabActive]}
            onPress={() => { if (value !== status) { setStatus(value) } }}
          >
            <Text style={[s.tabText, status === value && s.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {!loading && total > 0 && (
        <Text style={s.totalLabel}>{total} báo giá</Text>
      )}

      <FlatList
        data={bids}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => (
          <BidCard
            bid={item}
            onPress={() => {
              if (item.order?.order_code) {
                navigation.navigate('OrderDetail', { code: item.order.order_code })
              }
            }}
          />
        )}
        ListEmptyComponent={!loading && (
          <View style={s.empty}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>📋</Text>
            <Text style={s.emptyTitle}>
              {status ? 'Không có báo giá ở trạng thái này' : 'Chưa có báo giá nào'}
            </Text>
            {!status && (
              <Text style={s.emptySub}>Vào Tìm đơn để bắt đầu báo giá</Text>
            )}
          </View>
        )}
      />
    </View>
  )
}

const s = StyleSheet.create({
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 8, paddingVertical: 8, gap: 6 },
  tab: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  tabActive: { backgroundColor: C.primary, borderColor: C.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: C.textSec },
  tabTextActive: { color: '#fff' },
  totalLabel: { fontSize: 12, color: C.textSec, paddingHorizontal: 16, paddingVertical: 6 },
  list: { padding: 12, paddingBottom: 32, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 2 },
  orderCode: { fontSize: 10, color: C.placeholder, marginBottom: 2 },
  title: { fontSize: 14, fontWeight: '700', color: C.text },
  addr: { fontSize: 12, color: C.textSec },
  footer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border, marginTop: 4 },
  footerLabel: { fontSize: 10, color: C.placeholder, marginBottom: 2 },
  bidPrice: { fontSize: 15, fontWeight: '800', color: C.primary },
  timeAgo: { fontSize: 11, color: C.placeholder },
  note: { fontSize: 11, color: C.textSec, marginTop: 8, fontStyle: 'italic' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: C.textSec, marginBottom: 6 },
  emptySub: { fontSize: 13, color: C.placeholder },
})
