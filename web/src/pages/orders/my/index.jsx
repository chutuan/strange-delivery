import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Package } from 'lucide-react'
import styled from 'styled-components'
import api from '../../../lib/api'
import Spinner from '../../../components/Spinner'
import Pagination from '../../../components/Pagination'
import SummaryBar from './SummaryBar'
import OrderCard from './OrderCard'
import { PageTitle, PageSubtitle, EmptyStateWrapper, EmptyIcon } from '../../../styles/index'

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`

const HeaderLeft = styled.div``

const CreateButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #F97316;
  color: white;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 12px;
  transition: background 0.15s ease;
  box-shadow: 0 1px 3px rgba(249,115,22,0.3);
  &:hover { background: #EA580C; }
`

const OrderList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
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

const TextButton = styled.button`
  margin-top: 12px;
  font-size: 13px;
  color: #F97316;
  background: none;
  border: none;
  cursor: pointer;
  &:hover { text-decoration: underline; }
`

const CreateLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  background: #F97316;
  color: white;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 12px;
  &:hover { background: #EA580C; }
`

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [counts, setCounts] = useState({})
  const [filter, setFilter] = useState('in_progress')

  useEffect(() => {
    setLoading(true)
    const params = { page }
    if (filter) params.status = filter
    api.get('/orders/mine', { params })
      .then(res => {
        setOrders(res.data.data)
        setMeta(res.data)
        setCounts(res.data.counts ?? {})
      })
      .finally(() => setLoading(false))
  }, [page, filter])

  const handleFilter = (status) => {
    setFilter(status)
    setPage(1)
  }

  return (
    <div>
      <PageHeader>
        <HeaderLeft>
          <PageTitle>Đơn của tôi</PageTitle>
          {meta && <PageSubtitle>{meta.total} đơn hàng</PageSubtitle>}
        </HeaderLeft>
        <CreateButton to="/orders/create">
          <Plus size={16} /> Tạo đơn
        </CreateButton>
      </PageHeader>

      <SummaryBar counts={counts} activeFilter={filter} onFilter={handleFilter} />

      {loading ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <EmptyStateWrapper>
          <EmptyIcon>
            <Package size={24} />
          </EmptyIcon>
          {filter ? (
            <>
              <EmptyTitle>Không có đơn nào</EmptyTitle>
              <EmptyDesc>Không có đơn với trạng thái này</EmptyDesc>
              <TextButton onClick={() => handleFilter(null)}>
                Xem tất cả đơn
              </TextButton>
            </>
          ) : (
            <>
              <EmptyTitle>Bạn chưa có đơn nào</EmptyTitle>
              <EmptyDesc>Nhấn &quot;Tạo đơn&quot; để bắt đầu</EmptyDesc>
              <CreateLink to="/orders/create">
                <Plus size={15} /> Tạo đơn đầu tiên
              </CreateLink>
            </>
          )}
        </EmptyStateWrapper>
      ) : (
        <OrderList>
          {orders.map(order => <OrderCard key={order.id} order={order} />)}
        </OrderList>
      )}

      <Pagination page={page} lastPage={meta?.last_page} onPage={setPage} />
    </div>
  )
}
