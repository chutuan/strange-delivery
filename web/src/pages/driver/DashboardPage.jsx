import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Star, TrendingUp, Package, CheckCircle2, ChevronRight, Award } from 'lucide-react'
import styled, { css } from 'styled-components'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import api from '../../lib/api'
import { formatPrice, formatDateTime } from '../../lib/format'
import Spinner from '../../components/Spinner'

// ─── Styled Components ────────────────────────────────────

const PageHeader = styled.div`
  margin-bottom: 24px;
`

const PageTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #0F172A;
`

const PageSub = styled.p`
  font-size: 13px;
  color: #94A3B8;
  margin-top: 2px;
`

const LEVEL_STYLE = {
  new:    { color: '#64748B', bg: '#F1F5F9' },
  bronze: { color: '#B45309', bg: '#FEF3C7' },
  silver: { color: '#475569', bg: '#E2E8F0' },
  gold:   { color: '#B8860B', bg: '#FEF9C3' },
}

const LevelBanner = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`

const LevelTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 10px;
`

const LevelChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 700;
  border-radius: 9999px;
  padding: 4px 12px;
  color: ${p => p.$color};
  background: ${p => p.$bg};
`

const NextText = styled.span`
  font-size: 12px;
  color: #94A3B8;
`

const Bar = styled.div`
  height: 8px;
  background: #F1F5F9;
  border-radius: 9999px;
  overflow: hidden;
`

const BarFill = styled.div`
  height: 100%;
  border-radius: 9999px;
  transition: width 0.3s ease;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
`

const StatBox = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`

const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${p => p.$bg};
  color: ${p => p.$color};
`

const StatInfo = styled.div`
  min-width: 0;
`

const StatLabel = styled.p`
  font-size: 11px;
  color: #64748B;
  margin-bottom: 2px;
`

const StatValue = styled.p`
  font-size: 20px;
  font-weight: 700;
  color: #0F172A;
  line-height: 1.2;
`

const StatSub = styled.p`
  font-size: 11px;
  color: #94A3B8;
  margin-top: 2px;
`

const ProgressCard = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`

const ProgressTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`

const ProgressLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const ProgressIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${p => p.$bg};
  color: ${p => p.$color};
`

const ProgressTitle = styled.p`
  font-size: 11px;
  color: #64748B;
`

const ProgressValue = styled.p`
  font-size: 20px;
  font-weight: 700;
  color: #0F172A;
`

const ProgressSuffix = styled.span`
  font-size: 13px;
  font-weight: 400;
  color: #94A3B8;
`

const ProgressCountText = styled.span`
  font-size: 13px;
  color: #94A3B8;
`

const ProgressBar = styled.div`
  height: 8px;
  background: #F1F5F9;
  border-radius: 9999px;
  overflow: hidden;
`

const ProgressFill = styled.div`
  height: 100%;
  border-radius: 9999px;
  transition: width 0.7s ease;
  width: ${p => p.$pct}%;
  background: ${p => p.$gradient};
`

const ChartCard = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`

const ChartHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`

const ChartTitle = styled.h3`
  font-size: 13px;
  font-weight: 600;
  color: #1E293B;
`

const ChartSub = styled.p`
  font-size: 11px;
  color: #94A3B8;
  margin-top: 2px;
`

const TabToggle = styled.div`
  display: flex;
  align-items: center;
  background: #F1F5F9;
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
`

const TabBtn = styled.button`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  ${p => p.$active ? css`
    background: white;
    color: ${p.$activeColor || '#EA580C'};
    box-shadow: 0 1px 2px rgba(0,0,0,0.08);
  ` : css`
    background: transparent;
    color: #64748B;
    &:hover { color: #374151; }
  `}
`

const TooltipBox = styled.div`
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.07);
  padding: 8px 12px;
  font-size: 11px;
`

const TooltipTitle = styled.p`
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
`

const TooltipValue = styled.p`
  font-weight: 500;
  color: ${p => p.$color};
`

const RecentTitle = styled.h3`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
`

const RecentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const DeliveryLink = styled(Link)`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  transition: box-shadow 0.15s ease;
  text-decoration: none;
  &:hover { box-shadow: 0 2px 4px rgba(0,0,0,0.07); }
`

const DeliveryIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #ECFDF5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #16A34A;
`

const DeliveryInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const DeliveryTitle = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: #1E293B;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const DeliveryAddr = styled.p`
  font-size: 11px;
  color: #94A3B8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const DeliveryMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
`

const DeliveryPrice = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: #15803D;
`

const DeliveryDate = styled.span`
  font-size: 11px;
  color: #94A3B8;
`

