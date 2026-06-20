import { useEffect, useState } from 'react'
import { Share2, Check } from 'lucide-react'
import styled, { keyframes } from 'styled-components'
import api from '../lib/api'
import DriverProfileContent from './DriverProfileContent'

const fadeIn = keyframes`from { opacity: 0 } to { opacity: 1 }`
const slideUp = keyframes`from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) }`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 100;
  animation: ${fadeIn} 0.15s ease;
`

const Card = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 440px;
  max-height: 86vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(16,24,40,0.25);
  animation: ${slideUp} 0.18s ease;
`

const Loading = styled.div`
  display: flex;
  justify-content: center;
  padding: 48px;
`

const Spin = styled.div`
  width: 28px;
  height: 28px;
  border: 4px solid #F97316;
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${keyframes`to { transform: rotate(360deg) }`} 0.7s linear infinite;
`

const ShareBar = styled.div`
  position: sticky;
  bottom: 0;
  background: white;
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

export default function DriverProfileModal({ driverId, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`/drivers/${driverId}/profile`)
      .then(res => setData(res.data))
      .catch(() => onClose())
      .finally(() => setLoading(false))
  }, [driverId, onClose])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const share = () => {
    navigator.clipboard.writeText(`${window.location.origin}/d/${driverId}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Overlay onClick={onClose}>
      <Card onClick={e => e.stopPropagation()}>
        {loading || !data ? (
          <Loading><Spin /></Loading>
        ) : (
          <>
            <DriverProfileContent data={data} onClose={onClose} />
            <ShareBar>
              <ShareBtn onClick={share}>
                {copied
                  ? <><Check size={15} /> Đã sao chép liên kết</>
                  : <><Share2 size={15} /> Chia sẻ hồ sơ</>}
              </ShareBtn>
            </ShareBar>
          </>
        )}
      </Card>
    </Overlay>
  )
}
