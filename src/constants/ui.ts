import type { Grid } from 'antd'
import type { Progress, SortKey } from '../types/filters'
import { KNOWN_STATUSES, type KnownStatus } from '../types/series'
import { lookup } from '../utils/lookup'
import type { Theme, Tier } from '../themes'

type Screens = ReturnType<typeof Grid.useBreakpoint>

export function responsiveColumns(
  screens: Screens,
  tiers: { xxl?: number; xl?: number; lg?: number; md?: number; sm?: number; base: number }
): number {
  if (screens.xxl && tiers.xxl !== undefined) return tiers.xxl
  if (screens.xl && tiers.xl !== undefined) return tiers.xl
  if (screens.lg && tiers.lg !== undefined) return tiers.lg
  if (screens.md && tiers.md !== undefined) return tiers.md
  if (screens.sm && tiers.sm !== undefined) return tiers.sm
  return tiers.base
}


const GENRE_COLORS: Record<string, string> = {
  Animation: 'purple',
  Action: 'red',
  'Action & Adventure': 'red',
  Comedy: 'gold',
  Drama: 'blue',
  Fantasy: 'geekblue',
  'Sci-Fi & Fantasy': 'geekblue',
  Mystery: 'cyan',
  Thriller: 'volcano',
  Romance: 'pink',
  Horror: 'magenta',
  Adventure: 'orange',
}

export function genreTagColor(genre: string): string {
  return lookup(GENRE_COLORS, genre) ?? 'default'
}

// Record<SortKey, …> so a new SortKey without a label fails to compile. Single source for
// FilterBar's options and ShowsPage's saved-value validation (insertion order = menu order).
const SORT_LABELS: Record<SortKey, string> = {
  recentFirst: 'Recently Watched',
  voteAverage: 'Rating ↓',
  popularity: 'Popularity ↓',
  firstAirYear: 'Year ↓',
  totalRuntimeWatched: 'Watch time ↓',
  name: 'Name A–Z',
}
export const SORT_OPTIONS = (Object.keys(SORT_LABELS) as SortKey[]).map(value => ({ label: SORT_LABELS[value], value }))

// Progress filter options (FilterBar select + chip) — a new Progress value without a label fails
// to compile; 'all' is the cleared select, not an option
export const PROGRESS_LABELS: Record<Exclude<Progress, 'all'>, string> = {
  notStarted: 'Not started',
  inProgress: 'In progress',
  completed: 'Completed',
}
export const PROGRESS_OPTIONS = (Object.keys(PROGRESS_LABELS) as Exclude<Progress, 'all'>[]).map(value => ({ label: PROGRESS_LABELS[value], value }))

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const
export const SECTION_GAP = 24

// Good / medium / poor by threshold — pure; colors come from the active theme's `tiers`
export const tier = (v: number, high: number, mid: number): Tier =>
  v >= high ? 'success' : v >= mid ? 'warning' : 'danger'

// A rating's tier colors: `fill` + `onFill` (text on that fill, ≥ 4.5:1 — rating badges).
// Unknown rating (null) -> undefined: callers pick the fallback (`?? theme.chartText`, or inherit)
export const ratingTierColors = (v: number | null, theme: Theme): Theme['tiers'][Tier] | undefined =>
  v == null ? undefined : theme.tiers[tier(v, 8, 6)]
export const ratingColor = (v: number | null, theme: Theme): string | undefined => ratingTierColors(v, theme)?.fill
export const completionColor = (v: number, theme: Theme): string => theme.tiers[tier(v, 75, 40)].fill

export function cardShadow(isDark: boolean): string {
  return isDark ? '0 6px 20px rgba(0,0,0,0.35)' : '0 4px 16px rgba(30,30,63,0.08)'
}

// Standard card look (radius + shadow) — spread into a Card's style
export function cardStyle(isDark: boolean): { borderRadius: number; boxShadow: string } {
  return { borderRadius: 10, boxShadow: cardShadow(isDark) }
}

// Colors for every KNOWN_STATUSES entry (types/series.ts) — a missing one fails to compile: hex (Progress strokeColor, Status donut/bars) +
// antd Tag color. Each hex is its tag preset's -6 shade (Ended: neutral grey for 'default'),
// so a status looks the same as a bar and as a Tag.
// Literal-key access only (`STATUSES['Returning Series'].hex`) — a typo fails to compile.
// For a status read from the CSV, use statusHex / statusTagColor (own-key lookup).
type StatusStyle = { hex: string; tag: string }

export const STATUSES = {
  'Returning Series': { hex: '#52c41a', tag: 'green' },
  'Ended': { hex: '#8c8c8c', tag: 'default' },
  'Canceled': { hex: '#f5222d', tag: 'red' },
  'In Production': { hex: '#1677ff', tag: 'blue' },
  'Planned': { hex: '#722ed1', tag: 'purple' },
  'Pilot': { hex: '#fa8c16', tag: 'orange' },
} as const satisfies Record<KnownStatus, StatusStyle>

// Unknown statuses get the caller's fallback (a theme chart color) — same rule on every page
export function statusHex(status: string, fallback: string): string {
  return lookup<StatusStyle>(STATUSES, status)?.hex ?? fallback
}

export function statusTagColor(status: string): string {
  return lookup<StatusStyle>(STATUSES, status)?.tag ?? 'default'
}

// Known statuses in STATUSES order, then unknown ones alphabetically (deduped)
export function sortStatuses(statuses: Iterable<string>): string[] {
  const rank = (s: string) => {
    const i = (KNOWN_STATUSES as readonly string[]).indexOf(s)
    return i === -1 ? KNOWN_STATUSES.length : i
  }
  return [...new Set(statuses)].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
}
