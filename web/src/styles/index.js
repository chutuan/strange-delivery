import styled, { css } from 'styled-components'

// ─── Layout ───────────────────────────────────────────────
export const Card = styled.div`
  background: ${p => p.theme.colors.white};
  border-radius: ${p => p.theme.radius.xl};
  box-shadow: ${p => p.theme.shadow.sm};
  border: 1px solid rgba(249, 115, 22, 0.08);
  padding: ${p => p.$p || '20px'};
`

export const PageTitle = styled.h2`
  font-size: ${p => p.theme.font.xl};
  font-weight: 700;
  color: ${p => p.theme.colors.gray900};
`

export const PageSubtitle = styled.p`
  font-size: ${p => p.theme.font.sm};
  color: ${p => p.theme.colors.gray400};
  margin-top: 2px;
`

// ─── Buttons ──────────────────────────────────────────────
const btnBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: ${p => p.theme.font.sm};
  font-weight: 600;
  padding: 8px 16px;
  border-radius: ${p => p.theme.radius.lg};
  transition: ${p => p.theme.transition};
  cursor: pointer;
  white-space: nowrap;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const Button = styled.button`
  ${btnBase}
  background: ${p => p.theme.colors.primary};
  color: white;

  &:hover:not(:disabled) {
    background: ${p => p.theme.colors.primaryHover};
  }
`

export const ButtonOutline = styled.button`
  ${btnBase}
  background: white;
  color: ${p => p.theme.colors.gray700};
  border: 1px solid ${p => p.theme.colors.gray200};

  &:hover:not(:disabled) {
    border-color: ${p => p.theme.colors.primaryBorder};
    color: ${p => p.theme.colors.primary};
    background: ${p => p.theme.colors.primaryLight};
  }
`

export const ButtonDanger = styled.button`
  ${btnBase}
  background: ${p => p.theme.colors.errorLight};
  color: ${p => p.theme.colors.error};
  border: 1px solid ${p => p.theme.colors.errorBorder};

  &:hover:not(:disabled) {
    background: #FEE2E2;
  }
`

export const ButtonSm = styled(Button)`
  font-size: ${p => p.theme.font.xs};
  padding: 6px 12px;
  border-radius: ${p => p.theme.radius.md};
`

// ─── Form ─────────────────────────────────────────────────
const inputBase = css`
  width: 100%;
  border: 1px solid ${p => p.theme.colors.gray200};
  border-radius: ${p => p.theme.radius.md};
  padding: 9px 12px;
  font-size: ${p => p.theme.font.sm};
  color: ${p => p.theme.colors.gray800};
  background: white;
  transition: ${p => p.theme.transition};
  outline: none;

  &:focus {
    border-color: ${p => p.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(249,115,22,0.15);
  }

  &::placeholder { color: ${p => p.theme.colors.gray300}; }
`

export const Input = styled.input`${inputBase}`
export const Select = styled.select`${inputBase}`
export const Textarea = styled.textarea`
  ${inputBase}
  resize: vertical;
`

export const Label = styled.label`
  display: block;
  font-size: ${p => p.theme.font.sm};
  font-weight: 500;
  color: ${p => p.theme.colors.gray700};
  margin-bottom: 4px;
`

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

export const ErrorText = styled.p`
  font-size: ${p => p.theme.font.xs};
  color: ${p => p.theme.colors.error};
  margin-top: 2px;
`

export const AlertError = styled.div`
  background: ${p => p.theme.colors.errorLight};
  border: 1px solid ${p => p.theme.colors.errorBorder};
  color: ${p => p.theme.colors.error};
  border-radius: ${p => p.theme.radius.md};
  padding: 10px 14px;
  font-size: ${p => p.theme.font.sm};
`

export const AlertWarning = styled.div`
  background: ${p => p.theme.colors.warningLight};
  border: 1px solid ${p => p.theme.colors.warningBorder};
  color: #92400E;
  border-radius: ${p => p.theme.radius.md};
  padding: 10px 14px;
  font-size: ${p => p.theme.font.sm};
  display: flex;
  align-items: flex-start;
  gap: 8px;
`

// ─── Misc ─────────────────────────────────────────────────
export const Divider = styled.div`
  height: 1px;
  background: ${p => p.theme.colors.gray100};
  margin: ${p => p.$my || '0'} 0;
`

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: ${p => p.theme.radius.full};
  font-size: ${p => p.theme.font.xs};
  font-weight: 500;
  ${p => p.$variant === 'orange' && css`
    background: ${p.theme.colors.primaryLight};
    color: ${p.theme.colors.primary};
    box-shadow: inset 0 0 0 1px rgba(249,115,22,0.2);
  `}
  ${p => p.$variant === 'green' && css`
    background: ${p.theme.colors.successLight};
    color: ${p.theme.colors.success};
    box-shadow: inset 0 0 0 1px rgba(16,185,129,0.2);
  `}
  ${p => p.$variant === 'blue' && css`
    background: ${p.theme.colors.blueLight};
    color: ${p.theme.colors.blue};
    box-shadow: inset 0 0 0 1px rgba(59,130,246,0.2);
  `}
  ${p => p.$variant === 'gray' && css`
    background: ${p.theme.colors.gray100};
    color: ${p.theme.colors.gray500};
  `}
`

export const EmptyStateWrapper = styled.div`
  text-align: center;
  padding: 64px 16px;
  color: ${p => p.theme.colors.gray400};
`

export const EmptyIcon = styled.div`
  width: 56px;
  height: 56px;
  background: ${p => p.theme.colors.primaryLight};
  border-radius: ${p => p.theme.radius.xl};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  color: ${p => p.theme.colors.primary};
  opacity: 0.7;
`

export const Row = styled.div`
  display: flex;
  align-items: ${p => p.$align || 'center'};
  gap: ${p => p.$gap || '8px'};
  justify-content: ${p => p.$justify || 'flex-start'};
`

export const Col = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${p => p.$gap || '8px'};
`

export const Text = styled.span`
  font-size: ${p => p.$size ? p.theme.font[p.$size] : p.theme.font.sm};
  color: ${p => p.$color ? p.theme.colors[p.$color] : 'inherit'};
  font-weight: ${p => p.$weight || 'normal'};
`
