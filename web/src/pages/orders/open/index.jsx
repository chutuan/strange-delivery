import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Truck, Bike, Car, Zap, ListFilter,
  Search, SlidersHorizontal, Navigation, ChevronRight,
  Clock, PackageCheck, Star,
} from 'lucide-react'
import styled, { css } from 'styled-components'
import api from '../../../lib/api'
import { useAuth } from '../../../contexts/AuthContext'
import { formatPrice } from '../../../lib/format'
import Spinner from '../../../components/Spinner'
import Pagination from '../../../components/Pagination'
import { PageTitle, PageSubtitle } from '../../../styles/index'

const VEHICLE_ICON  = { motorbike: Bike, car: Car, truck: Truck }
const VEHICLE_LABEL = { motorbike: 'Xe máy', car: 'Ô tô', truck: 'Xe tải' }

const SORTS = [
  { value: 'newest',     label: 'Mới nhất' },
  { value: 'nearest',   label: 'Gần nhất' },
  { value: 'price_desc', label: 'Giá cao' },
  { value: 'price_asc',  label: 'Giá thấp' },
]

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)   return `${diff}s trước`
  if (diff < 3600) return `${Math.floor(diff / 60)}p trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h trước`
  return `${Math.floor(diff / 86400)}d trước`
}

// ─── Styled Components ────────────────────────────────────

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`

const GpsButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid;
  transition: all 0.15s ease;
  cursor: pointer;
  ${p => p.$status === 'granted' && css`
    background: #F97316;
    border-color: #F97316;
    color: white;
  `}
  ${p => p.$status === 'denied' && css`
    background: #FEF2F2;
    border-color: #FECACA;
    color: #F87171;
  `}
  ${p => (p.$status === 'idle' || p.$status === 'loading') && css`
    background: white;
    border-color: #E2E8F0;
    color: #64748B;
    &:hover {
      border-color: #FDBA74;
      color: #F97316;
    }
  `}
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`

const SearchForm = styled.form`
  margin-bottom: 16px;
`

const SearchRow = styled.div`
  display: flex;
  gap: 8px;
`

const SearchInputWrap = styled.div`
  position: relative;
  flex: 1;
`

const SearchIcon = styled.span`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  display: flex;
`

const SearchInput = styled.input`
  width: 100%;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 10px 12px 10px 36px;
  font-size: 13px;
  outline: none;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  font-family: inherit;
  transition: all 0.15s ease;
  &:focus {
    border-color: #F97316;
    box-shadow: 0 0 0 3px rgba(249,115,22,0.15);
  }
  &::placeholder { color: #CBD5E1; }
`

