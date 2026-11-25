import type { TvSeries } from '../types/series'
import { findShow } from './derive'

export const APP_NAME = 'TV Dashboard'

export interface PageTitleInput {
  // normalizePath(pathname)
  path: string
  // `id` from the `/shows/:id` match; null when not on Show Detail
  showId: string | null
  data: TvSeries[]
  loading: boolean
  // Routes with a fixed title (AppLayout's NAV_ITEMS)
  navItems: readonly { key: string; label: string }[]
}

// Route-lookup form of a pathname: trailing slashes stripped ('/' for the root) and lowercased —
// react-router matches case-insensitively, so /Stats renders Statistics and must be titled so.
export function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, '').toLowerCase() || '/'
}

// One title for the header and the browser tab (AppLayout adds the ` · APP_NAME` suffix).
// Not-found by exclusion: anything that isn't a nav route or Show Detail is "Page not found".
export function pageTitleFor({ path, showId, data, loading, navItems }: PageTitleInput): string {
  if (showId != null) {
    if (loading) return 'Show Detail'
    const show = findShow(data, showId)
    if (!show) return 'Show not found'
    return show.name || 'Untitled show' // blank Name in the CSV
  }
  return navItems.find(i => i.key === path)?.label ?? 'Page not found'
}
