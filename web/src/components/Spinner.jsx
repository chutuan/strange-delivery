import styled, { keyframes } from 'styled-components'

const spin = keyframes`
  to { transform: rotate(360deg); }
`

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: ${p => p.$py || '64px'} 0;
`

const Circle = styled.div`
  width: 32px;
  height: 32px;
  border: 4px solid #3B82F6;
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`

export default function Spinner({ className }) {
  // Support legacy className="py-XX" by extracting padding if needed
  // But we use $py transient prop for styled approach
  return (
    <Wrapper $py={className ? undefined : undefined}>
      <Circle />
    </Wrapper>
  )
}
