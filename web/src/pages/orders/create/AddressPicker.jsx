import { useEffect, useRef, useState } from 'react'
import { BookMarked, ChevronDown, Star } from 'lucide-react'
import styled from 'styled-components'

const Wrap = styled.div`
  position: relative;
`

const Trigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  background: #F8FAFC;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  &:hover { border-color: #FDBA74; color: #EA580C; }
`

const Menu = styled.div`
  position: absolute;
  z-index: 30;
  top: calc(100% + 4px);
  left: 0;
  min-width: 240px;
  max-width: 320px;
  max-height: 260px;
  overflow-y: auto;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(16,24,40,0.12);
  padding: 4px;
`

const Option = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  border-radius: 8px;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
  &:hover { background: #FFF7ED; }
`

const OptTop = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #0F172A;
`

const OptAddr = styled.p`
  font-size: 12px;
  color: #64748B;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export default function AddressPicker({ addresses, onSelect, label }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  if (!addresses?.length) return null

  return (
    <Wrap ref={ref}>
      <Trigger type="button" onClick={() => setOpen(o => !o)}>
        <BookMarked size={13} /> {label} <ChevronDown size={13} />
      </Trigger>
      {open && (
        <Menu>
          {addresses.map(a => (
            <Option key={a.id} type="button" onClick={() => { onSelect(a); setOpen(false) }}>
              <OptTop>
                {a.label}
                {a.is_default && <Star size={11} style={{ fill: '#F97316', color: '#F97316' }} />}
              </OptTop>
              <OptAddr>{a.address}</OptAddr>
            </Option>
          ))}
        </Menu>
      )}
    </Wrap>
  )
}
