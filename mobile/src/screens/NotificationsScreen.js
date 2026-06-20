import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import api from '../lib/api'
import { C } from './styles'

function timeAgo(s) {
  const diff = (Date.now() - new Date(s).getTime()) / 1000
  if (diff < 60) return 'vừa xong'
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  return new Date(s).toLocaleDateString('vi-VN')
}

const TYPE_ICON = {
  bid_placed: '💰', bid_accepted: '✅', bid_rejected: '❌',
  order_delivered: '🎉', order_cancelled: '🚫', rating_received: '⭐',
}

export default function NotificationsScreen({ navigation }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get('/notifications')
      setItems(res.data.data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  const openItem = async (n) => {
    if (!n.read_at) {
      await api.post(`/notifications/${n.id}/read`).catch(() => {})
      setItems(prev => prev.map(i => i.id === n.id ? { ...i, read_at: new Date().toISOString() } : i))
    }
    if (n.order_id) navigation.navigate('OrderDetail', { id: n.order_id })
  }

  const markAllRead = async () => {
    await api.post('/notifications/read-all').catch(() => {})
    setItems(prev => prev.map(i => ({ ...i, read_at: i.read_at ?? new Date().toISOString() })))
  }

  const hasUnread = items.some(i => !i.read_at)

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {hasUnread && (
        <Pressable style={s.readAllBar} onPress={markAllRead}>
          <Text style={s.readAllText}>✓ Đánh dấu tất cả đã đọc</Text>
        </Pressable>
      )}
      <FlatList
        data={items}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchItems() }} />}
        renderItem={({ item: n }) => (
          <Pressable
            style={[s.item, !n.read_at && s.itemUnread]}
            onPress={() => openItem(n)}
          >
            <View style={s.iconWrap}>
              <Text style={s.icon}>{TYPE_ICON[n.type] ?? '🔔'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{n.title}</Text>
              {n.body ? <Text style={s.body}>{n.body}</Text> : null}
              <Text style={s.time}>{timeAgo(n.created_at)}</Text>
            </View>
            {!n.read_at && <View style={s.unreadDot} />}
          </Pressable>
        )}
        ListEmptyComponent={!loading && (
          <View style={s.empty}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🔔</Text>
            <Text style={s.emptyText}>Chưa có thông báo nào</Text>
          </View>
        )}
      />
    </View>
  )
}

const s = StyleSheet.create({
  list: { padding: 12, paddingBottom: 32 },
  readAllBar: { backgroundColor: C.primaryLight, paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#bfdbfe' },
  readAllText: { color: C.primary, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 8 },
  itemUnread: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  title: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  body: { fontSize: 13, color: C.textSec, marginBottom: 4 },
  time: { fontSize: 11, color: C.placeholder },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary, marginTop: 6 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 15, color: C.textSec },
})
