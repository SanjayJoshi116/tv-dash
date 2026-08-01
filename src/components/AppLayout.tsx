import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Button, Grid, Layout, Menu, Typography } from 'antd'
import { BarChartOutlined, DashboardOutlined, MenuFoldOutlined, MenuUnfoldOutlined, VideoCameraOutlined } from '@ant-design/icons'
import { ThemeToggle } from './ThemeToggle'
import { useTheme } from '../ThemeContext'

const { Sider, Header, Content } = Layout
const { Title, Text } = Typography

interface Props {
  activeThemeName: string
  onThemeChange: (name: string) => void
}

const NAV_ITEMS = [
  { key: '/', label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: '/shows', label: 'Shows', icon: <VideoCameraOutlined /> },
  { key: '/stats', label: 'Statistics', icon: <BarChartOutlined /> },
]

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/shows': 'Shows',
  '/stats': 'Statistics',
}

const BOTTOM_NAV_HEIGHT = 60

function loadSidebarCollapsed(): boolean {
  try { return localStorage.getItem('tvdash-sidebar') === 'true' } catch { return false }
}

export function AppLayout({ activeThemeName, onThemeChange }: Props) {
  const theme = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const screens = Grid.useBreakpoint()

  const [collapsed, setCollapsed] = useState(loadSidebarCollapsed)
  const [broken, setBroken] = useState(false)
  const [navVisible, setNavVisible] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)
  const lastScrollY = useRef(0)

  const handleCollapse = (v: boolean) => {
    setCollapsed(v)
    try { localStorage.setItem('tvdash-sidebar', String(v)) } catch { /* ignore storage errors */ }
  }

  // Always show the bar on the page it lands on after navigating. Tried the
  // "adjust state during render" alternative (compare against a `lastPathname`
  // state value, setState in the render body) to satisfy
  // react-hooks/set-state-in-effect without an effect — it's React's own
  // documented pattern for this exact case, but it genuinely misbehaves here
  // under React.StrictMode (confirmed via a debug trace: it oscillates and
  // settles on the wrong value). A plain effect is what's actually correct.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setNavVisible(true) }, [location.pathname])

  useEffect(() => {
    if (!broken) return
    const el = contentRef.current
    if (!el) return
    lastScrollY.current = el.scrollTop
    const handleScroll = () => {
      const y = el.scrollTop
      const delta = y - lastScrollY.current
      if (y < 24) {
        setNavVisible(true)
      } else if (delta > 8) {
        setNavVisible(false)
      } else if (delta < -8) {
        setNavVisible(true)
      }
      lastScrollY.current = y
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [broken])

  const selectedKey = location.pathname.startsWith('/shows/') ? '/shows' : (location.pathname || '/')
  const pageTitle = location.pathname.startsWith('/shows/')
    ? 'Show Detail'
    : (PAGE_TITLES[location.pathname] ?? 'TV Dashboard')

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        collapsible
        trigger={null}
        collapsed={broken || collapsed}
        onCollapse={v => { if (!broken) handleCollapse(v) }}
        breakpoint="lg"
        collapsedWidth={broken ? 0 : 80}
        onBreakpoint={setBroken}
        theme={theme.isDark ? 'dark' : 'light'}
        style={{
          background: theme.headerBg,
          borderRight: `1px solid ${theme.borderColor}`,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: `1px solid ${theme.borderColor}`,
          overflow: 'hidden',
        }}>
          <Title level={4} style={{ margin: 0, color: theme.isDark ? '#fff' : '#000', whiteSpace: 'nowrap' }}>
            {collapsed ? '📺' : '📺 TV'}
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          theme={theme.isDark ? 'dark' : 'light'}
          style={{ background: 'transparent', borderRight: 'none', flex: 1 }}
          items={NAV_ITEMS}
          onClick={({ key }) => navigate(key)}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '12px 0',
          borderTop: `1px solid ${theme.borderColor}`,
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => handleCollapse(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ color: theme.isDark ? '#fff' : '#000' }}
          />
        </div>
      </Sider>

      <Layout style={{ overflow: 'hidden' }}>
        <Header style={{
          background: theme.headerBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: `1px solid ${theme.borderColor}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
            <Title level={4} ellipsis style={{ margin: 0, color: theme.isDark ? '#fff' : '#000', minWidth: 0 }}>
              {pageTitle}
            </Title>
          </div>
          <ThemeToggle value={activeThemeName} onChange={onThemeChange} />
        </Header>

        <Content
          ref={contentRef}
          style={{
            background: theme.contentBg,
            padding: screens.sm ? '24px' : '12px',
            paddingBottom: broken ? BOTTOM_NAV_HEIGHT + 12 : (screens.sm ? 24 : 12),
            overflowY: 'scroll',
            flex: 1,
          }}
        >
          <div style={{ maxWidth: 1600, margin: '0 auto' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>

      {broken && (
        <nav style={{
          position: 'fixed',
          insetBlockEnd: 0,
          insetInlineStart: 0,
          insetInlineEnd: 0,
          height: BOTTOM_NAV_HEIGHT,
          paddingBottom: 'env(safe-area-inset-bottom)',
          display: 'flex',
          background: theme.headerBg,
          borderTop: `1px solid ${theme.borderColor}`,
          zIndex: 1000,
          transform: navVisible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.25s ease',
        }}>
          {NAV_ITEMS.map(item => {
            const active = item.key === selectedKey
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  border: 'none',
                  background: 'transparent',
                  color: active ? theme.token.colorPrimary : (theme.isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)'),
                  fontSize: 20,
                  cursor: 'pointer',
                }}
              >
                {item.icon}
                <Text style={{ fontSize: 11, color: 'inherit' }}>{item.label}</Text>
              </button>
            )
          })}
        </nav>
      )}
    </Layout>
  )
}
