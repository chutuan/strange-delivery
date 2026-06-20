import styled, { css } from 'styled-components'

const ITEMS = [
  { key: 'open',        label: 'Đang mở',   numColor: '#3B82F6' },
  { key: 'in_progress', label: 'Đang giao', numColor: '#F97316' },
  { key: 'delivered',   label: 'Đã giao',   numColor: '#10B981' },
  { key: 'cancelled',   label: 'Đã hủy',    numColor: '#9CA3AF' },
]

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 20px;
`

const FilterBtn = styled.button`
  background: white;
  border: 1px solid ${p => p.$active ? '#F97316' : '#F1F5F9'};
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  transition: all 0.15s ease;
  cursor: pointer;
  ${p => p.$active && css`
    background: #FFF7ED;
    color: #EA580C;
  `}
  &:hover {
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    border-color: #FDBA74;
  }
`

const FilterNum = styled.p`
  font-size: 20px;
  font-weight: 700;
  color: ${p => p.$active ? '#EA580C' : p.$numColor};
`

const FilterLabel = styled.p`
  font-size: 11px;
  color: #64748B;
  margin-top: 2px;
`

export default function SummaryBar({ counts, activeFilter, onFilter }) {
  return (
    <Grid>
      {ITEMS.map(({ key, label, numColor }) => {
        const isActive = activeFilter === key
        return (
          <FilterBtn
            key={key}
            onClick={() => onFilter(isActive ? null : key)}
            $active={isActive}
          >
            <FilterNum $numColor={numColor} $active={isActive}>{counts[key] ?? 0}</FilterNum>
            <FilterLabel>{label}</FilterLabel>
          </FilterBtn>
        )
      })}
    </Grid>
  )
}
