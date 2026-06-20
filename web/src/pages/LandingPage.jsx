import { Link } from 'react-router-dom'
import { Truck, ShieldCheck, Star, Camera, BellRing, PackagePlus, MapPin, ArrowRight } from 'lucide-react'
import styled from 'styled-components'

const Page = styled.div`
  min-height: 100vh;
  background: #FFFFFF;
  color: #0F172A;
`

const Nav = styled.header`
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #F1F5F9;
`

const NavInner = styled.div`
  max-width: 1080px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 17px;
`

const BrandMark = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: #F97316;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
`

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const GhostLink = styled(Link)`
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  padding: 8px 14px;
  border-radius: 10px;
  &:hover { color: #0F172A; background: #F1F5F9; }
`

const SolidLink = styled(Link)`
  font-size: 14px;
  font-weight: 600;
  color: white;
  background: #F97316;
  padding: 8px 16px;
  border-radius: 10px;
  transition: background 0.15s ease;
  &:hover { background: #EA580C; }
`

const Section = styled.section`
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 20px;
`

const Hero = styled(Section)`
  text-align: center;
  padding-top: 72px;
  padding-bottom: 64px;
`

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #C2410C;
  background: #FFF7ED;
  border: 1px solid #FED7AA;
  border-radius: 9999px;
  padding: 6px 14px;
  margin-bottom: 20px;
`

const H1 = styled.h1`
  font-size: 44px;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0 auto;
  max-width: 720px;
  @media (max-width: 640px) { font-size: 32px; }
`

const Accent = styled.span`
  background: linear-gradient(120deg, #F97316, #EA580C);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
`

const Lead = styled.p`
  font-size: 17px;
  color: #475569;
  line-height: 1.6;
  max-width: 600px;
  margin: 20px auto 0;
`

const CtaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 32px;
`

const PrimaryBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: white;
  background: #F97316;
  padding: 13px 24px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(249,115,22,0.25);
  transition: all 0.15s ease;
  &:hover { background: #EA580C; transform: translateY(-1px); }
`

const SecondaryBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: #0F172A;
  background: white;
  border: 1px solid #E5E7EB;
  padding: 13px 24px;
  border-radius: 12px;
  transition: all 0.15s ease;
  &:hover { border-color: #CBD5E1; background: #F8FAFC; }
`

const Band = styled.div`
  background: #F8FAFC;
  border-top: 1px solid #F1F5F9;
  border-bottom: 1px solid #F1F5F9;
  padding: 56px 0;
`

const SectionHead = styled.h2`
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  text-align: center;
  margin-bottom: 8px;
`

const SectionSub = styled.p`
  text-align: center;
  color: #64748B;
  font-size: 15px;
  margin-bottom: 36px;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  @media (max-width: 860px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`

const FeatureCard = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(16,24,40,0.04);
`

const FeatIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 11px;
  background: #FFF7ED;
  color: #F97316;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
`

const FeatTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 4px;
`

const FeatText = styled.p`
  font-size: 13px;
  color: #64748B;
  line-height: 1.5;
`

const Steps = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 36px;
  @media (max-width: 760px) { grid-template-columns: 1fr; }
`

const Step = styled.div`
  text-align: center;
`

const StepNum = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #F97316;
  color: white;
  font-weight: 800;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
`

const DriverCta = styled(Section)`
  padding: 64px 20px;
`

const DriverCard = styled.div`
  background: linear-gradient(135deg, #F97316, #EA580C);
  border-radius: 24px;
  padding: 48px 32px;
  text-align: center;
  color: white;
`

const DriverTitle = styled.h2`
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.02em;
  @media (max-width: 640px) { font-size: 24px; }
`

const DriverSub = styled.p`
  font-size: 16px;
  color: #FFEDD5;
  margin: 12px auto 28px;
  max-width: 480px;
  line-height: 1.6;
`

const WhiteBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: #EA580C;
  background: white;
  padding: 13px 28px;
  border-radius: 12px;
  transition: transform 0.15s ease;
  &:hover { transform: translateY(-1px); }
`

const Footer = styled.footer`
  border-top: 1px solid #F1F5F9;
  padding: 28px 20px;
  text-align: center;
  color: #94A3B8;
  font-size: 13px;
`

const FEATURES = [
  { Icon: ShieldCheck, title: 'Tài xế xác minh', text: 'Danh tính & phương tiện được duyệt trước khi nhận đơn.' },
  { Icon: Star, title: 'Uy tín minh bạch', text: 'Đánh giá, cấp độ và nhận xét công khai cho mọi tài xế.' },
  { Icon: Camera, title: 'Bằng chứng giao hàng', text: 'Tài xế chụp ảnh xác nhận khi giao thành công.' },
  { Icon: BellRing, title: 'Theo dõi realtime', text: 'Cập nhật tức thì từng bước của đơn hàng.' },
]

const STEPS = [
  { Icon: PackagePlus, title: 'Đăng đơn', text: 'Nhập điểm lấy & giao, chọn giao luôn hoặc cho tài xế đấu giá.' },
  { Icon: Truck, title: 'Tài xế nhận', text: 'Tài xế gần bạn nhận đơn ngay hoặc gửi báo giá phù hợp.' },
  { Icon: MapPin, title: 'Theo dõi & nhận', text: 'Theo dõi hành trình, xem bằng chứng giao và đánh giá tài xế.' },
]

export default function LandingPage() {
  return (
    <Page>
      <Nav>
        <NavInner>
          <Brand>
            <BrandMark><Truck size={18} /></BrandMark>
            Strange Delivery
          </Brand>
          <NavActions>
            <GhostLink to="/login">Đăng nhập</GhostLink>
            <SolidLink to="/register">Đăng ký</SolidLink>
          </NavActions>
        </NavInner>
      </Nav>

      <Hero>
        <Pill><Truck size={14} /> Ai cũng có thể trở thành tài xế</Pill>
        <H1>Giao hàng cùng <Accent>người quanh bạn</Accent></H1>
        <Lead>
          Strange Delivery kết nối người gửi với tài xế gần nhất — nhanh, minh bạch và
          đáng tin. Gửi món đồ của bạn, hoặc kiếm thêm thu nhập từ mỗi chuyến đi.
        </Lead>
        <CtaRow>
          <PrimaryBtn to="/register">Bắt đầu miễn phí <ArrowRight size={17} /></PrimaryBtn>
          <SecondaryBtn to="/register">Tôi muốn làm tài xế</SecondaryBtn>
        </CtaRow>
      </Hero>

      <Band>
        <Section>
          <SectionHead>Tin tưởng người lạ, một cách an toàn</SectionHead>
          <SectionSub>Mọi lớp bảo vệ để bạn yên tâm trao món hàng cho một người mới.</SectionSub>
          <Grid>
            {FEATURES.map(({ Icon, title, text }) => (
              <FeatureCard key={title}>
                <FeatIcon><Icon size={20} /></FeatIcon>
                <FeatTitle>{title}</FeatTitle>
                <FeatText>{text}</FeatText>
              </FeatureCard>
            ))}
          </Grid>
        </Section>
      </Band>

      <Section style={{ padding: '64px 20px' }}>
        <SectionHead>Cách hoạt động</SectionHead>
        <SectionSub>Ba bước đơn giản từ lúc đăng đơn đến khi nhận hàng.</SectionSub>
        <Steps>
          {STEPS.map(({ Icon, title, text }, i) => (
            <Step key={title}>
              <StepNum>{i + 1}</StepNum>
              <FeatIcon style={{ margin: '0 auto 12px' }}><Icon size={20} /></FeatIcon>
              <FeatTitle>{title}</FeatTitle>
              <FeatText>{text}</FeatText>
            </Step>
          ))}
        </Steps>
      </Section>

      <DriverCta>
        <DriverCard>
          <DriverTitle>Biến mỗi chuyến đi thành thu nhập</DriverTitle>
          <DriverSub>
            Đăng ký làm tài xế trong vài phút. Nhận đơn quanh bạn, chủ động thời gian,
            xây dựng uy tín và cấp độ của riêng mình.
          </DriverSub>
          <WhiteBtn to="/register">Trở thành tài xế <ArrowRight size={17} /></WhiteBtn>
        </DriverCard>
      </DriverCta>

      <Footer>© {new Date().getFullYear()} Strange Delivery — Giao hàng người lạ.</Footer>
    </Page>
  )
}
