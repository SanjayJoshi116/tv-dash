import { Suspense, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom'
import { Button, Grid, Layout, Menu, Typography, theme as antTheme } from 'antd'
import { BarChartOutlined, DashboardOutlined, MenuFoldOutlined, MenuUnfoldOutlined, VideoCameraOutlined } from '@ant-design/icons'
import { ThemeToggle } from './ThemeToggle'
import { LoadingState } from './LoadingState'
import { RouteErrorBoundary } from './RouteErrorBoundary'
import { CsvWarningBanner } from './CsvWarningBanner'
import { useTvDataContext } from '../context/useTvDataContext'
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

const BOTTOM_NAV_HEIGHT = 60

function loadSidebarCollapsed(): boolean {
  try { return localStorage.getItem('tvdash-sidebar') === 'true' } catch { return false }
}

export function AppLayout({ activeThemeName, onThemeChange }: Props) {
  const theme = useTheme()
  // Shell-level, like the theme: skipped-row warnings apply to every page
  const { warnings } = useTvDataContext()
  const location = useLocation()
  const navigate = useNavigate()
  const screens = Grid.useBreakpoint()
  const { token } = antTheme.useToken()

  const [collapsed, setCollapsed] = useState(loadSidebarCollapsed)
  const [broken, setBroken] = useState(false)
  const [navVisible, setNavVisible] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)
  const lastScrollY = useRef(0)
  // Mirrors navVisible so the scroll handler only calls setState on an actual change
  const navVisibleRef = useRef(true)

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
  useEffect(() => {
    navVisibleRef.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNavVisible(true)
    // Content is the scroll container (not window), so the router never resets it
    contentRef.current?.scrollTo(0, 0)
    lastScrollY.current = 0
  }, [location.pathname])

  useEffect(() => {
    if (!broken) return
    // Hidden state survives a desktop round-trip; re-show the bar so it's never stuck off-screen
    navVisibleRef.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see note above
    setNavVisible(true)
    const el = contentRef.current
    if (!el) return
    lastScrollY.current = el.scrollTop
    // Entering mobile reflows the grid (Sider collapse + column change), and browser scroll
    // anchoring fires scroll events with large positive deltas. Ignore those briefly so they
    // aren't mistaken for a user scroll-down that re-hides the bar. Anchoring only moves an
    // already-scrolled container, so a fresh load at scrollTop 0 reacts immediately.
    const ignoreUntil = el.scrollTop > 0 ? performance.now() + 800 : 0
    const handleScroll = () => {
      const y = el.scrollTop
      if (performance.now() < ignoreUntil) { lastScrollY.current = y; return }
      const delta = y - lastScrollY.current
      const next = y < 24 || delta < -8 ? true : delta > 8 ? false : navVisibleRef.current
      if (next !== navVisibleRef.current) {
        navVisibleRef.current = next
        setNavVisible(next)
      }
      lastScrollY.current = y
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [broken])

  // Exact match — /shows/12/extra is a 404, not a show detail page
  const isShowDetail = useMatch('/shows/:id') !== null
  // Router matches /shows/ as /shows, so normalize the trailing slash for nav/title lookup
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/'
  const selectedKey = isShowDetail ? '/shows' : normalizedPath
  const pageTitle = isShowDetail
    ? 'Show Detail'
    : (NAV_ITEMS.find(i => i.key === normalizedPath)?.label ?? 'TV Dashboard')

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
          <ThemeToggle value={activeThemeName} onChange={onThemeChange} />
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
                  color: active ? token.colorPrimary : token.colorTextSecondary,
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
