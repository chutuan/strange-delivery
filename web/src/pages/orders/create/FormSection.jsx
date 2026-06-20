import styled from 'styled-components'

const Section = styled.div`
  background: white;
  border: 1px solid #F1F5F9;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #F1F5F9;
  background: ${p => p.$bg || 'transparent'};
  color: ${p => p.$color || 'inherit'};
`

const SectionTitle = styled.span`
  font-size: 13px;
  font-weight: 600;
`

const SectionBody = styled.div`
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

// Parse color/bg from Tailwind-like class strings passed via `color` prop
// e.g. "bg-orange-50 text-orange-700" → we use hardcoded theme values
const COLOR_MAP = {
  'bg-orange-50 text-orange-700': { bg: '#FFF7ED', color: '#C2410C' },
  'bg-green-50 text-green-700':   { bg: '#F0FDF4', color: '#15803D' },
  'bg-purple-50 text-purple-700': { bg: '#FAF5FF', color: '#7E22CE' },
  'bg-amber-50 text-amber-700':   { bg: '#FFFBEB', color: '#B45309' },
}

export default function FormSection({ icon: Icon, color, title, children }) {
  const mapped = COLOR_MAP[color] ?? {}
  return (
    <Section>
      <SectionHeader $bg={mapped.bg} $color={mapped.color}>
        <Icon size={16} />
        <SectionTitle>{title}</SectionTitle>
      </SectionHeader>
      <SectionBody>
        {children}
      </SectionBody>
    </Section>
  )
}
