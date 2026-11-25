import { useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppThemeProvider } from './ThemeContext'
import { TvDataProvider } from './context/TvDataContext'
import { AppLayout } from './components/AppLayout'
import { NotFoundPage } from './pages/NotFoundPage'
import { DashboardPage, ShowDetailPage, ShowsPage, StatisticsPage, prefetchAllWhenIdle } from './routes/pageLoaders'

export default function App() {
  // Warm every page chunk at idle (skipped under Data Saver / 2G — see pageLoaders.ts)
  useEffect(() => prefetchAllWhenIdle(), [])

  return (
    <AppThemeProvider>
      <TvDataProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/shows" element={<ShowsPage />} />
              <Route path="/shows/:id" element={<ShowDetailPage />} />
              <Route path="/stats" element={<StatisticsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TvDataProvider>
    </AppThemeProvider>
  )
}