const DeliveryChevron = styled.span`
  color: #CBD5E1;
  flex-shrink: 0;
  transition: color 0.15s ease;
  ${DeliveryLink}:hover & { color: #64748B; }
`

const EmptyWrap = styled.div`
  text-align: center;
  padding: 40px 0;
  color: #94A3B8;
`

const EmptyTruckIcon = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
  opacity: 0.3;
`

const EmptyText = styled.p`
  font-size: 13px;
  font-weight: 500;
`

const EmptyLink = styled(Link)`
  display: inline-block;
  margin-top: 12px;
  font-size: 13px;
  color: #F97316;
  &:hover { text-decoration: underline; }
`

const ErrorWrap = styled.div`
  text-align: center;
  padding: 80px 0;
`

const ErrorIcon = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
  color: #CBD5E1;
`

const ErrorMsg = styled.p`
  color: #64748B;
`

const SectionWrap = styled.div`
  margin-bottom: ${p => p.$mb || '0'};
`

// ─── Sub Components ───────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor }) {
  return (
    <StatBox>
      <StatIcon $bg={iconBg} $color={iconColor}>
        <Icon size={20} />
      </StatIcon>
      <StatInfo>
        <StatLabel>{label}</StatLabel>
        <StatValue>{value}</StatValue>
        {sub && <StatSub>{sub}</StatSub>}
      </StatInfo>
    </StatBox>
  )
}

function RatingBar({ avg, count }) {
  const pct = (avg / 5) * 100
  return (
    <ProgressCard>
      <ProgressTop>
        <ProgressLeft>
          <ProgressIcon $bg="#FEFCE8" $color="#EAB308">
            <Star size={20} style={{ fill: '#FBBF24' }} />
          </ProgressIcon>
          <div>
            <ProgressTitle>Đánh giá</ProgressTitle>
            <ProgressValue>{avg.toFixed(1)}<ProgressSuffix>/5</ProgressSuffix></ProgressValue>
          </div>
        </ProgressLeft>
        <ProgressCountText>{count} đánh giá</ProgressCountText>
      </ProgressTop>
      <ProgressBar>
        <ProgressFill $pct={pct} $gradient="linear-gradient(to right, #FBBF24, #F59E0B)" />
      </ProgressBar>
    </ProgressCard>
  )
}

function BidRate({ total, accepted }) {
  const pct = total > 0 ? Math.round((accepted / total) * 100) : 0
  return (
    <ProgressCard>
      <ProgressTop>
        <ProgressLeft>
          <ProgressIcon $bg="#FFF7ED" $color="#F97316">
            <TrendingUp size={20} />
          </ProgressIcon>
          <div>
            <ProgressTitle>Tỉ lệ trúng bid</ProgressTitle>
            <ProgressValue>{pct}<ProgressSuffix>%</ProgressSuffix></ProgressValue>
          </div>
        </ProgressLeft>
        <ProgressCountText>{accepted}/{total} bid</ProgressCountText>
      </ProgressTop>
      <ProgressBar>
        <ProgressFill $pct={pct} $gradient="linear-gradient(to right, #FB923C, #EA580C)" />
      </ProgressBar>
    </ProgressCard>
  )
}

