import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom'
import { Button, Grid, Layout, Menu, Typography } from 'antd'
import { BarChartOutlined, DashboardOutlined, MenuFoldOutlined, MenuUnfoldOutlined, VideoCameraOutlined } from '@ant-design/icons'
import { ThemeToggle } from './ThemeToggle'
import { LoadingState } from './LoadingState'
import { RouteErrorBoundary } from './RouteErrorBoundary'
import { CsvWarningBanner } from './CsvWarningBanner'
import { BottomNav, BOTTOM_NAV_HEIGHT } from './BottomNav'
import { useTvDataContext } from '../context/useTvDataContext'
import { useTheme } from '../ThemeContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { APP_NAME, normalizePath, pageTitleFor } from '../utils/pageTitle'
import { SIDEBAR_KEY } from '../utils/settings'

const { Sider, Header, Content } = Layout
const { Title } = Typography

// Every route needs an entry here (or an explicit case in pageTitleFor) — anything else is
// titled "Page not found" in the header and the browser tab.
const NAV_ITEMS = [
  { key: '/', label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: '/shows', label: 'Shows', icon: <VideoCameraOutlined /> },
  { key: '/stats', label: 'Statistics', icon: <BarChartOutlined /> },
]

function loadSidebarCollapsed(): boolean {
  try { return localStorage.getItem(SIDEBAR_KEY) === 'true' } catch { return false }
}

export function AppLayout() {
  const theme = useTheme()
  // Shell-level, like the theme: skipped-row warnings apply to every page; data / loading
  // only feed the page title (show name on Show Detail)
  const { warnings, data, loading } = useTvDataContext()
  const location = useLocation()
  const navigate = useNavigate()
  const screens = Grid.useBreakpoint()

  const [collapsed, setCollapsed] = useState(loadSidebarCollapsed)
  const [broken, setBroken] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleCollapse = (v: boolean) => {
    setCollapsed(v)
    try { localStorage.setItem(SIDEBAR_KEY, String(v)) } catch { /* ignore storage errors */ }
  }

  // Content is the scroll container (not window), so the router never resets it.
  // (Bottom-nav visibility lives in BottomNav, mounted only below lg.)
  useEffect(() => {
    contentRef.current?.scrollTo(0, 0)
  }, [location.pathname])

  // Exact match — /shows/12/extra is a 404, not a show detail page
  const showMatch = useMatch('/shows/:id')
  const isShowDetail = showMatch !== null
  const showId = showMatch?.params.id ?? null
  // Router matches /shows/ and /Shows as /shows — normalize the same way for nav/title lookup
  const normalizedPath = normalizePath(location.pathname)
  const selectedKey = isShowDetail ? '/shows' : normalizedPath
  // One title for header + tab, so they can't disagree
  const pageTitle = useMemo(
    () => pageTitleFor({ path: normalizedPath, showId, data, loading, navItems: NAV_ITEMS }),
    [normalizedPath, showId, data, loading],
  )
  useDocumentTitle(`${pageTitle} · ${APP_NAME}`)

  const pad = screens.sm ? 24 : 12

  return (
    <Layout style={{ height: '100vh' }}>
      {/* Fully controlled: no onCollapse — antd fires it on breakpoint changes,
          which would overwrite the saved desktop state in tvdash-sidebar. */}
      <Sider
        trigger={null}
        collapsed={broken || collapsed}
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
          <Title level={4} style={{ margin: 0, whiteSpace: 'nowrap' }}>
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
          <Title level={4} ellipsis style={{ margin: 0, minWidth: 0, flex: 1 }}>
            {pageTitle}
          </Title>
          <ThemeToggle />
        </Header>

        <Content
          ref={contentRef}
          style={{
            background: theme.contentBg,
            // Longhands only — mixing `padding` + `paddingBottom` triggers a React rerender warning
            paddingTop: pad,
            paddingInline: pad,
            paddingBottom: broken ? BOTTOM_NAV_HEIGHT + 12 : pad,
            overflowY: 'scroll',
            flex: 1,
          }}
        >
          <div style={{ maxWidth: 1600, margin: '0 auto' }}>
            <CsvWarningBanner warnings={warnings} />
            <RouteErrorBoundary pathname={location.pathname}>
              <Suspense fallback={<LoadingState />}>
                <Outlet />
              </Suspense>
            </RouteErrorBoundary>
          </div>
        </Content>
      </Layout>

      {broken && (
        <BottomNav
          items={NAV_ITEMS}
          selectedKey={selectedKey}
          pathname={location.pathname}
          scrollRef={contentRef}
          onNavigate={navigate}
        />
      )}
    </Layout>
  )
}
