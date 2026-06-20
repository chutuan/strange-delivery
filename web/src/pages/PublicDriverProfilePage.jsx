import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Truck, Share2, Check } from 'lucide-react'
import styled, { keyframes } from 'styled-components'
import api from '../lib/api'
import DriverProfileContent from '../components/DriverProfileContent'

const Page = styled.div`
  min-height: 100vh;
  background: #F8FAFC;
`

const HeaderBar = styled.div`
  background: #EA580C;
  color: white;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 17px;
`

const LoginLink = styled(Link)`
  font-size: 13px;
  color: #FFD8B5;
  &:hover { color: white; }
`

const Wrap = styled.div`
  max-width: 460px;
  margin: 0 auto;
  padding: 24px 16px;
`

const Card = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(16,24,40,0.06);
  overflow: hidden;
`

const ShareBar = styled.div`
  border-top: 1px solid #F1F5F9;
  padding: 12px 20px;
`

const ShareBtn = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #EA580C;
  background: #FFF7ED;
  border: 1px solid #FED7AA;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  &:hover { background: #FFEDD5; }
`

const Loading = styled.div`
  display: flex;
  justify-content: center;
  padding: 64px;
`

const Spin = styled.div`
  width: 32px;
  height: 32px;
  border: 4px solid #F97316;
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${keyframes`to { transform: rotate(360deg) }`} 0.7s linear infinite;
`

const ErrorBox = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  padding: 48px 24px;
  text-align: center;
  color: #94A3B8;
  font-size: 14px;
`

const Caption = styled.p`
  text-align: center;
  font-size: 12px;
  color: #94A3B8;
  margin-top: 16px;
`

export default function PublicDriverProfilePage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`/d/${id}`)
      .then(res => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  const share = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Page>
      <HeaderBar>
        <Brand><Truck size={22} /> Strange Delivery</Brand>
        <LoginLink to="/login">Đăng nhập</LoginLink>
      </HeaderBar>

      <Wrap>
        {loading ? (
          <Loading><Spin /></Loading>
        ) : error || !data ? (
          <ErrorBox>Không tìm thấy hồ sơ tài xế</ErrorBox>
        ) : (
          <>
            <Card>
              <DriverProfileContent data={data} />
              <ShareBar>
                <ShareBtn onClick={share}>
                  {copied
                    ? <><Check size={15} /> Đã sao chép liên kết</>
                    : <><Share2 size={15} /> Chia sẻ hồ sơ</>}
                </ShareBtn>
              </ShareBar>
            </Card>
            <Caption>Hồ sơ tài xế trên Strange Delivery</Caption>
          </>
        )}
      </Wrap>
    </Page>
  )
}