function DailyChart({ data }) {
  const [activeTab, setActiveTab] = useState('orders')

  const shortDate = (d) => {
    const [, m, day] = d.split('-')
    return `${day}/${m}`
  }

  const chartData = data.map(r => ({
    ...r,
    label: shortDate(r.date),
    earningsK: Math.round(r.earnings / 1000),
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <TooltipBox>
        <TooltipTitle>{label}</TooltipTitle>
        {activeTab === 'orders' ? (
          <TooltipValue $color="#F97316">{payload[0]?.value} đơn</TooltipValue>
        ) : (
          <TooltipValue $color="#059669">{formatPrice(payload[0]?.value * 1000)}</TooltipValue>
        )}
      </TooltipBox>
    )
  }

  return (
    <ChartCard>
      <ChartHeader>
        <div>
          <ChartTitle>Hoạt động 30 ngày qua</ChartTitle>
          <ChartSub>
            {activeTab === 'orders' ? 'Số đơn giao thành công' : 'Doanh thu (nghìn đồng)'}
          </ChartSub>
        </div>
        <TabToggle>
          <TabBtn
            onClick={() => setActiveTab('orders')}
            $active={activeTab === 'orders'}
            $activeColor="#EA580C"
          >
            Đơn hàng
          </TabBtn>
          <TabBtn
            onClick={() => setActiveTab('earnings')}
            $active={activeTab === 'earnings'}
            $activeColor="#15803D"
          >
            Doanh thu
          </TabBtn>
        </TabToggle>
      </ChartHeader>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {activeTab === 'orders' ? (
            <Line
              type="monotone"
              dataKey="orders"
              stroke="#F97316"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#F97316' }}
            />
          ) : (
            <Line
              type="monotone"
              dataKey="earningsK"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#10b981' }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ─── Page ─────────────────────────────────────────────────

export default function DriverDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/driver/stats')
      .then(res => setStats(res.data))
      .catch(err => setError(err.response?.data?.message || 'Không thể tải thống kê.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  if (error) {
    return (
      <ErrorWrap>
        <ErrorIcon><Truck size={48} /></ErrorIcon>
        <ErrorMsg>{error}</ErrorMsg>
      </ErrorWrap>
    )
  }

  return (
    <div>
      <PageHeader>
        <PageTitle>Tổng quan</PageTitle>
        <PageSub>Thống kê hoạt động của bạn</PageSub>
      </PageHeader>

      {stats.level && (() => {
        const st = LEVEL_STYLE[stats.level.key] ?? LEVEL_STYLE.new
        const lvl = stats.level
        const pct = lvl.next_at
          ? Math.min(100, Math.round(((stats.total_delivered - lvl.min) / (lvl.next_at - lvl.min)) * 100))
          : 100
        const remaining = lvl.next_at ? Math.max(0, lvl.next_at - stats.total_delivered) : 0
        return (
          <LevelBanner>
            <LevelTop>
              <LevelChip $color={st.color} $bg={st.bg}><Award size={14} /> Cấp độ: {lvl.label}</LevelChip>
              {lvl.next_at
                ? <NextText>Còn {remaining} chuyến để lên {lvl.next_label}</NextText>
                : <NextText>Cấp độ cao nhất 🎉</NextText>}
            </LevelTop>
            {lvl.next_at && <Bar><BarFill style={{ width: pct + '%', background: st.color }} /></Bar>}
          </LevelBanner>
        )
      })()}

      <StatsGrid>
        <StatCard
          icon={CheckCircle2}
          label="Đã giao thành công"
          value={stats.total_delivered}
          sub="đơn hàng"
          iconBg="#ECFDF5"
          iconColor="#16A34A"
        />
        <StatCard
          icon={Package}
          label="Đang giao"
          value={stats.active_orders}
          sub="đơn đang chạy"
          iconBg="#FFF7ED"
          iconColor="#F97316"
        />
        <StatCard
          icon={TrendingUp}
          label="Tổng doanh thu"
          value={formatPrice(stats.total_earnings)}
          iconBg="#FFF7ED"
          iconColor="#F97316"
          sub="từ tất cả đơn"
        />
        <StatCard
          icon={Star}
          label="Đánh giá trung bình"
          value={stats.rating_avg.toFixed(1)}
          sub={`${stats.rating_count} lượt đánh giá`}
          iconBg="#FEFCE8"
          iconColor="#EAB308"
        />
      </StatsGrid>

      {stats.daily_stats && <DailyChart data={stats.daily_stats} />}

      <SectionWrap $mb="12px">
        <RatingBar avg={stats.rating_avg} count={stats.rating_count} />
      </SectionWrap>

      <SectionWrap $mb="24px">
        <BidRate total={stats.total_bids} accepted={stats.accepted_bids} />
      </SectionWrap>

      {stats.recent_deliveries.length > 0 && (
        <div>
          <RecentTitle>Giao hàng gần đây</RecentTitle>
          <RecentList>
            {stats.recent_deliveries.map(order => (
              <DeliveryLink key={order.id} to={`/orders/${order.order_code}`}>
                <DeliveryIcon>
                  <CheckCircle2 size={16} />
                </DeliveryIcon>
                <DeliveryInfo>
                  <DeliveryTitle>{order.title}</DeliveryTitle>
                  <DeliveryAddr>{order.delivery_address}</DeliveryAddr>
                  <DeliveryMeta>
                    <DeliveryPrice>{formatPrice(order.final_price)}</DeliveryPrice>
                    <span style={{ color: '#94A3B8', fontSize: 11 }}>·</span>
                    <DeliveryDate>{formatDateTime(order.delivered_at)}</DeliveryDate>
                  </DeliveryMeta>
                </DeliveryInfo>
                <DeliveryChevron>
                  <ChevronRight size={15} />
                </DeliveryChevron>
              </DeliveryLink>
            ))}
          </RecentList>
        </div>
      )}

      {stats.total_delivered === 0 && (
        <EmptyWrap>
          <EmptyTruckIcon><Truck size={40} /></EmptyTruckIcon>
          <EmptyText>Chưa có đơn nào được giao</EmptyText>
          <EmptyLink to="/orders/open">Tìm đơn ngay →</EmptyLink>
        </EmptyWrap>
      )}
    </div>
  )
}