const FilterToggleBtn = styled.button`
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  transition: all 0.15s ease;
  cursor: pointer;
  ${p => p.$active ? css`
    background: #F97316;
    border-color: #F97316;
    color: white;
  ` : css`
    background: white;
    border-color: #E2E8F0;
    color: #475569;
    &:hover { border-color: #CBD5E1; }
  `}
`

const SearchSubmitBtn = styled.button`
  background: #F97316;
  color: white;
  font-size: 13px;
  font-weight: 600;
  padding: 0 16px;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  transition: background 0.15s ease;
  cursor: pointer;
  &:hover { background: #EA580C; }
`

const FilterPanel = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 16px;
  margin-top: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const FilterSectionLabel = styled.p`
  font-size: 11px;
  font-weight: 600;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
`

const SortPills = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`

const SortPill = styled.button`
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  transition: all 0.15s ease;
  cursor: pointer;
  border: none;
  ${p => p.$active ? css`
    background: #F97316;
    color: white;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  ` : css`
    background: #F1F5F9;
    color: #475569;
    &:hover { background: #E2E8F0; }
  `}
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`

const PriceInputWrap = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`

const PriceInput = styled.input`
  flex: 1;
  border: 1px solid #E2E8F0;
  background: white;
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 13px;
  outline: none;
  font-family: inherit;
  transition: all 0.15s ease;
  &:focus {
    border-color: #F97316;
    box-shadow: 0 0 0 3px rgba(249,115,22,0.15);
  }
  &::placeholder { color: #CBD5E1; }
`

const PriceSep = styled.span`
  color: #CBD5E1;
  font-size: 13px;
`

const FilterActions = styled.div`
  display: flex;
  gap: 8px;
  padding-top: 4px;
`

const ApplyBtn = styled.button`
  flex: 1;
  background: #F97316;
  color: white;
  font-size: 13px;
  font-weight: 600;
  padding: 10px;
  border-radius: 12px;
  transition: background 0.15s ease;
  cursor: pointer;
  border: none;
  &:hover { background: #EA580C; }
`

const ResetBtn = styled.button`
  padding: 0 16px;
  color: #64748B;
  font-size: 13px;
  font-weight: 500;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  transition: all 0.15s ease;
  cursor: pointer;
  background: white;
  &:hover { background: #F8FAFC; }
`

const OrderList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const ErrorMsg = styled.div`
  text-align: center;
  padding: 64px 0;
  color: #F87171;
  font-size: 13px;
`

const EmptyWrap = styled.div`
  text-align: center;
  padding: 96px 0;
`

const EmptyIconBox = styled.div`
  width: 64px;
  height: 64px;
  background: #F1F5F9;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: #CBD5E1;
`

const EmptyTitle = styled.p`
  font-weight: 600;
  color: #64748B;
  margin-bottom: 4px;
`

const EmptyDesc = styled.p`
  font-size: 13px;
  color: #94A3B8;
`

const ClearFilterBtn = styled.button`
  margin-top: 16px;
  font-size: 13px;
  color: #F97316;
  font-weight: 500;
  background: none;
  border: none;
  cursor: pointer;
  &:hover { text-decoration: underline; }
`

const NoDriverWrap = styled.div`
  max-width: 320px;
  margin: 0 auto;
  text-align: center;
  padding: 96px 0;
`

const NoDriverIcon = styled.div`
  width: 80px;
  height: 80px;
  background: #FFF7ED;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: #FB923C;
`

const NoDriverTitle = styled.h2`
  font-size: 17px;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 8px;
`

const NoDriverDesc = styled.p`
  color: #94A3B8;
  font-size: 13px;
  margin-bottom: 24px;
  line-height: 1.6;
`

const RegisterBtn = styled.button`
  background: #F97316;
  color: white;
  font-size: 13px;
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
  &:hover { background: #EA580C; }
`

// ─── OrderCard ────────────────────────────────────────────

const CardLink = styled(Link)`
  background: white;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
  box-shadow: 0 1px 2px rgba(16,24,40,0.04);
  transition: all 0.15s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  text-decoration: none;
  &:hover {
    box-shadow: 0 4px 12px rgba(16,24,40,0.08);
    border-color: #CBD5E1;
  }
`

const CardInner = styled.div`
  padding: 16px;
`

const CardTopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
`

const CardTitleArea = styled.div`
  flex: 1;
  min-width: 0;
`

const TagsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 2px;
`

const TypeTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 9999px;
  background: ${p => p.$bg};
  color: ${p => p.$color};
  border: 1px solid ${p => p.$border};
`

const DistanceTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #64748B;
`

const CardTitle = styled.h3`
  font-weight: 600;
  color: #0F172A;
  font-size: 13px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ChevronIcon = styled.span`
  color: #CBD5E1;
  flex-shrink: 0;
  margin-top: 2px;
  transition: color 0.15s ease;
  ${CardLink}:hover & { color: #FB923C; }
`

const RouteWrap = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
`

const RouteIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 4px;
  flex-shrink: 0;
`

const DotGreen = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22C55E;
  box-shadow: 0 0 0 3px #DCFCE7;
`

const RouteFlex = styled.div`
  width: 1px;
  flex: 1;
  background: #E2E8F0;
  margin: 4px 0;
`

const DotRed = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #EF4444;
  box-shadow: 0 0 0 3px #FEE2E2;
`

const AddressCol = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
`

const AddrText = styled.p`
  font-size: 11px;
  color: #475569;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #F8FAFC;
`

const CardPrice = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: #EA580C;
  letter-spacing: -0.02em;
`

const FooterMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #94A3B8;
`

const SenderAvatar = styled.span`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #FFEDD5;
  color: #EA580C;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

const SenderName = styled.span`
  font-size: 11px;
  color: #64748B;
  font-weight: 500;
  display: none;
  @media (min-width: 640px) { display: block; }
`

const RatingStar = styled.span`
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: #CA8A04;
  font-weight: 600;
`

function OrderCard({ order }) {
  const VIcon = VEHICLE_ICON[order.vehicle_type]
  const isInstant = order.order_type === 'instant'

  return (
    <CardLink to={`/orders/${order.order_code}`}>
      <CardInner>
        <CardTopRow>
          <CardTitleArea>
            <TagsRow>
              {isInstant ? (
                <TypeTag $bg="#FFFBEB" $color="#D97706" $border="#FDE68A">
                  <Zap size={10} strokeWidth={2.5} /> Giao luôn
                </TypeTag>
              ) : (
                <TypeTag $bg="#FFF7ED" $color="#EA580C" $border="#FDBA74">
                  <ListFilter size={10} strokeWidth={2.5} /> Đấu giá
                </TypeTag>
              )}
              {order.distance_km != null && (
                <DistanceTag>
                  <Navigation size={10} style={{ color: '#FB923C' }} />
                  {order.distance_km < 1
                    ? `${Math.round(order.distance_km * 1000)} m`
                    : `${order.distance_km} km`}
                </DistanceTag>
              )}
            </TagsRow>
            <CardTitle>{order.title}</CardTitle>
          </CardTitleArea>
          <ChevronIcon>
            <ChevronRight size={16} />
          </ChevronIcon>
        </CardTopRow>

        <RouteWrap>
          <RouteIndicator>
            <DotGreen />
            <RouteFlex />
            <DotRed />
          </RouteIndicator>
          <AddressCol>
            <AddrText>{order.pickup_address}</AddrText>
            <AddrText>{order.delivery_address}</AddrText>
          </AddressCol>
        </RouteWrap>

        <CardFooter>
          <CardPrice>{formatPrice(order.budget_price)}</CardPrice>
          <FooterMeta>
            {VIcon && (
              <MetaItem>
                <VIcon size={13} />
                {VEHICLE_LABEL[order.vehicle_type]}
              </MetaItem>
            )}
            {order.created_at && (
              <MetaItem>
                <Clock size={11} />
                {timeAgo(order.created_at)}
              </MetaItem>
            )}
            {order.sender && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SenderAvatar>{order.sender.name?.charAt(0).toUpperCase()}</SenderAvatar>
                <SenderName>{order.sender.name}</SenderName>
                {order.sender.sender_rating_count > 0 ? (
                  <RatingStar>
                    <Star size={11} style={{ fill: '#FBBF24', color: '#FBBF24' }} />
                    {Number(order.sender.sender_rating_avg).toFixed(1)}
                  </RatingStar>
                ) : order.sender.completed_orders > 0 ? (
                  <RatingStar style={{ color: '#059669' }}>
                    <PackageCheck size={11} />
                    {order.sender.completed_orders}
                  </RatingStar>
                ) : null}
              </span>
            )}
          </FooterMeta>
        </CardFooter>
      </CardInner>
    </CardLink>
  )
}

// ─── Page ─────────────────────────────────────────────────

export default function OpenOrdersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [meta, setMeta]       = useState(null)
  const [error, setError]     = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [driverLat, setDriverLat] = useState(null)
  const [driverLng, setDriverLng] = useState(null)
  const [geoStatus, setGeoStatus] = useState('idle')

  const [q, setQ]               = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort]         = useState('newest')
  const [applied, setApplied]   = useState({ q: '', min_price: '', max_price: '', sort: 'newest' })

  const requestLocation = () => {
    if (!navigator.geolocation) { setGeoStatus('denied'); return }
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDriverLat(pos.coords.latitude)
        setDriverLng(pos.coords.longitude)
        setGeoStatus('granted')
        setSort('nearest')
        setApplied(a => ({ ...a, sort: 'nearest' }))
      },
      () => setGeoStatus('denied'),
      { timeout: 8000, maximumAge: 60000 },
    )
  }

  useEffect(() => {
    if (!user?.driver_profile) return
    setLoading(true)
    const params = { page, sort: applied.sort }
    if (applied.q)         params.q         = applied.q
    if (applied.min_price) params.min_price = applied.min_price
    if (applied.max_price) params.max_price = applied.max_price
    if (driverLat && driverLng) { params.lat = driverLat; params.lng = driverLng }

    api.get('/orders/open', { params })
      .then(res => { setOrders(res.data.data); setMeta(res.data); setError('') })
      .catch(err => setError(err.response?.data?.message || 'Lỗi tải đơn.'))
      .finally(() => setLoading(false))
  }, [page, applied, user, driverLat, driverLng])

  const applyFilters = (e) => {
    e?.preventDefault()
    setPage(1)
    setApplied({ q, min_price: minPrice, max_price: maxPrice, sort })
  }

  const resetFilters = () => {
    setQ(''); setMinPrice(''); setMaxPrice(''); setSort('newest')
    setPage(1)
    setApplied({ q: '', min_price: '', max_price: '', sort: 'newest' })
  }

  const hasActiveFilters = applied.q || applied.min_price || applied.max_price || applied.sort !== 'newest'

  if (!user?.driver_profile) {
    return (
      <NoDriverWrap>
        <NoDriverIcon>
          <Truck size={36} />
        </NoDriverIcon>
        <NoDriverTitle>Bạn chưa đăng ký tài xế</NoDriverTitle>
        <NoDriverDesc>
          Đăng ký để bắt đầu nhận đơn và kiếm thêm thu nhập.
        </NoDriverDesc>
        <RegisterBtn onClick={() => navigate('/driver/register')}>
          Đăng ký tài xế
        </RegisterBtn>
      </NoDriverWrap>
    )
  }

  return (
    <div>
      <PageHeader>
        <div>
          <PageTitle>Đơn đang mở</PageTitle>
          {meta && !loading && (
            <PageSubtitle>{meta.total} đơn có sẵn</PageSubtitle>
          )}
        </div>
        <GpsButton
          onClick={requestLocation}
          disabled={geoStatus === 'loading'}
          $status={geoStatus}
        >
          <Navigation size={13} />
          {geoStatus === 'granted' ? 'GPS bật' : geoStatus === 'denied' ? 'Bị từ chối' : geoStatus === 'loading' ? 'Đang lấy...' : 'Bật GPS'}
        </GpsButton>
      </PageHeader>

      <SearchForm onSubmit={applyFilters}>
        <SearchRow>
          <SearchInputWrap>
            <SearchIcon><Search size={15} /></SearchIcon>
            <SearchInput
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Tìm theo tiêu đề, địa chỉ..."
            />
          </SearchInputWrap>
          <FilterToggleBtn
            type="button"
            onClick={() => setShowFilters(s => !s)}
            $active={showFilters || hasActiveFilters}
          >
            <SlidersHorizontal size={14} />
            {hasActiveFilters && !showFilters ? '●' : 'Lọc'}
          </FilterToggleBtn>
          <SearchSubmitBtn type="submit">Tìm</SearchSubmitBtn>
        </SearchRow>

        {showFilters && (
          <FilterPanel>
            <div>
              <FilterSectionLabel>Sắp xếp</FilterSectionLabel>
              <SortPills>
                {SORTS.map(s => (
                  <SortPill
                    key={s.value}
                    type="button"
                    disabled={s.value === 'nearest' && geoStatus !== 'granted'}
                    onClick={() => setSort(s.value)}
                    title={s.value === 'nearest' && geoStatus !== 'granted' ? 'Cần bật GPS trước' : ''}
                    $active={sort === s.value}
                  >
                    {s.value === 'nearest' && <Navigation size={10} style={{ display: 'inline', marginRight: 4 }} />}
                    {s.label}
                  </SortPill>
                ))}
              </SortPills>
            </div>
            <div>
              <FilterSectionLabel>Khoảng giá (VND)</FilterSectionLabel>
              <PriceInputWrap>
                <PriceInput
                  type="number" min="0" value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  placeholder="Từ"
                />
                <PriceSep>—</PriceSep>
                <PriceInput
                  type="number" min="0" value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  placeholder="Đến"
                />
              </PriceInputWrap>
            </div>
            <FilterActions>
              <ApplyBtn type="submit">Áp dụng</ApplyBtn>
              <ResetBtn type="button" onClick={resetFilters}>Đặt lại</ResetBtn>
            </FilterActions>
          </FilterPanel>
        )}
      </SearchForm>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorMsg>{error}</ErrorMsg>
      ) : orders.length === 0 ? (
        <EmptyWrap>
          <EmptyIconBox>
            <Truck size={28} />
          </EmptyIconBox>
          <EmptyTitle>Không có đơn nào</EmptyTitle>
          <EmptyDesc>Thử đổi bộ lọc hoặc quay lại sau</EmptyDesc>
          {hasActiveFilters && (
            <ClearFilterBtn onClick={resetFilters}>Xoá bộ lọc</ClearFilterBtn>
          )}
        </EmptyWrap>
      ) : (
        <OrderList>
          {orders.map(order => <OrderCard key={order.id} order={order} />)}
        </OrderList>
      )}

      <Pagination page={page} lastPage={meta?.last_page} onPage={setPage} />
    </div>
  )
}
