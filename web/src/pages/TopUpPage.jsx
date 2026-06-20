import { useEffect, useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowLeft, CreditCard, Info, History,
  Wallet, Copy, Check, Loader2,
} from 'lucide-react'
import styled, { keyframes } from 'styled-components'
import api from '../lib/api'
import Spinner from '../components/Spinner'

const FAKE_BANKS = [
  { id: 'VCB',  name: 'Vietcombank',  bin: '970436' },
  { id: 'TCB',  name: 'Techcombank',  bin: '970407' },
  { id: 'MB',   name: 'MBBank',       bin: '970422' },
  { id: 'ACB',  name: 'ACB',          bin: '970416' },
  { id: 'VPB',  name: 'VPBank',       bin: '970432' },
  { id: 'TPB',  name: 'TPBank',       bin: '970423' },
  { id: 'BIDV', name: 'BIDV',         bin: '970418' },
  { id: 'STB',  name: 'Sacombank',    bin: '970403' },
]

const FAKE_NAMES = [
  'NGUYEN VAN AN', 'TRAN THI BICH', 'LE MINH TUAN', 'PHAM THU HA',
  'HOANG DUC LONG', 'VU THI LAN', 'DO QUANG HUNG', 'BUI THI MAI',
]

function fakeBankFromId(driverId) {
  const seed = driverId ?? 1
  const bank = FAKE_BANKS[seed % FAKE_BANKS.length]
  const name = FAKE_NAMES[seed % FAKE_NAMES.length]
  const digits = String(seed).padStart(4, '0')
  const accountNo = `${10000000 + (seed * 137) % 90000000}${digits}`
  return { bank, name, accountNo }
}

const formatPrice = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

function vietQrUrl(bankId, accountNo, accountName, amount, content) {
  return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(accountName)}`
}

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

const HistoryLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #F97316;
  margin-left: auto;
  transition: color 0.15s ease;
  &:hover { color: #EA580C; }
`

const RedirectBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  color: #92400E;
  font-size: 13px;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
