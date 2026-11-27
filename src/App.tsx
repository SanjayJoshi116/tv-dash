import { useEffect, useState } from 'react'
import { createBrowserRouter, RouterProvider, type RouteObject } from 'react-router-dom'
import { AppThemeProvider } from './ThemeContext'
import { TvDataProvider } from './context/TvDataContext'
import { AppLayout } from './components/AppLayout'
import { LoadingState } from './components/LoadingState'
import { PageError, PagesOutlet, RootRouteError } from './components/RouteErrors'
import { NotFoundPage } from './pages/NotFoundPage'
import { lazyPage, prefetchAllWhenIdle } from './routes/pageLoaders'
import { PAGES, type PageKey } from './routes/pages'
import { BASE_PATH } from './constants/paths'

// HydrateFallback = first load only (the matched page's code isn't there yet); later
// navigations keep the current page on screen while the next one loads (NavProgress)
const page = (key: PageKey) => ({ lazy: lazyPage(key), HydrateFallback: LoadingState })

const ROUTES: RouteObject[] = [
  {
    element: <AppLayout />,
    errorElement: <RootRouteError />,
    children: [
      {
        // Pathless: one error boundary for every page, inside the layout. Pages have none of
        // their own, so their errors (render or failed code load) land here.
        element: <PagesOutlet />,
        errorElement: <PageError />,
        children: [
          ...PAGES.map(p => ({ path: p.path, ...page(p.page) })),
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
]

export default function App() {
  // Warm every page chunk at idle (skipped under Data Saver / 2G — see pageLoaders.ts)
  useEffect(() => prefetchAllWhenIdle(), [])
  // Per mount, not module-level: the router reads window.location when created (App.test
  // pushState's before each render). basename = Vite's base ('' at the root → none), so routes,
  // links and useLocation() stay base-relative under a sub-path deploy.
  // Created in an effect (not a useState initializer) so every router made is also disposed — it
  // subscribes to popstate and starts the matched page's lazy load on creation. StrictMode's
  // mount → unmount → mount disposes the first; App unmount (tests) disposes the live one.
  const [router, setRouter] = useState<ReturnType<typeof createBrowserRouter> | null>(null)
  useEffect(() => {
    const created = createBrowserRouter(ROUTES, { basename: BASE_PATH || undefined })
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the router is an external object with a lifecycle (dispose), not derived state
    setRouter(created)
    return () => created.dispose()
  }, [])

  return (
    <AppThemeProvider>
      <TvDataProvider>
        {/* One commit without the shell before the router exists; the boot script has already
            painted the theme background */}
        {router && <RouterProvider router={router} />}
      </TvDataProvider>
    </AppThemeProvider>
  )
}
