import type { ComponentType } from 'react'
import { BarChartOutlined, DashboardOutlined, VideoCameraOutlined } from '@ant-design/icons'

// The one page table: a new page = one row. PageKey, PAGE_LOADERS (pageLoaders.ts), the router's
// page routes (App), the sidebar / bottom-nav items and the nav-route titles (AppLayout →
// pageTitleFor) are all derived from it. Row order = nav order. Plain .ts (no JSX): icons are
// component types, rendered by the consumer. NotFoundPage isn't here — it's the `*` fallback.

export type PageModule = { default: ComponentType }

interface NavDef {
  label: string
  icon: ComponentType
}

interface PageDef {
  page: string
  path: string
  load: () => Promise<PageModule>
  // Present = a primary nav route (sidebar, bottom nav, fixed title)
  nav?: NavDef
}

export const PAGES = [
  {
    page: 'dashboard',
    path: '/',
    load: () => import('../pages/DashboardPage').then(m => ({ default: m.DashboardPage })),
    nav: { label: 'Dashboard', icon: DashboardOutlined },
  },
  {
    page: 'shows',
    path: '/shows',
    load: () => import('../pages/ShowsPage').then(m => ({ default: m.ShowsPage })),
    nav: { label: 'Shows', icon: VideoCameraOutlined },
  },
  {
    page: 'showDetail',
    path: '/shows/:id',
    load: () => import('../pages/ShowDetailPage').then(m => ({ default: m.ShowDetailPage })),
  },
  {
    page: 'statistics',
    path: '/stats',
    load: () => import('../pages/StatisticsPage').then(m => ({ default: m.StatisticsPage })),
    nav: { label: 'Statistics', icon: BarChartOutlined },
  },
] as const satisfies readonly PageDef[]

type Page = (typeof PAGES)[number]
export type PageKey = Page['page']
type NavPage = Extract<Page, { nav: NavDef }>

function hasNav(p: Page): p is NavPage {
  return 'nav' in p
}

export const NAV_PAGES: readonly NavPage[] = PAGES.filter(hasNav)
