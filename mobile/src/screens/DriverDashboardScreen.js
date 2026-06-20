import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import api from '../lib/api'
import { StarDisplay } from '../components/StarRating'
import { C } from './styles'

function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

function StatCard({ label, value, color = C.text, sub }) {
  return (
    <View style={s.statCard}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
      {sub && <Text style={s.statSub}>{sub}</Text>}
    </View>
  )
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return `${diff}s trước`
  if (diff < 3600) return `${Math.floor(diff / 60)}p trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h trước`
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

export default function DriverDashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/driver/stats')
      setStats(res.data)
    } catch {
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [])

  const onRefresh = () => { setRefreshing(true); fetchStats() }

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  )

  const bidRate = stats?.total_bids > 0
    ? Math.round((stats.accepted_bids / stats.total_bids) * 100)
    : null

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Stats grid */}
      <View style={s.statsGrid}>
        <StatCard
          label="Đơn đã giao"
          value={stats?.total_delivered ?? 0}
          color={C.primary}
        />
        <StatCard
          label="Đơn đang giao"
          value={stats?.active_orders ?? 0}
          color="#d97706"
        />
        <StatCard
          label="Tổng thu nhập"
          value={formatPrice(stats?.total_earnings ?? 0)}
          color="#059669"
        />
        {stats?.rating_avg > 0 ? (
          <View style={s.statCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[s.statValue, { color: '#f59e0b' }]}>{Number(stats.rating_avg).toFixed(1)}</Text>
              <Text style={{ fontSize: 18, color: '#f59e0b' }}>⭐</Text>
            </View>
            <Text style={s.statLabel}>Đánh giá</Text>
            <Text style={s.statSub}>{stats.rating_count} lượt</Text>
          </View>
        ) : (
          <StatCard label="Đánh giá" value="—" color={C.placeholder} />
        )}
      </View>

      {/* Bid acceptance rate */}
      {bidRate !== null && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Tỷ lệ trúng thầu</Text>
          <View style={s.bidRateRow}>
            <View style={s.bidRateBar}>
              <View style={[s.bidRateFill, { width: `${bidRate}%` }]} />
            </View>
            <Text style={s.bidRatePct}>{bidRate}%</Text>
          </View>
          <Text style={s.bidRateMeta}>
            {stats.accepted_bids} trúng / {stats.total_bids} báo giá
          </Text>
        </View>
      )}

      {/* Recent deliveries */}
      {stats?.recent_deliveries?.length > 0 && (
        <View style={[s.section, { paddingBottom: 0 }]}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Giao gần đây</Text>
            <Pressable onPress={() => navigation.navigate('DriverOrders')}>
              <Text style={s.seeAll}>Xem tất cả</Text>
            </Pressable>
          </View>
          {stats.recent_deliveries.map((order, idx) => (
            <Pressable
              key={order.id}
              style={[s.deliveryRow, idx < stats.recent_deliveries.length - 1 && s.deliveryDivider]}
              onPress={() => navigation.navigate('OrderDetail', { code: order.order_code })}
            >
              <View style={{ flex: 1 }}>
                {order.order_code && (
                  <Text style={s.deliveryCode}>#{order.order_code}</Text>
                )}
                <Text style={s.deliveryTitle} numberOfLines={1}>{order.title}</Text>
                <Text style={s.deliveryAddr} numberOfLines={1}>
                  {order.pickup_address} → {order.delivery_address}
                </Text>
                {order.sender && (
                  <Text style={s.deliverySender}>👤 {order.sender.name}</Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {(order.final_price ?? order.budget_price) > 0 && (
                  <Text style={s.deliveryPrice}>
                    {formatPrice(order.final_price ?? order.budget_price)}
                  </Text>
                )}
                <Text style={s.deliveryTime}>{timeAgo(order.updated_at)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {!stats?.recent_deliveries?.length && (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>🚗</Text>
          <Text style={{ fontSize: 15, color: C.textSec }}>Chưa có đơn nào được giao</Text>
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statValue: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12, color: C.textSec, textAlign: 'center' },
  statSub: { fontSize: 11, color: C.placeholder, marginTop: 2 },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  seeAll: { fontSize: 12, color: C.primary, fontWeight: '600' },
  bidRateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 8 },
  bidRateBar: { flex: 1, height: 8, backgroundColor: C.border, borderRadius: 99, overflow: 'hidden' },
  bidRateFill: { height: '100%', backgroundColor: C.primary, borderRadius: 99 },
  bidRatePct: { fontSize: 15, fontWeight: '700', color: C.primary, width: 40, textAlign: 'right' },
  bidRateMeta: { fontSize: 11, color: C.placeholder },
  deliveryRow: { paddingVertical: 12, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  deliveryDivider: { borderBottomWidth: 1, borderBottomColor: C.border },
  deliveryCode: { fontSize: 10, color: C.placeholder, marginBottom: 2 },
  deliveryTitle: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 2 },
  deliveryAddr: { fontSize: 11, color: C.textSec },
  deliverySender: { fontSize: 11, color: C.textSec, marginTop: 2 },
  deliveryPrice: { fontSize: 13, fontWeight: '700', color: '#059669' },
  deliveryTime: { fontSize: 11, color: C.placeholder, marginTop: 2 },
})
