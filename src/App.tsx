import { lazy, useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppThemeProvider } from './ThemeContext'
import { TvDataProvider } from './context/TvDataContext'
import { AppLayout } from './components/AppLayout'
import { NotFoundPage } from './pages/NotFoundPage'

const loadDashboardPage = () => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage }))
const loadShowsPage = () => import('./pages/ShowsPage').then(m => ({ default: m.ShowsPage }))
const loadStatisticsPage = () => import('./pages/StatisticsPage').then(m => ({ default: m.StatisticsPage }))
const loadShowDetailPage = () => import('./pages/ShowDetailPage').then(m => ({ default: m.ShowDetailPage }))

const PAGE_LOADERS = [loadDashboardPage, loadShowsPage, loadStatisticsPage, loadShowDetailPage]

const DashboardPage = lazy(loadDashboardPage)
const ShowsPage = lazy(loadShowsPage)
const StatisticsPage = lazy(loadStatisticsPage)
const ShowDetailPage = lazy(loadShowDetailPage)

export default function App() {
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
