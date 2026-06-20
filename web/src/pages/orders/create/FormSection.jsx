import styled from 'styled-components'

const Section = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
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
`

const IconChip = styled.div`
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 8px;
  background: #FFF7ED;
  color: #F97316;
  display: flex;
  align-items: center;
  justify-content: center;
`

const SectionTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
`

const SectionBody = styled.div`
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

// Single, consistent header treatment for every section — a brand-orange icon
// chip on a neutral surface. The `color` prop is kept for call-site compatibility
// but intentionally ignored to avoid the previous multi-colour "rainbow".
export default function FormSection({ icon: Icon, title, children }) {
  return (
    <Section>
      <SectionHeader>
        <IconChip><Icon size={16} /></IconChip>
        <SectionTitle>{title}</SectionTitle>
      </SectionHeader>
      <SectionBody>
        {children}
      </SectionBody>
    </Section>
  )
}
