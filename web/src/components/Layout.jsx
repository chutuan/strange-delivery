import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Package, Search, User, LogOut, Truck, LayoutDashboard, ClipboardList, Bell, History, Wallet, ReceiptText } from 'lucide-react'
import styled, { css } from 'styled-components'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

// Full nav for sidebar (desktop)
const NAV = {
  sender: [
    { to: '/orders/mine',   label: 'Đơn của tôi',    icon: Package },
    { to: '/notifications', label: 'Thông báo',       icon: Bell },
    { to: '/profile',       label: 'Hồ sơ',           icon: User },
  ],
  driver: [
    { to: '/driver/dashboard', label: 'Tổng quan',      icon: LayoutDashboard },
    { to: '/orders/open',      label: 'Tìm đơn',        icon: Search },
    { to: '/driver/orders',    label: 'Lịch sử đơn',    icon: History },
    { to: '/driver/bids',      label: 'Lịch sử bid',    icon: ClipboardList },
    { to: '/top-up',           label: 'Nạp credit',     icon: Wallet },
    { to: '/top-up/history',   label: 'Lịch sử credit', icon: ReceiptText },
    { to: '/profile',          label: 'Hồ sơ',          icon: User },
  ],
}

// Condensed nav for mobile bottom bar (max 5 items)
const NAV_MOBILE = {
  sender: NAV.sender,
  driver: [
    { to: '/driver/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { to: '/orders/open',      label: 'Tìm đơn',   icon: Search },
    { to: '/driver/orders',    label: 'Đơn hàng',  icon: History },
    { to: '/top-up',           label: 'Credit',    icon: Wallet },
    { to: '/profile',          label: 'Hồ sơ',     icon: User },
  ],
}

// ─── Styled Components ────────────────────────────────────

const AppShell = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${p => p.theme.colors.bg};
`

const Header = styled.header`
  background: ${p => p.theme.colors.white};
  border-bottom: 1px solid rgba(249, 115, 22, 0.1);
  box-shadow: ${p => p.theme.shadow.sm};
  position: sticky;
  top: 0;
  z-index: 20;
`

const HeaderInner = styled.div`
  padding: 0 16px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
`

const LogoIcon = styled.div`
  width: 32px;
  height: 32px;
  background: ${p => p.theme.colors.primary};
  border-radius: ${p => p.theme.radius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`

const LogoText = styled.span`
  font-weight: 700;
  font-size: ${p => p.theme.font.base};
  letter-spacing: -0.02em;
  color: ${p => p.theme.colors.gray900};
  display: none;
  @media (min-width: 640px) {
    display: block;
  }
`

const HeaderCenter = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
`

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`

const BellButton = styled(Link)`
  position: relative;
  color: ${p => p.theme.colors.gray400};
  padding: 4px;
  display: flex;
  align-items: center;
  transition: ${p => p.theme.transition};
  &:hover { color: ${p => p.theme.colors.primary}; }
`

const UnreadBadge = styled.span`
  position: absolute;
  top: -2px;
  right: -2px;
  background: #EF4444;
  color: white;
  font-size: 10px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const AvatarCircle = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${p => p.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: ${p => p.theme.font.sm};
  font-weight: 700;
  flex-shrink: 0;
`

const UserName = styled.span`
  font-size: ${p => p.theme.font.sm};
  font-weight: 500;
  color: ${p => p.theme.colors.gray700};
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: none;
  @media (min-width: 768px) {
    display: block;
  }
`

const LogoutButton = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${p => p.theme.radius.sm};
  color: ${p => p.theme.colors.gray400};
  transition: ${p => p.theme.transition};
  &:hover {
    color: ${p => p.theme.colors.primary};
    background: ${p => p.theme.colors.primaryLight};
  }
`

const MainContent = styled.main`
  flex: 1;
  width: 100%;
  padding: 24px 16px;
  padding-bottom: 72px;
  @media (min-width: 640px) {
    margin-left: 192px;
    padding-bottom: 24px;
  }
`

const BottomNav = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${p => p.theme.colors.white};
  border-top: 1px solid rgba(249, 115, 22, 0.1);
  display: flex;
  z-index: 10;
  @media (min-width: 640px) {
    display: none;
  }
`

const BottomNavItem = styled(Link)`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
  font-size: ${p => p.theme.font.xs};
  gap: 4px;
  transition: ${p => p.theme.transition};
  color: ${p => p.$active ? p.theme.colors.primary : '#94A3B8'};
  &:hover { color: ${p => p.theme.colors.primary}; }
`

const BottomNavIconWrap = styled.span`
  position: relative;
`

const BottomNavBadge = styled.span`
  position: absolute;
  top: -6px;
  right: -8px;
  background: #EF4444;
  color: white;
  font-size: 9px;
  font-weight: 700;
  min-width: 15px;
  height: 15px;
  padding: 0 4px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const Sidebar = styled.div`
  display: none;
  @media (min-width: 640px) {
    display: flex;
    position: fixed;
    left: 0;
    top: 56px;
    bottom: 0;
    width: 192px;
    background: ${p => p.theme.colors.white};
    border-right: 1px solid rgba(249, 115, 22, 0.1);
    flex-direction: column;
    overflow-y: auto;
  }
`

const SidebarNav = styled.nav`
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const NavItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: ${p => p.theme.radius.sm};
  font-size: ${p => p.theme.font.sm};
  transition: ${p => p.theme.transition};
  position: relative;
  text-decoration: none;
  ${p => p.$active ? css`
    background: #FFF7ED;
    color: #EA580C;
    font-weight: 600;
  ` : css`
    color: ${p.theme.colors.gray400};
    font-weight: 500;
    &:hover {
      background: #FFF7ED;
      color: #EA580C;
    }
  `}
`

const NavAccent = styled.span`
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: ${p => p.theme.colors.primary};
  border-radius: 0 4px 4px 0;
`

const SidebarNotifBadge = styled.span`
  background: #EF4444;
  color: white;
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const SidebarFooter = styled.div`
  padding: 12px;
  border-top: 1px solid rgba(249, 115, 22, 0.1);
`

const SidebarUser = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
`

const SidebarAvatar = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${p => p.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: ${p => p.theme.font.xs};
  font-weight: 700;
  flex-shrink: 0;
`

const SidebarUserInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const SidebarUserName = styled.p`
  font-size: ${p => p.theme.font.xs};
  font-weight: 600;
  color: ${p => p.theme.colors.gray800};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const SidebarUserEmail = styled.p`
  font-size: ${p => p.theme.font.xs};
  color: ${p => p.theme.colors.gray400};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

// ─── Role Switcher ────────────────────────────────────────

const SwitcherWrap = styled.div`
  display: flex;
  align-items: center;
  background: #FFF7ED;
  border-radius: ${p => p.theme.radius.lg};
  padding: 4px;
  gap: 2px;
`

const SwitcherBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: ${p => p.theme.radius.sm};
  font-size: ${p => p.theme.font.xs};
  font-weight: 600;
  transition: ${p => p.theme.transition};
  ${p => p.$active ? css`
    background: ${p.theme.colors.primary};
    color: white;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  ` : css`
    color: ${p.theme.colors.gray500};
    &:hover { background: #FFEDD5; }
  `}
`

function RoleSwitcher({ role, setRole, hasDriverProfile, navigate }) {
  if (!hasDriverProfile) return null

  const handleSwitch = (next) => {
    if (next === role) return
    setRole(next)
    navigate(next === 'driver' ? '/orders/open' : '/orders/mine')
  }

  return (
    <SwitcherWrap>
      <SwitcherBtn onClick={() => handleSwitch('sender')} $active={role === 'sender'}>
        <Package size={13} />
        Người gửi
      </SwitcherBtn>
      <SwitcherBtn onClick={() => handleSwitch('driver')} $active={role === 'driver'}>
        <Truck size={13} />
        Tài xế
      </SwitcherBtn>
    </SwitcherWrap>
  )
}

function Avatar({ name }) {
  const initial = name?.charAt(0)?.toUpperCase() ?? '?'
  return <AvatarCircle>{initial}</AvatarCircle>
}

export default function Layout({ children }) {
  const { user, role, setRole, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let active = true
    const load = () => api.get('/notifications/unread-count')
      .then(res => { if (active) setUnread(res.data.count) })
      .catch(() => {})
    load()
    const id = setInterval(load, 30000)
    return () => { active = false; clearInterval(id) }
  }, [location.pathname])

  const navItems       = NAV[role]        ?? NAV.sender
  const mobileNavItems = NAV_MOBILE[role] ?? NAV_MOBILE.sender
  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  const homeLink = role === 'driver' ? '/orders/open' : '/orders/mine'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <AppShell>
      <Header>
        <HeaderInner>
          <LogoLink to={homeLink}>
            <LogoIcon>
              <Truck size={18} />
            </LogoIcon>
            <LogoText>Strange Delivery</LogoText>
          </LogoLink>

          <HeaderCenter>
            <RoleSwitcher
              role={role}
              setRole={setRole}
              hasDriverProfile={!!user?.driver_profile}
              navigate={navigate}
            />
          </HeaderCenter>

          <HeaderRight>
            <BellButton to="/notifications">
              <Bell size={20} />
              {unread > 0 && (
                <UnreadBadge>{unread > 9 ? '9+' : unread}</UnreadBadge>
              )}
            </BellButton>
            <Avatar name={user?.name} />
            <UserName>{user?.name}</UserName>
            <LogoutButton onClick={handleLogout} title="Đăng xuất">
              <LogOut size={16} />
            </LogoutButton>
          </HeaderRight>
        </HeaderInner>
      </Header>

      <MainContent>
        {children}
      </MainContent>

      <BottomNav>
        {mobileNavItems.map(({ to, label, icon: Icon }) => (
          <BottomNavItem key={to} to={to} $active={isActive(to)}>
            <BottomNavIconWrap>
              <Icon size={21} strokeWidth={isActive(to) ? 2.5 : 1.75} />
              {to === '/notifications' && unread > 0 && (
                <BottomNavBadge>{unread > 9 ? '9+' : unread}</BottomNavBadge>
              )}
            </BottomNavIconWrap>
            <span style={{ fontWeight: isActive(to) ? 600 : 400 }}>{label}</span>
          </BottomNavItem>
        ))}
      </BottomNav>

      <Sidebar>
        <SidebarNav>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavItem key={to} to={to} $active={isActive(to)}>
              {isActive(to) && <NavAccent />}
              <Icon size={17} strokeWidth={isActive(to) ? 2.5 : 1.75} />
              <span style={{ flex: 1 }}>{label}</span>
              {to === '/notifications' && unread > 0 && (
                <SidebarNotifBadge>{unread > 9 ? '9+' : unread}</SidebarNotifBadge>
              )}
            </NavItem>
          ))}
        </SidebarNav>

        <SidebarFooter>
          <SidebarUser>
            <SidebarAvatar>{user?.name?.charAt(0)?.toUpperCase()}</SidebarAvatar>
            <SidebarUserInfo>
              <SidebarUserName>{user?.name}</SidebarUserName>
              <SidebarUserEmail>{user?.email}</SidebarUserEmail>
            </SidebarUserInfo>
          </SidebarUser>
        </SidebarFooter>
      </Sidebar>
    </AppShell>
  )
}