`

const ContentStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const BalanceCard = styled.div`
  background: linear-gradient(to right, #F97316, #FB923C);
  color: white;
  border-radius: 16px;
  padding: 20px;
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

const SelectorCard = styled.div`
  background: white;
  border: 1px solid #F3F4F6;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`

const SelectorTitle = styled.p`
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 12px;
`

const PresetsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 16px;
`

const PresetBtn = styled.button`
  padding: 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.15s ease;
  ${p => p.$active ? `
    background: #F97316;
    color: white;
    border-color: #F97316;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  ` : `
    background: white;
    color: #374151;
    border-color: #E5E7EB;
    &:hover { border-color: #FDBA74; }
  `}
`

const SelectorMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #6B7280;
  margin-bottom: 16px;
`

const VndAmount = styled.span`
  font-weight: 600;
  color: #1F2937;
`

const ErrorMsg = styled.p`
  font-size: 13px;
  color: #DC2626;
  margin-bottom: 12px;
`

const spin = keyframes`to { transform: rotate(360deg); }`

const RequestBtn = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #F97316;
  color: white;
  font-weight: 600;
  padding: 12px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s ease;
  &:hover:not(:disabled) { background: #EA580C; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const SpinIcon = styled(Loader2)`
  animation: ${spin} 0.7s linear infinite;
`

const QrCard = styled.div`
  background: white;
  border: 1px solid #F3F4F6;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`

const QrHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: #F97316;
`

const QrTitle = styled.span`
  font-weight: 600;
  color: #1F2937;
`

const QrImageWrap = styled.div`
  position: relative;
  width: 240px;
  height: 240px;
  margin: 0 auto 16px;
`

const QrPlaceholder = styled.div`
  position: absolute;
  inset: 0;
  background: #F3F4F6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #D1D5DB;
  animation: pulse 1.5s ease infinite;
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`

const QrImage = styled.img`
  width: 240px;
  height: 240px;
  border-radius: 12px;
  border: 1px solid #F3F4F6;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: opacity 0.2s ease;
  opacity: ${p => p.$loading ? 0 : 1};
`

const InfoTable = styled.div`
  background: #F9FAFB;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const InfoLabel = styled.span`
  font-size: 13px;
  color: #6B7280;
`

const InfoValue = styled.span`
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
`

const InfoValueMono = styled(InfoValue)`
  font-family: monospace;
`

const PriceValue = styled(InfoValue)`
  color: #EA580C;
  font-weight: 700;
`

const ContentRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid #F3F4F6;
`

const ContentLabel = styled.span`
  font-size: 13px;
  color: #6B7280;
  flex-shrink: 0;
`

const ContentCode = styled.span`
  display: flex;
  align-items: center;
  font-family: monospace;
  font-weight: 700;
  color: #EA580C;
`

const CopyBtn = styled.button`
  margin-left: 8px;
  color: #9CA3AF;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  transition: color 0.15s ease;
  &:hover { color: #F97316; }
`

const Notice = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 12px;
  font-size: 11px;
  color: #92400E;
  background: #FFFBEB;
  border-radius: 12px;
  padding: 12px;
`

// ─── CopyButton ───────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <CopyBtn onClick={copy}>
      {copied ? <Check size={13} style={{ color: '#10B981' }} /> : <Copy size={13} />}
    </CopyBtn>
  )
}

// ─── TopUpTab ─────────────────────────────────────────────

function TopUpTab({ creditInfo }) {
  const MAX = 50
  const PRESETS = [5, 10, 20, 30, 50]
  const [amount, setAmount]               = useState(20)
  const [requesting, setRequesting]       = useState(false)
  const [referenceCode, setReferenceCode] = useState(null)
  const [qrLoading, setQrLoading]         = useState(false)
  const [error, setError]                 = useState('')

  const fakeBank = useMemo(() => fakeBankFromId(creditInfo?.driver_id), [creditInfo?.driver_id])

  if (!creditInfo) return null

  const { credits } = creditInfo
  const vndAmount = amount * 1000
  const { bank, name: accountName, accountNo } = fakeBank

  const handleRequest = async () => {
    setError('')
    setRequesting(true)
    try {
      const { data } = await api.post('/driver/credits/request', { amount })
      setReferenceCode(data.reference_code)
      setQrLoading(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra.')
    } finally {
      setRequesting(false)
    }
  }

  const handleAmountChange = (v) => {
    setAmount(v)
    setReferenceCode(null)
  }

  return (
    <ContentStack>
      <BalanceCard>
        <BalanceLabel>Số dư hiện tại</BalanceLabel>
        <BalanceValue>{credits ?? 0} <BalanceUnit>credit</BalanceUnit></BalanceValue>
        <BalanceNote>1 credit = 1.000₫ · Mỗi lần báo giá tốn 1 credit</BalanceNote>
      </BalanceCard>

      <SelectorCard>
        <SelectorTitle>Chọn số credit muốn nạp</SelectorTitle>
        <PresetsGrid>
          {PRESETS.map(v => (
            <PresetBtn
              key={v}
              onClick={() => handleAmountChange(v)}
              $active={amount === v}
            >
              {v}
            </PresetBtn>
          ))}
        </PresetsGrid>
        <SelectorMeta>
          <span>Tối đa {MAX} credit / lần</span>
          <VndAmount>= {formatPrice(vndAmount)}</VndAmount>
        </SelectorMeta>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        <RequestBtn onClick={handleRequest} disabled={requesting}>
          {requesting ? <SpinIcon size={16} /> : <Wallet size={16} />}
          {requesting ? 'Đang tạo...' : `Nạp ${amount} credit`}
        </RequestBtn>
      </SelectorCard>

      {referenceCode && (
        <QrCard>
          <QrHeader>
            <CreditCard size={17} />
            <QrTitle>Quét QR để chuyển khoản</QrTitle>
          </QrHeader>
          <QrImageWrap>
            {qrLoading && (
              <QrPlaceholder>
                <CreditCard size={28} />
              </QrPlaceholder>
            )}
            <QrImage
              key={referenceCode}
              src={vietQrUrl(bank.bin, accountNo, accountName, vndAmount, referenceCode)}
              alt="VietQR"
              onLoadStart={() => setQrLoading(true)}
              onLoad={() => setQrLoading(false)}
              $loading={qrLoading}
            />
          </QrImageWrap>
          <InfoTable>
            <InfoRow>
              <InfoLabel>Ngân hàng</InfoLabel>
              <InfoValue>{bank.name}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Số tài khoản</InfoLabel>
              <InfoValueMono>
                {accountNo}
                <CopyButton text={accountNo} />
              </InfoValueMono>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Chủ tài khoản</InfoLabel>
              <InfoValue>{accountName}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Số tiền</InfoLabel>
              <PriceValue>{formatPrice(vndAmount)}</PriceValue>
            </InfoRow>
            <ContentRow>
              <ContentLabel>Nội dung CK</ContentLabel>
              <ContentCode>
                {referenceCode}
                <CopyButton text={referenceCode} />
              </ContentCode>
            </ContentRow>
          </InfoTable>
          <Notice>
            <Info size={13} style={{ marginTop: 2, flexShrink: 0 }} />
            <p>Admin sẽ xác nhận và cộng credit trong thời gian sớm nhất. Vui lòng ghi <strong>đúng nội dung</strong> chuyển khoản.</p>
          </Notice>
        </QrCard>
      )}
    </ContentStack>
  )
}

// ─── Page ─────────────────────────────────────────────────

export default function TopUpPage() {
  const location = useLocation()
  const redirectReason = location.state?.reason
  const [creditInfo, setCreditInfo] = useState(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    api.get('/driver/credits')
      .then(res => setCreditInfo(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader>
        <BackLink to="/profile">
          <ArrowLeft size={20} />
        </BackLink>
        <PageTitle>Nạp credit</PageTitle>
        <HistoryLink to="/top-up/history">
          <History size={14} /> Lịch sử
        </HistoryLink>
      </PageHeader>

      {redirectReason && (
        <RedirectBanner>
          <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <p>{redirectReason}</p>
        </RedirectBanner>
      )}

      <TopUpTab creditInfo={creditInfo} />
    </div>
  )
}
