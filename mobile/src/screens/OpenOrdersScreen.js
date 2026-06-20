import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native'
import * as Location from 'expo-location'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import StatusBadge from '../components/StatusBadge'
import { C, card } from './styles'
import { OrderStatus } from '../lib/enums'

function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

const SORTS = [
  { v: 'newest', l: 'Mới nhất' },
  { v: 'nearest', l: '📍 Gần nhất' },
  { v: 'price_asc', l: 'Giá thấp' },
  { v: 'price_desc', l: 'Giá cao' },
]

export default function OpenOrdersScreen({ navigation }) {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [showFilter, setShowFilter] = useState(false)

  // GPS
  const [driverLat, setDriverLat] = useState(null)
  const [driverLng, setDriverLng] = useState(null)
  const [geoStatus, setGeoStatus] = useState('idle') // idle | loading | granted | denied

  // form state
  const [q, setQ] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('newest')

  // applied state (triggers fetch)
  const [applied, setApplied] = useState({ q: '', minPrice: '', maxPrice: '', sort: 'newest' })

  const requestLocation = async () => {
    setGeoStatus('loading')
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      setGeoStatus('denied')
      return
    }
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const { latitude, longitude } = pos.coords
      setDriverLat(latitude)
      setDriverLng(longitude)
      setGeoStatus('granted')
      // Send location to API so server can notify this driver for future orders
      api.put('/driver/location', { lat: latitude, lng: longitude }).catch(() => {})
      // Auto-switch to nearest
      const next = { ...applied, sort: 'nearest' }
      setSort('nearest')
      setApplied(next)
    } catch {
      setGeoStatus('denied')
    }
  }

  const fetchOrders = useCallback(async (p = 1, opts = {}) => {
    const a = { ...applied, ...opts }
    try {
      const params = { page: p, sort: a.sort }
      if (a.q) params.q = a.q
      if (a.minPrice) params.min_price = a.minPrice
      if (a.maxPrice) params.max_price = a.maxPrice
      if (driverLat && driverLng) {
        params.lat = driverLat
        params.lng = driverLng
      }
      const res = await api.get('/orders/open', { params })
      const { data, last_page } = res.data
      setOrders(prev => p === 1 ? data : [...prev, ...data])
      setLastPage(last_page)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [applied, driverLat, driverLng])

  useEffect(() => { if (user?.driver_profile) fetchOrders(1) }, [user, applied, driverLat, driverLng])

  const applyFilters = () => {
    const next = { q, minPrice, maxPrice, sort }
    setApplied(next)
    setPage(1)
    setShowFilter(false)
  }

  const resetFilters = () => {
    setQ(''); setMinPrice(''); setMaxPrice(''); setSort('newest')
    const next = { q: '', minPrice: '', maxPrice: '', sort: 'newest' }
    setApplied(next)
    setPage(1)
    setShowFilter(false)
  }

  const changeSort = (v) => {
    if (v === 'nearest' && geoStatus !== 'granted') {
      requestLocation()
      return
    }
    setSort(v)
    setApplied(a => ({ ...a, sort: v }))
    setPage(1)
  }

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
          onSubmitEditing={applyFilters}
          placeholder="Tìm theo tiêu đề, địa chỉ..."
          placeholderTextColor={C.placeholder}
          returnKeyType="search"
        />
        <Pressable style={s.filterBtn} onPress={() => setShowFilter(f => !f)}>
          <Text style={{ color: (applied.q || applied.minPrice || applied.maxPrice) ? C.primary : C.textSec, fontSize: 18 }}>⚙</Text>
        </Pressable>
        <Pressable
          style={[s.gpsBtn, geoStatus === 'granted' && s.gpsBtnActive]}
          onPress={requestLocation}
          disabled={geoStatus === 'loading'}
        >
          <Text style={{ fontSize: 14 }}>
            {geoStatus === 'loading' ? '⏳' : geoStatus === 'granted' ? '📍' : '🗺️'}
          </Text>
        </Pressable>
        <Pressable style={s.searchBtn} onPress={applyFilters}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Tìm</Text>
        </Pressable>
      </View>

      {/* GPS status hint */}
      {geoStatus === 'granted' && (
        <View style={s.gpsHint}>
          <Text style={s.gpsHintText}>📍 Đang dùng vị trí của bạn để hiển thị khoảng cách</Text>
        </View>
      )}
      {geoStatus === 'denied' && (
        <View style={[s.gpsHint, { backgroundColor: '#fef2f2' }]}>
          <Text style={[s.gpsHintText, { color: '#b91c1c' }]}>Không thể lấy vị trí. Vui lòng bật quyền định vị.</Text>
        </View>
      )}

      {/* Expandable filter panel */}
      {showFilter && (
        <View style={s.filterPanel}>
          <View style={s.priceRow}>
            <TextInput
              style={[s.priceInput, { marginRight: 6 }]}
              value={minPrice}
              onChangeText={setMinPrice}
              placeholder="Giá từ (VND)"
              placeholderTextColor={C.placeholder}
              keyboardType="numeric"
            />
            <TextInput
              style={s.priceInput}
              value={maxPrice}
              onChangeText={setMaxPrice}
              placeholder="Giá đến (VND)"
              placeholderTextColor={C.placeholder}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Pressable style={[s.searchBtn, { flex: 1 }]} onPress={applyFilters}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Áp dụng</Text>
            </Pressable>
            <Pressable style={[s.resetBtn, { flex: 1 }]} onPress={resetFilters}>
              <Text style={{ color: C.textSec, fontSize: 13 }}>Xoá bộ lọc</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Sort chips */}
      <View style={s.sortRow}>
        {SORTS.map(({ v, l }) => (
          <Pressable key={v} style={[s.chip, applied.sort === v && s.chipActive]} onPress={() => changeSort(v)}>
            <Text style={[s.chipText, applied.sort === v && s.chipTextActive]}>{l}</Text>
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
            <Pressable style={card.base} onPress={() => navigation.navigate('OrderDetail', { code: item.order_code })}>
              <View style={s.row}>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {item.order_type === 'instant' ? (
                      <View style={[s.typeBadge, { backgroundColor: '#fef3c7' }]}>
                        <Text style={[s.typeBadgeText, { color: '#92400e' }]}>⚡ Giao luôn</Text>
                      </View>
                    ) : (
                      <View style={[s.typeBadge, { backgroundColor: '#eff6ff' }]}>
                        <Text style={[s.typeBadgeText, { color: C.primary }]}>📋 Đấu giá</Text>
                      </View>
                    )}
                    {item.distance_km != null && (
                      <View style={s.distBadge}>
                        <Text style={s.distText}>
                          {item.distance_km < 1 ? `${Math.round(item.distance_km * 1000)}m` : `${item.distance_km}km`}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
                </View>
                <StatusBadge status={item.status} />
              </View>
              <Text style={s.addr} numberOfLines={1}>📍 {item.pickup_address}</Text>
              <Text style={s.addr} numberOfLines={1}>🏁 {item.delivery_address}</Text>
              <View style={s.footer}>
                <Text style={s.price}>{formatPrice(item.budget_price)}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {item.sender?.sender_rating_count > 0 && (
                    <Text style={s.senderRating}>⭐ {Number(item.sender.sender_rating_avg).toFixed(1)}</Text>
                  )}
                  <Text style={s.sender}>{item.sender?.name}</Text>
                </View>
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
  filterBtn: { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 10, justifyContent: 'center' },
  gpsBtn: { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center' },
  gpsBtnActive: { borderColor: C.primary, backgroundColor: '#eff6ff' },
  searchBtn: { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center', paddingVertical: 8 },
  gpsHint: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6 },
  gpsHintText: { fontSize: 12, color: C.primary },
  filterPanel: { backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border, padding: 12 },
  priceRow: { flexDirection: 'row' },
  priceInput: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: C.text },
  resetBtn: { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center', paddingVertical: 8 },
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
  distBadge: { backgroundColor: '#eff6ff', borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  distText: { fontSize: 11, fontWeight: '600', color: C.primary },
  typeBadge: { borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
  senderRating: { fontSize: 11, fontWeight: '600', color: '#a16207' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.textSec, marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 13, color: C.placeholder, textAlign: 'center', marginBottom: 20 },
  regBtn: { backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  regBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
})
