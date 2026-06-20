import { User, Truck, ChevronRight } from 'lucide-react'
import styled, { css } from 'styled-components'

const config = {
  sender: { label: null,     icon: User,  bg: '#FFEDD5', color: '#F97316' },
  driver: { label: 'Tài xế', icon: Truck, bg: '#FFEDD5', color: '#F97316' },
}

const CardBox = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  ${p => p.$clickable && css`
    cursor: pointer;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    &:hover { border-color: #FDBA74; box-shadow: 0 4px 12px rgba(16,24,40,0.08); }
  `}
`

const IconCircle = styled.div`
  width: 36px;
  height: 36px;
  background: ${p => p.$bg};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${p => p.$color};
  flex-shrink: 0;
`

const InfoWrap = styled.div`
  flex: 1;
  min-width: 0;
`

const RoleLabel = styled.p`
  font-size: 11px;
  color: #94A3B8;
  margin-bottom: 2px;
`

const PersonName = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: #1E293B;
`

const PersonPhone = styled.p`
  font-size: 11px;
  color: #64748B;
`

const ViewHint = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 500;
  color: #F97316;
  flex-shrink: 0;
`

export default function PersonCard({ person, role, onClick }) {
  const { label, icon: Icon, bg, color } = config[role]
  return (
    <CardBox $clickable={!!onClick} onClick={onClick}>
      <IconCircle $bg={bg} $color={color}>
        <Icon size={18} />
      </IconCircle>
      <InfoWrap>
        {label && <RoleLabel>{label}</RoleLabel>}
        <PersonName>{person.name}</PersonName>
        {person.phone && <PersonPhone>{person.phone}</PersonPhone>}
      </InfoWrap>
      {onClick && (
        <ViewHint>Hồ sơ <ChevronRight size={14} /></ViewHint>
      )}
    </CardBox>
  )
}
