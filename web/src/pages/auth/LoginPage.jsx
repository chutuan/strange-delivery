import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Truck } from 'lucide-react'
import styled from 'styled-components'
import { useAuth } from '../../contexts/AuthContext'
import { Input, Label, Button, AlertError } from '../../styles/index'

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

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/orders/mine')
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại.')
    } finally {
      setLoading(false)
    }
  }

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

          <FormTitle>Đăng nhập</FormTitle>
          <FormSub>Chào mừng trở lại!</FormSub>

          <Form onSubmit={handleSubmit}>
            {error && <AlertError>{error}</AlertError>}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <FullButton type="submit" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </FullButton>
            <FooterText>
              Chưa có tài khoản?{' '}
              <StyledLink to="/register">Đăng ký</StyledLink>
            </FooterText>
          </Form>
        </FormBox>
      </RightPanel>
    </AuthShell>
  )
}
