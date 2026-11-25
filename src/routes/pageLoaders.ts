import type { ComponentType } from 'react'

// One place for page code loading: the route `lazy` functions (App), intent prefetch (nav items,
// show cards) and the idle prefetch policy.

export type PageKey = 'dashboard' | 'shows' | 'statistics' | 'showDetail'

type PageModule = { default: ComponentType }

export const PAGE_LOADERS: Record<PageKey, () => Promise<PageModule>> = {
  dashboard: () => import('../pages/DashboardPage').then(m => ({ default: m.DashboardPage })),
  shows: () => import('../pages/ShowsPage').then(m => ({ default: m.ShowsPage })),
  statistics: () => import('../pages/StatisticsPage').then(m => ({ default: m.StatisticsPage })),
  showDetail: () => import('../pages/ShowDetailPage').then(m => ({ default: m.ShowDetailPage })),
}

// Data-router route `lazy`: calls the raw loader (the browser's module map dedupes it with an
// in-flight prefetch) and hands the page over as the route's Component
export function lazyPage(key: PageKey): () => Promise<{ Component: ComponentType }> {
  return () => PAGE_LOADERS[key]().then(m => ({ Component: m.default }))
}

// A prefetcher with its own cache: each page's code starts loading at most once (cheap to call on
// every hover). Never rejects: a failure clears the entry so a later trigger retries, and real
// navigation surfaces the error through the route's error element (PageError).
export function createPrefetcher(loaders: Record<PageKey, () => Promise<unknown>>): (key: PageKey) => void {
  const started = new Map<PageKey, Promise<unknown>>()
  return key => {
    if (started.has(key)) return
    started.set(key, loaders[key]().catch(() => { started.delete(key) }))
  }
}

export const prefetchPage = createPrefetcher(PAGE_LOADERS)

// Module-level (stable identity): show cards / rows pass it as onMouseEnter + onFocus, so memo'd
// cards get no new props
export const prefetchShowDetail = (): void => prefetchPage('showDetail')

// The Network Information API subset we read (Chromium-only, not in TS's DOM lib)
interface ConnectionInfo {
  saveData?: boolean
  effectiveType?: string
}

function currentConnection(): ConnectionInfo | undefined {
  return typeof navigator === 'undefined' ? undefined : (navigator as Navigator & { connection?: ConnectionInfo }).connection
}

// Idle prefetch of every page: off under Data Saver or a 2G-class connection; on when the
// browser doesn't say (Firefox / Safari). Intent prefetch ignores this.
export function shouldIdlePrefetch(conn: ConnectionInfo | undefined = currentConnection()): boolean {
  if (!conn) return true
  if (conn.saveData) return false
  return conn.effectiveType !== '2g' && conn.effectiveType !== 'slow-2g'
}

// Prefetches every page once the browser is idle (if the connection allows). Returns cancel.
export function prefetchAllWhenIdle(): () => void {
  if (!shouldIdlePrefetch()) return () => {}
  const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1))
  const cancelIdle = window.cancelIdleCallback ?? clearTimeout
  const id = idle(() => {
    for (const key of Object.keys(PAGE_LOADERS) as PageKey[]) prefetchPage(key)
  })
  return () => cancelIdle(id)
}
