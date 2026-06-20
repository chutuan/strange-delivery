import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import StatusBadge from '../components/StatusBadge'
import { StarDisplay, StarPicker } from '../components/StarRating'
import { C, btn, card } from './styles'
import { OrderStatus, BidStatus } from '../lib/enums'

function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}
function formatDate(s) {
  if (!s) return ''
  return new Date(s).toLocaleString('vi-VN')
}

export default function OrderDetailScreen({ route, navigation }) {
  const { id } = route.params
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [bidPrice, setBidPrice] = useState('')
  const [bidNote, setBidNote] = useState('')
  const [bidLoading, setBidLoading] = useState(false)
  const [showDeliverForm, setShowDeliverForm] = useState(false)
  const [deliveryNote, setDeliveryNote] = useState('')
  const [score, setScore] = useState(0)
  const [comment, setComment] = useState('')
  const [ratingLoading, setRatingLoading] = useState(false)

  const fetchOrder = useCallback(async () => {
    try {
      const res = await api.get(`/orders/${id}`)
      setOrder(res.data)
    } catch {
      navigation.goBack()
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id])

  useEffect(() => { fetchOrder() }, [fetchOrder])

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
  )
  if (!order) return null

  const isSender = order.sender_id === user.id
  const isDriver = order.driver_id === user.id
  const myBid = order.bids?.find(b => b.driver_id === user.id)

  const action = async (fn) => {
    setActionLoading(true)
    try { await fn() } finally { setActionLoading(false) }
  }

  const acceptBid = (bidId) => action(async () => {
    const { data } = await api.post(`/orders/${id}/accept-bid/${bidId}`)
    setOrder(data)
  })

  const cancelOrder = () => Alert.alert('Xác nhận', 'Bạn có chắc muốn hủy đơn này?', [
    { text: 'Thôi', style: 'cancel' },
    { text: 'Hủy đơn', style: 'destructive', onPress: () => action(async () => {
      const { data } = await api.post(`/orders/${id}/cancel`)
      setOrder(data)
    })},
  ])

  const markDelivered = async () => {
    setActionLoading(true)
    try {
      const { data } = await api.post(`/orders/${id}/deliver`, { delivery_note: deliveryNote || null })
      setOrder(data)
      setShowDeliverForm(false)
      setDeliveryNote('')
    } catch (e) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể xác nhận giao hàng.')
    } finally {
      setActionLoading(false)
    }
  }

  const withdrawBid = () => Alert.alert('Xác nhận', 'Rút báo giá này?', [
    { text: 'Thôi', style: 'cancel' },
    { text: 'Rút', style: 'destructive', onPress: () => action(async () => {
      await api.delete(`/orders/${id}/bids/${myBid.id}`)
      fetchOrder()
    })},
  ])

  const submitBid = async () => {
    if (!bidPrice) return
    setBidLoading(true)
    try {
      await api.post(`/orders/${id}/bids`, { price: bidPrice, note: bidNote })
      setBidPrice(''); setBidNote('')
      fetchOrder()
    } catch (e) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể đặt giá.')
    } finally {
      setBidLoading(false)
    }
  }

  const submitRating = async () => {
    if (!score) return
    setRatingLoading(true)
    try {
      await api.post(`/orders/${id}/rate`, { score, comment })
      fetchOrder()
    } finally {
      setRatingLoading(false)
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrder() }} />}
    >
      {/* Order info */}
      <View style={card.base}>
        <View style={s.row}>
          <Text style={s.title}>{order.title}</Text>
          <StatusBadge status={order.status} />
        </View>
        {order.description ? <Text style={s.desc}>{order.description}</Text> : null}

        <View style={{ gap: 6, marginVertical: 12 }}>
          <View style={s.addrRow}><Text style={s.addrDot}>🟢</Text><Text style={s.addr}>{order.pickup_address}</Text></View>
          <View style={s.addrRow}><Text style={s.addrDot}>🔴</Text><Text style={s.addr}>{order.delivery_address}</Text></View>
        </View>

        {order.note ? <Text style={s.note}>📝 {order.note}</Text> : null}
        {order.required_before ? <Text style={s.deadline}>⏰ Giao trước: {formatDate(order.required_before)}</Text> : null}
        {order.delivery_note ? <Text style={s.deliveryNote}>🚚 Ghi chú giao hàng: {order.delivery_note}</Text> : null}

        <View style={[s.row, { paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border }]}>
          <View>
            <Text style={s.priceLabel}>Giá đăng</Text>
            <Text style={s.price}>{formatPrice(order.budget_price)}</Text>
          </View>
          {order.final_price ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.priceLabel}>Giá chốt</Text>
              <Text style={[s.price, { color: C.success }]}>{formatPrice(order.final_price)}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Timeline */}
      {order.status !== OrderStatus.OPEN && order.status !== OrderStatus.CANCELLED && (
        <View style={card.base}>
          <Text style={s.sectionTitle}>Tiến trình</Text>
          {[
            { label: 'Đã đăng đơn', time: order.created_at, done: true },
            { label: 'Đã chọn tài xế', time: order.accepted_at, done: !!order.accepted_at },
            { label: 'Đã giao hàng', time: order.delivered_at, done: !!order.delivered_at },
          ].map((step, i, arr) => (
            <View key={i} style={s.timelineRow}>
              <View style={{ alignItems: 'center', width: 20 }}>
                <View style={[s.dot, step.done && s.dotDone]} />
                {i < arr.length - 1 && <View style={[s.line, arr[i + 1].done && s.lineDone]} />}
              </View>
              <View style={{ flex: 1, paddingBottom: i < arr.length - 1 ? 16 : 0 }}>
                <Text style={[s.timelineLabel, !step.done && { opacity: 0.4 }]}>{step.label}</Text>
                {step.time ? <Text style={s.timelineSub}>{formatDate(step.time)}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Sender/driver info */}
      {!isSender && order.sender && (
        <View style={[card.base, s.personRow]}>
          <View style={s.avatar}><Text style={s.avatarText}>{order.sender.name[0]}</Text></View>
          <View>
            <Text style={s.personName}>{order.sender.name}</Text>
            {order.sender.phone && <Text style={s.personSub}>{order.sender.phone}</Text>}
          </View>
        </View>
      )}
      {isSender && order.driver && (
        <View style={[card.base, s.personRow]}>
          <View style={[s.avatar, { backgroundColor: '#dcfce7' }]}><Text style={[s.avatarText, { color: C.success }]}>{order.driver.name[0]}</Text></View>
          <View>
            <Text style={s.personLabel}>Tài xế</Text>
            <Text style={s.personName}>{order.driver.name}</Text>
            {order.driver.phone && <Text style={s.personSub}>{order.driver.phone}</Text>}
          </View>
        </View>
      )}

      {/* Draft: publish prompt */}
      {isSender && order.status === OrderStatus.DRAFT && (
        <View style={[card.base, { marginBottom: 12, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' }]}>
          <Text style={{ fontSize: 13, color: '#1d4ed8', marginBottom: 10 }}>📋 Đơn đang ở trạng thái nháp — chưa hiển thị với tài xế.</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              style={[btn.primary, { flex: 1, opacity: actionLoading ? 0.5 : 1 }]}
              onPress={() => action(async () => { const { data } = await api.post(`/orders/${id}/publish`); setOrder(data) })}
              disabled={actionLoading}
            >
              <Text style={btn.primaryText}>🚀 Tìm tài xế ngay</Text>
            </Pressable>
            <Pressable
              style={[btn.danger, { paddingHorizontal: 14 }]}
              onPress={cancelOrder}
              disabled={actionLoading}
            >
              <Text style={btn.dangerText}>Xoá</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Actions */}
      {isSender && order.status === OrderStatus.OPEN && (
        <Pressable style={[btn.danger, { marginBottom: 12 }]} onPress={cancelOrder} disabled={actionLoading}>
          <Text style={btn.dangerText}>Hủy đơn</Text>
        </Pressable>
      )}
      {isDriver && order.status === OrderStatus.IN_PROGRESS && (
        <View style={[card.base, { marginBottom: 12 }]}>
          {!showDeliverForm ? (
            <Pressable
              style={[btn.primary, { backgroundColor: C.success }]}
              onPress={() => setShowDeliverForm(true)}
            >
              <Text style={btn.primaryText}>✓ Xác nhận đã giao</Text>
            </Pressable>
          ) : (
            <>
              <Text style={{ fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 8 }}>Xác nhận giao hàng thành công?</Text>
              <TextInput
                style={[s.textarea, { marginBottom: 10 }]}
                value={deliveryNote}
                onChangeText={setDeliveryNote}
                placeholder="Ghi chú khi giao (tuỳ chọn): đã giao cho bảo vệ, để trước cửa..."
                placeholderTextColor={C.placeholder}
                multiline
                numberOfLines={2}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  style={[btn.primary, { flex: 1, backgroundColor: C.success, opacity: actionLoading ? 0.5 : 1 }]}
                  onPress={markDelivered}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={btn.primaryText}>✓ Xác nhận</Text>
                  }
                </Pressable>
                <Pressable
                  style={[btn.outline, { paddingHorizontal: 16 }]}
                  onPress={() => { setShowDeliverForm(false); setDeliveryNote('') }}
                >
                  <Text style={btn.outlineText}>Huỷ</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      )}

      {/* Rating form */}
      {isSender && order.status === OrderStatus.DELIVERED && !order.rating && (
        <View style={card.base}>
          <Text style={s.sectionTitle}>Đánh giá tài xế</Text>
          <StarPicker value={score} onChange={setScore} />
          <TextInput
            style={[s.textarea, { marginTop: 12 }]}
            value={comment}
            onChangeText={setComment}
            placeholder="Nhận xét về tài xế (tuỳ chọn)..."
            placeholderTextColor={C.placeholder}
            multiline
            numberOfLines={3}
          />
          <Pressable
            style={[btn.primary, { marginTop: 12, backgroundColor: '#ca8a04', opacity: (!score || ratingLoading) ? 0.5 : 1 }]}
            onPress={submitRating}
            disabled={!score || ratingLoading}
          >
            {ratingLoading ? <ActivityIndicator color="#fff" /> : <Text style={btn.primaryText}>Gửi đánh giá</Text>}
          </Pressable>
        </View>
      )}

      {/* Existing rating */}
      {order.rating && (
        <View style={[card.base, { backgroundColor: '#fefce8', borderWidth: 1, borderColor: '#fde68a' }]}>
          <View style={s.row}>
            <StarDisplay score={order.rating.score} size={16} />
            <Text style={{ color: C.textSec, fontSize: 13 }}>{order.rating.score}/5</Text>
          </View>
          {order.rating.comment ? <Text style={{ fontSize: 14, color: C.textSec, marginTop: 6 }}>{order.rating.comment}</Text> : null}
        </View>
      )}

      {/* Bids list */}
      {order.bids?.length > 0 && (
        <View style={card.base}>
          <Text style={s.sectionTitle}>{order.bids.length} tài xế đã báo giá</Text>
          {order.bids.map(bid => {
            const profile = bid.driver?.driver_profile
            const diff = bid.price - order.budget_price
            return (
              <View
                key={bid.id}
                style={[s.bidCard, bid.status === BidStatus.ACCEPTED && s.bidAccepted, bid.status === BidStatus.REJECTED && { opacity: 0.5 }]}
              >
                <View style={s.row}>
                  <View style={s.row}>
                    <View style={s.avatar}><Text style={s.avatarText}>{(bid.driver?.name || '?')[0]}</Text></View>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={s.personName}>{bid.driver?.name}</Text>
                        <StatusBadge status={bid.status} />
                      </View>
                      {profile?.rating_count > 0 ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <StarDisplay score={Math.round(profile.rating_avg)} size={11} />
                          <Text style={{ fontSize: 11, color: C.textSec }}>{Number(profile.rating_avg).toFixed(1)} ({profile.rating_count})</Text>
                        </View>
                      ) : <Text style={{ fontSize: 11, color: C.placeholder }}>Chưa có đánh giá</Text>}
                      {profile?.vehicle_type && <Text style={s.vehicleTag}>{profile.vehicle_type}</Text>}
                    </View>
                  </View>

                  {isSender && order.status === OrderStatus.OPEN && bid.status === BidStatus.PENDING && (
                    <Pressable style={s.chooseBtn} onPress={() => acceptBid(bid.id)} disabled={actionLoading}>
                      <Text style={s.chooseBtnText}>Chọn</Text>
                    </Pressable>
                  )}
                </View>

                <View style={[s.row, { marginTop: 8 }]}>
                  <Text style={s.bidPrice}>{formatPrice(bid.price)}</Text>
                  {diff !== 0 && (
                    <Text style={{ fontSize: 12, fontWeight: '600', color: diff < 0 ? C.success : C.error }}>
                      {diff < 0 ? `↓ ${formatPrice(Math.abs(diff))}` : `↑ ${formatPrice(diff)}`}
                    </Text>
                  )}
                </View>
                {bid.note ? <Text style={{ fontSize: 12, color: C.textSec, marginTop: 4, fontStyle: 'italic' }}>"{bid.note}"</Text> : null}
              </View>
            )
          })}
        </View>
      )}

      {/* My bid */}
      {myBid && (
        <View style={[card.base, { backgroundColor: C.primaryLight, borderWidth: 1, borderColor: '#bfdbfe' }]}>
          <View style={s.row}>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.primary }}>Báo giá của bạn</Text>
              <Text style={[s.bidPrice, { marginTop: 4 }]}>{formatPrice(myBid.price)}</Text>
              <View style={{ marginTop: 6 }}><StatusBadge status={myBid.status} /></View>
            </View>
            {order.status === OrderStatus.OPEN && myBid.status === BidStatus.PENDING && (
              <Pressable style={[btn.danger, { paddingHorizontal: 14, paddingVertical: 8 }]} onPress={withdrawBid} disabled={actionLoading}>
                <Text style={btn.dangerText}>Rút</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Driver bid form */}
      {!isSender && user?.driver_profile && order.status === OrderStatus.OPEN && !myBid && (
        <View style={card.base}>
          <Text style={s.sectionTitle}>Đặt giá</Text>
          {user.driver_profile && !user.driver_profile.is_active && (
            <View style={{ backgroundColor: '#fffbeb', borderRadius: 8, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#fde68a' }}>
              <Text style={{ fontSize: 13, color: '#92400e' }}>⚠️ Bạn đang offline. Bật online trong hồ sơ để báo giá.</Text>
            </View>
          )}
          <Text style={{ fontSize: 12, color: C.textSec, marginBottom: 10 }}>Giá đăng: {formatPrice(order.budget_price)}</Text>
          <TextInput
            style={s.input}
            value={bidPrice}
            onChangeText={setBidPrice}
            placeholder="Giá của bạn (VND)"
            placeholderTextColor={C.placeholder}
            keyboardType="numeric"
          />
          <TextInput
            style={[s.textarea, { marginTop: 10 }]}
            value={bidNote}
            onChangeText={setBidNote}
            placeholder="Ghi chú (tuỳ chọn)"
            placeholderTextColor={C.placeholder}
            multiline
            numberOfLines={2}
          />
          <Pressable
            style={[btn.primary, { marginTop: 12, opacity: (!bidPrice || bidLoading) ? 0.5 : 1 }]}
            onPress={submitBid}
            disabled={!bidPrice || bidLoading}
          >
            {bidLoading ? <ActivityIndicator color="#fff" /> : <Text style={btn.primaryText}>Gửi báo giá</Text>}
          </Pressable>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, fontSize: 17, fontWeight: '800', color: C.text },
  desc: { fontSize: 14, color: C.textSec, marginTop: 6 },
  addrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  addrDot: { fontSize: 14, marginTop: 1 },
  addr: { flex: 1, fontSize: 14, color: C.text },
  note: { fontSize: 13, color: C.textSec, backgroundColor: C.bg, borderRadius: 8, padding: 10, marginBottom: 4 },
  deadline: { fontSize: 13, color: '#b91c1c', backgroundColor: '#fef2f2', borderRadius: 8, padding: 10, marginBottom: 4, borderWidth: 1, borderColor: '#fecaca' },
  deliveryNote: { fontSize: 13, color: '#15803d', backgroundColor: '#f0fdf4', borderRadius: 8, padding: 10, marginBottom: 4, borderWidth: 1, borderColor: '#bbf7d0' },
  priceLabel: { fontSize: 11, color: C.placeholder },
  price: { fontSize: 16, fontWeight: '800', color: C.primary },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 12 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: C.border, backgroundColor: C.white, marginTop: 2 },
  dotDone: { backgroundColor: C.success, borderColor: C.success },
  line: { width: 2, flex: 1, minHeight: 16, backgroundColor: C.border, marginTop: 2 },
  lineDone: { backgroundColor: '#86efac' },
  timelineLabel: { fontSize: 13, fontWeight: '600', color: C.text },
  timelineSub: { fontSize: 11, color: C.placeholder, marginTop: 1 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: C.primary },
  personLabel: { fontSize: 11, color: C.placeholder },
  personName: { fontSize: 14, fontWeight: '700', color: C.text },
  personSub: { fontSize: 12, color: C.textSec },
  bidCard: { borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, marginBottom: 10, backgroundColor: C.bg },
  bidAccepted: { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
  bidPrice: { fontSize: 15, fontWeight: '800', color: C.primary },
  vehicleTag: { fontSize: 10, color: C.textSec, backgroundColor: C.border, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 99, alignSelf: 'flex-start', marginTop: 2 },
  chooseBtn: { backgroundColor: C.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  chooseBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text, backgroundColor: C.white },
  textarea: { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text, backgroundColor: C.white, height: 72, textAlignVertical: 'top' },
})
