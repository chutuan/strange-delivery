import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Truck } from 'lucide-react'
import styled, { css } from 'styled-components'
import { useAuth } from '../../contexts/AuthContext'
import { Label, Button, AlertError, ErrorText } from '../../styles/index'

// ─── Styled Components ────────────────────────────────────

const AuthShell = styled.div`
  min-height: 100vh;
  display: flex;
`

const LeftPanel = styled.div`
  display: none;
  @media (min-width: 768px) {
    display: flex;
    width: 50%;
    background: #F97316;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px;
  }
`

const LogoBox = styled.div`
  width: 56px;
  height: 56px;
  background: white;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  color: #F97316;
`

const AppName = styled.h1`
  font-size: 30px;
  font-weight: 700;
  color: white;
  margin-bottom: 12px;
`

const Tagline = styled.p`
  color: #FFEDD5;
  text-align: center;
  font-size: 14px;
  line-height: 1.6;
  max-width: 280px;
`

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFF8F0;
  padding: 24px;
`

const FormBox = styled.div`
  width: 100%;
  max-width: 360px;
`

const MobileLogo = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
  @media (min-width: 768px) {
    display: none;
  }
`

const MobileLogoIcon = styled.div`
  width: 48px;
  height: 48px;
  background: #F97316;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`

const FormTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
`

const FormSub = styled.p`
  font-size: 13px;
  color: #6B7280;
  margin-bottom: 24px;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const FieldInput = styled.input`
  width: 100%;
  border: 1px solid ${p => p.$hasError ? '#F87171' : '#E5E7EB'};
  border-radius: 12px;
  padding: 9px 12px;
  font-size: 13px;
  color: #1F2937;
  background: white;
  transition: all 0.15s ease;
  outline: none;
  font-family: inherit;

  &:focus {
    border-color: #F97316;
    box-shadow: 0 0 0 3px rgba(249,115,22,0.15);
  }

  &::placeholder { color: #D1D5DB; }
`

const FullButton = styled(Button)`
  width: 100%;
  padding: 10px 16px;
  font-size: 14px;
  border-radius: 12px;
`

const FooterText = styled.p`
  text-align: center;
  font-size: 13px;
  color: #6B7280;
`

const StyledLink = styled(Link)`
  color: #F97316;
  font-weight: 500;
  &:hover { text-decoration: underline; }
`

// ─── Field Component ─────────────────────────────────────

function Field({ label, name, type = 'text', placeholder, form, errors, onChange }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <FieldInput
        id={name}
        type={type}
        required={name !== 'phone'}
        value={form[name]}
        onChange={onChange(name)}
        placeholder={placeholder}
        $hasError={!!errors[name]}
      />
      {errors[name] && <ErrorText>{errors[name][0]}</ErrorText>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const onChange = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await register(form)
      navigate('/orders/mine')
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {})
      } else {
        setErrors({ general: err.response?.data?.message || 'Đăng ký thất bại.' })
      }
    } finally {
      setLoading(false)
    }
  }

  const fieldProps = { form, errors, onChange }

  return (
    <AuthShell>
      <LeftPanel>
        <LogoBox>
          <Truck size={28} />
        </LogoBox>
        <AppName>Strange Delivery</AppName>
        <Tagline>
          Giao hàng nhanh chóng, an toàn — kết nối người gửi và tài xế trong vài giây.
        </Tagline>
      </LeftPanel>

      <RightPanel>
        <FormBox>
          <MobileLogo>
            <MobileLogoIcon>
              <Truck size={22} />
            </MobileLogoIcon>
          </MobileLogo>

          <FormTitle>Tạo tài khoản</FormTitle>
          <FormSub>Tham gia Strange Delivery ngay hôm nay</FormSub>

          <Form onSubmit={handleSubmit}>
            {errors.general && <AlertError>{errors.general}</AlertError>}
            <Field label="Họ tên" name="name" placeholder="Nguyễn Văn A" {...fieldProps} />
            <Field label="Email" name="email" type="email" placeholder="you@example.com" {...fieldProps} />
            <Field label="Số điện thoại (tuỳ chọn)" name="phone" placeholder="0901234567" {...fieldProps} />
            <Field label="Mật khẩu" name="password" type="password" placeholder="Tối thiểu 8 ký tự" {...fieldProps} />
            <Field label="Xác nhận mật khẩu" name="password_confirmation" type="password" placeholder="Nhập lại mật khẩu" {...fieldProps} />
            <FullButton type="submit" disabled={loading}>
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </FullButton>
            <FooterText>
              Đã có tài khoản?{' '}
              <StyledLink to="/login">Đăng nhập</StyledLink>
            </FooterText>
          </Form>
        </FormBox>
      </RightPanel>
    </AuthShell>
  )
}
