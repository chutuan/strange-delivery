import { User, Truck } from 'lucide-react'
import styled from 'styled-components'

const config = {
  sender: { label: null,     icon: User,  bg: '#FFEDD5', color: '#F97316' },
  driver: { label: 'Tài xế', icon: Truck, bg: '#FFEDD5', color: '#F97316' },
}

const CardBox = styled.div`
  background: white;
  border: 1px solid #F1F5F9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
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

const InfoWrap = styled.div``

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

export default function PersonCard({ person, role }) {
  const { label, icon: Icon, bg, color } = config[role]
  return (
    <CardBox>
      <IconCircle $bg={bg} $color={color}>
        <Icon size={18} />
      </IconCircle>
      <InfoWrap>
        {label && <RoleLabel>{label}</RoleLabel>}
        <PersonName>{person.name}</PersonName>
        {person.phone && <PersonPhone>{person.phone}</PersonPhone>}
      </InfoWrap>
    </CardBox>
  )
}
