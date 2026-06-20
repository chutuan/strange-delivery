import styled, { css } from 'styled-components'
import { ErrorText } from '../../../styles/index'

const FieldLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
`

const Optional = styled.span`
  normal-case: true;
  text-transform: none;
  font-weight: 400;
  color: #94A3B8;
  margin-left: 4px;
`

const inputStyles = css`
  width: 100%;
  border: 1px solid ${p => p.$hasError ? '#F87171' : '#CBD5E1'};
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
  background: ${p => p.$hasError ? '#FEF2F2' : 'white'};
  outline: none;
  transition: box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease;
  font-family: inherit;
  color: #1F2937;

  &:focus {
    border-color: #F97316;
    box-shadow: 0 0 0 3px rgba(249,115,22,0.15);
    background: white;
  }

  &::placeholder { color: #CBD5E1; }
`

const StyledInput = styled.input`${inputStyles}`
const StyledTextarea = styled.textarea`
  ${inputStyles}
  resize: none;
`

export default function FormField({ label, name, type = 'text', placeholder, required = true, as = 'input', form, errors, onChange }) {
  return (
    <div>
      <FieldLabel>
        {label}
        {!required && <Optional>(tuỳ chọn)</Optional>}
      </FieldLabel>
      {as === 'textarea' ? (
        <StyledTextarea
          rows={3}
          value={form[name]}
          onChange={onChange(name)}
          placeholder={placeholder}
          $hasError={!!errors[name]}
        />
      ) : (
        <StyledInput
          type={type}
          name={name}
          required={required}
          value={form[name]}
          onChange={onChange(name)}
          placeholder={placeholder}
          $hasError={!!errors[name]}
        />
      )}
      {errors[name] && <ErrorText style={{ marginTop: 6 }}>{errors[name][0]}</ErrorText>}
    </div>
  )
}
