import { useMemo, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ConfigProvider, theme as antTheme } from 'antd'
import { ThemeProvider } from './ThemeContext'
import { TvDataProvider } from './context/TvDataContext'
import { AppLayout } from './components/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { ShowsPage } from './pages/ShowsPage'
import { StatisticsPage } from './pages/StatisticsPage'
import { ShowDetailPage } from './pages/ShowDetailPage'
import { DEFAULT_THEME_NAME, THEMES } from './themes'
import { getSettings, saveSetting } from './utils/settings'

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
            <Routes>
              <Route element={<AppLayout activeThemeName={activeThemeName} onThemeChange={handleThemeChange} />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/shows" element={<ShowsPage />} />
                <Route path="/shows/:id" element={<ShowDetailPage />} />
                <Route path="/stats" element={<StatisticsPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TvDataProvider>
      </ConfigProvider>
    </ThemeProvider>
  )
}
