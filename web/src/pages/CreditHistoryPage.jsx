import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, History, Loader2, ReceiptText, Wallet } from 'lucide-react'
import styled, { keyframes } from 'styled-components'
import api from '../lib/api'
import Spinner from '../components/Spinner'

const formatDate = (d) =>
  new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

const TX_CONFIG = {
  topup: {
    label: 'Nạp credit',
    icon: ArrowDownLeft,
    bg: '#ECFDF5',
    iconColor: '#10B981',
    amountPrefix: '+',
    amountColor: '#059669',
  },
  bid_deduction: {
    label: 'Báo giá',
    icon: ReceiptText,
    bg: '#FEF2F2',
    iconColor: '#F87171',
    amountPrefix: '',
    amountColor: '#EF4444',
  },
}

const TX_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'topup', label: 'Nạp tiền' },
  { value: 'bid_deduction', label: 'Báo giá' },
]

// ─── Styled Components ────────────────────────────────────

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`

const BackLink = styled(Link)`
  color: #94A3B8;
  transition: color 0.15s ease;
  display: flex;
  &:hover { color: #374151; }
`

const PageTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #111827;
`

const BalanceCard = styled.div`
  background: linear-gradient(to right, #F97316, #FB923C);
  color: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
`

const BalanceLabel = styled.p`
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  margin-bottom: 4px;
`

const BalanceValue = styled.p`
  font-size: 30px;
  font-weight: 700;
`

const BalanceUnit = styled.span`
  font-size: 20px;
  font-weight: 500;
  color: rgba(255,255,255,0.7);
`

const BalanceNote = styled.p`
  font-size: 11px;
  color: rgba(255,255,255,0.7);
  margin-top: 6px;
`

const TopUpLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(255,255,255,0.2);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  transition: background 0.15s ease;
  &:hover { background: rgba(255,255,255,0.3); }
`

const FilterRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  align-items: center;
`

const FilterBtn = styled.button`
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
  ${p => p.$active ? `
    background: #F97316;
    color: white;
  ` : `
    background: white;
    border: 1px solid #E5E7EB;
    color: #374151;
    &:hover { border-color: #D1D5DB; }
  `}
`

const TotalCount = styled.span`
  margin-left: auto;
  font-size: 11px;
  color: #9CA3AF;
`

const TxList = styled.div`
  background: white;
  border: 1px solid #F3F4F6;
  border-radius: 16px;
  padding: 0 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`

const TxItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #F9FAFB;
  &:last-child { border-bottom: none; }
`

const TxIconBox = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${p => p.$bg};
  color: ${p => p.$color};
`

const TxInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const TxDesc = styled.p`
  font-size: 13px;
  font-weight: 500;
  color: #1F2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const TxDate = styled.p`
  font-size: 11px;
  color: #9CA3AF;
  margin-top: 2px;
`

const TxAmount = styled.span`
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
  color: ${p => p.$color};
`

const EmptyWrap = styled.div`
  text-align: center;
  padding: 80px 0;
`

const EmptyIconBox = styled.div`
  width: 56px;
  height: 56px;
  background: #F3F4F6;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  color: #D1D5DB;
`

const EmptyText = styled.p`
  font-size: 13px;
  color: #9CA3AF;
`

const spin = keyframes`to { transform: rotate(360deg); }`

const LoadMoreBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #F97316;
  font-weight: 600;
  border: 1px solid #FDBA74;
  background: white;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s ease;
  margin: 16px auto 0;
  &:hover:not(:disabled) { background: #FFF7ED; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

// ─── TransactionItem ──────────────────────────────────────

function TransactionItem({ tx }) {
  const cfg = TX_CONFIG[tx.type] ?? {
    label: tx.type,
    icon: ArrowUpRight,
    bg: '#F3F4F6',
    iconColor: '#9CA3AF',
    amountPrefix: tx.amount > 0 ? '+' : '',
    amountColor: tx.amount > 0 ? '#059669' : '#EF4444',
  }
  const Icon = cfg.icon

  return (
    <TxItem>
      <TxIconBox $bg={cfg.bg} $color={cfg.iconColor}>
        <Icon size={16} />
      </TxIconBox>
      <TxInfo>
        <TxDesc>{tx.description}</TxDesc>
        <TxDate>{formatDate(tx.created_at)}</TxDate>
      </TxInfo>
      <TxAmount $color={cfg.amountColor}>
        {cfg.amountPrefix}{tx.amount} credit
      </TxAmount>
    </TxItem>
  )
}

// ─── Page ─────────────────────────────────────────────────

export default function CreditHistoryPage() {
  const [credits, setCredits]           = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]           = useState(true)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [page, setPage]                 = useState(1)
  const [lastPage, setLastPage]         = useState(1)
  const [total, setTotal]               = useState(0)
  const [filter, setFilter]             = useState('')

  useEffect(() => {
    api.get('/driver/credits').then(res => setCredits(res.data.credits)).catch(() => {})
  }, [])

  const fetchPage = (p = 1, type = filter) => {
    if (p === 1) { setLoading(true); setTransactions([]) } else setLoadingMore(true)
    const params = { page: p }
    if (type) params.type = type
    api.get('/driver/credits/history', { params })
      .then(res => {
        setTransactions(prev => p === 1 ? res.data.data : [...prev, ...res.data.data])
        setLastPage(res.data.last_page)
        setTotal(res.data.total)
        setPage(p)
      })
      .finally(() => { setLoading(false); setLoadingMore(false) })
  }

  useEffect(() => { fetchPage(1, filter) }, [filter])

  return (
    <div>
      <PageHeader>
        <BackLink to="/top-up">
          <ArrowLeft size={20} />
        </BackLink>
        <PageTitle>Lịch sử credit</PageTitle>
      </PageHeader>

      <BalanceCard>
        <BalanceLabel>Số dư hiện tại</BalanceLabel>
        <BalanceValue>
          {credits ?? '—'} <BalanceUnit>credit</BalanceUnit>
        </BalanceValue>
        <BalanceNote>1 credit = 1.000₫ · Mỗi lần báo giá tốn 1 credit</BalanceNote>
        <TopUpLink to="/top-up">
          <Wallet size={13} /> Nạp thêm credit
        </TopUpLink>
      </BalanceCard>

      <FilterRow>
        {TX_FILTERS.map(f => (
          <FilterBtn
            key={f.value}
            onClick={() => setFilter(f.value)}
            $active={filter === f.value}
          >
            {f.label}
          </FilterBtn>
        ))}
        {!loading && <TotalCount>{total} giao dịch</TotalCount>}
      </FilterRow>

      {loading ? (
        <Spinner />
      ) : transactions.length === 0 ? (
        <EmptyWrap>
          <EmptyIconBox>
            <History size={24} />
          </EmptyIconBox>
          <EmptyText>Chưa có giao dịch nào</EmptyText>
        </EmptyWrap>
      ) : (
        <TxList>
          {transactions.map(tx => <TransactionItem key={tx.id} tx={tx} />)}
        </TxList>
      )}

      {page < lastPage && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <LoadMoreBtn
            onClick={() => fetchPage(page + 1)}
            disabled={loadingMore}
          >
            {loadingMore && <Loader2 size={14} style={{ animation: `${spin} 0.7s linear infinite` }} />}
            {loadingMore ? 'Đang tải...' : 'Tải thêm'}
          </LoadMoreBtn>
        </div>
      )}
    </div>
  )
}
