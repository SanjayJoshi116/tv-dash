import { lazy, Suspense, useMemo, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ConfigProvider, theme as antTheme } from 'antd'
import { ThemeProvider } from './ThemeContext'
import { TvDataProvider } from './context/TvDataContext'
import { AppLayout } from './components/AppLayout'
import { LoadingState } from './components/LoadingState'
import { DEFAULT_THEME_NAME, THEMES } from './themes'
import { getSettings, saveSetting } from './utils/settings'

const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ShowsPage = lazy(() => import('./pages/ShowsPage').then(m => ({ default: m.ShowsPage })))
const StatisticsPage = lazy(() => import('./pages/StatisticsPage').then(m => ({ default: m.StatisticsPage })))
const ShowDetailPage = lazy(() => import('./pages/ShowDetailPage').then(m => ({ default: m.ShowDetailPage })))

function loadThemeName(): string {
  const parsed = getSettings() as { themeName?: string }
  if (parsed.themeName && THEMES[parsed.themeName]) return parsed.themeName
  return DEFAULT_THEME_NAME
}

export default function App() {
  const [activeThemeName, setActiveThemeName] = useState(() => loadThemeName())

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
            <Suspense fallback={<LoadingState tip="Loading..." />}>
              <Routes>
                <Route element={<AppLayout activeThemeName={activeThemeName} onThemeChange={handleThemeChange} />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/shows" element={<ShowsPage />} />
                  <Route path="/shows/:id" element={<ShowDetailPage />} />
                  <Route path="/stats" element={<StatisticsPage />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TvDataProvider>
      </ConfigProvider>
    </ThemeProvider>
  )
}
