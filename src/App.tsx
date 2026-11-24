import { lazy, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ConfigProvider, theme as antTheme } from 'antd'
import { ThemeProvider } from './ThemeContext'
import { TvDataProvider } from './context/TvDataContext'
import { AppLayout } from './components/AppLayout'
import { NotFoundPage } from './pages/NotFoundPage'
import { DEFAULT_THEME_NAME, THEMES } from './themes'
import { getSettings, saveSetting } from './utils/settings'
import { lookup } from './utils/lookup'

const loadDashboardPage = () => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage }))
const loadShowsPage = () => import('./pages/ShowsPage').then(m => ({ default: m.ShowsPage }))
const loadStatisticsPage = () => import('./pages/StatisticsPage').then(m => ({ default: m.StatisticsPage }))
const loadShowDetailPage = () => import('./pages/ShowDetailPage').then(m => ({ default: m.ShowDetailPage }))

const PAGE_LOADERS = [loadDashboardPage, loadShowsPage, loadStatisticsPage, loadShowDetailPage]

const DashboardPage = lazy(loadDashboardPage)
const ShowsPage = lazy(loadShowsPage)
const StatisticsPage = lazy(loadStatisticsPage)
const ShowDetailPage = lazy(loadShowDetailPage)

function loadThemeName(): string {
  const { themeName } = getSettings()
  if (typeof themeName === 'string' && lookup(THEMES, themeName)) return themeName
  return DEFAULT_THEME_NAME
}

export default function App() {
  const [activeThemeName, setActiveThemeName] = useState(() => loadThemeName())

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1))
    const cancelIdle = window.cancelIdleCallback ?? clearTimeout
    const id = idle(() => {
      // Prefetch only; failures are handled by RouteErrorBoundary on actual navigation.
      for (const load of PAGE_LOADERS) {
        load().catch(() => {})
      }
    })
    return () => cancelIdle(id)
  }, [])

  const activeTheme = THEMES[activeThemeName] ?? THEMES[DEFAULT_THEME_NAME]

  const handleThemeChange = (name: string) => {
    setActiveThemeName(name)
    saveSetting('themeName', name)
  }

  const configTheme = useMemo(() => ({
    algorithm: activeTheme.isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
    token: activeTheme.token,
  }), [activeTheme])

  return (
    <ThemeProvider theme={activeTheme}>
      <ConfigProvider theme={configTheme}>
        <TvDataProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout activeThemeName={activeThemeName} onThemeChange={handleThemeChange} />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/shows" element={<ShowsPage />} />
                <Route path="/shows/:id" element={<ShowDetailPage />} />
                <Route path="/stats" element={<StatisticsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TvDataProvider>
      </ConfigProvider>
    </ThemeProvider>
  )
}
