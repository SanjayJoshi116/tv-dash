import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Button, Grid, Layout, Menu, Typography } from 'antd'
import { BarChartOutlined, DashboardOutlined, MenuFoldOutlined, MenuUnfoldOutlined, VideoCameraOutlined } from '@ant-design/icons'
import { ThemeToggle } from './ThemeToggle'
import { useTheme } from '../ThemeContext'

const { Sider, Header, Content } = Layout
const { Title } = Typography

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

  const handleCollapse = (v: boolean) => {
    setCollapsed(v)
    try { localStorage.setItem('tvdash-sidebar', String(v)) } catch { /* ignore storage errors */ }
  }

  const selectedKey = location.pathname.startsWith('/shows/') ? '/shows' : (location.pathname || '/')
  const pageTitle = location.pathname.startsWith('/shows/')
    ? 'Show Detail'
    : (PAGE_TITLES[location.pathname] ?? 'TV Dashboard')

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        collapsible
        trigger={null}
        collapsed={collapsed || broken}
        onCollapse={v => handleCollapse(v)}
        breakpoint="lg"
        collapsedWidth={broken ? 0 : 80}
        onBreakpoint={setBroken}
        theme={theme.isDark ? 'dark' : 'light'}
        style={{ background: theme.headerBg, borderRight: `1px solid ${theme.borderColor}` }}
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
          style={{ background: 'transparent', borderRight: 'none' }}
          items={NAV_ITEMS}
          onClick={({ key }) => navigate(key)}
        />
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
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => handleCollapse(!collapsed)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{ flexShrink: 0 }}
            />
            <Title level={4} ellipsis style={{ margin: 0, color: theme.isDark ? '#fff' : '#000', minWidth: 0 }}>
              {pageTitle}
            </Title>
          </div>
          <ThemeToggle value={activeThemeName} onChange={onThemeChange} />
        </Header>

        <Content style={{ background: theme.contentBg, padding: screens.sm ? '24px' : '12px', overflowY: 'scroll', flex: 1 }}>
          <div style={{ maxWidth: 1600, margin: '0 auto' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
