import type { Grid } from 'antd'
import type { SortKey } from '../types/filters'
import { lookup } from '../utils/lookup'

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

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const
export const SECTION_GAP = 24

// Green / amber / red by threshold — shared by every value-driven color
const tierColor = (high: number, mid: number) => (v: number): string =>
  v >= high ? '#52c41a' : v >= mid ? '#faad14' : '#f5222d'

export const ratingColor = tierColor(8, 6)
export const completionColor = tierColor(75, 40)

export function cardShadow(isDark: boolean): string {
  return isDark ? '0 6px 20px rgba(0,0,0,0.35)' : '0 4px 16px rgba(30,30,63,0.08)'
}

// Standard card look (radius + shadow) — spread into a Card's style
export function cardStyle(isDark: boolean): { borderRadius: number; boxShadow: string } {
  return { borderRadius: 10, boxShadow: cardShadow(isDark) }
}

// Single source for every known TMDB status: hex (Progress strokeColor, Status donut/bars) +
// antd Tag color. Each hex is its tag preset's -6 shade (Ended: neutral grey for 'default'),
// so a status looks the same as a bar and as a Tag.
const STATUSES = {
  'Returning Series': { hex: '#52c41a', tag: 'green' },
  'Ended': { hex: '#8c8c8c', tag: 'default' },
  'Canceled': { hex: '#f5222d', tag: 'red' },
  'In Production': { hex: '#1677ff', tag: 'blue' },
  'Planned': { hex: '#722ed1', tag: 'purple' },
  'Pilot': { hex: '#fa8c16', tag: 'orange' },
} as const satisfies Record<string, { hex: string; tag: string }>

export type KnownStatus = keyof typeof STATUSES
const STATUS_NAMES = Object.keys(STATUSES) as KnownStatus[]

// Literal-key access only (`STATUS_COLORS['Returning Series']`) — a typo fails to compile.
// For a status read from the CSV, use statusHex / statusTagColor.
export const STATUS_COLORS = Object.fromEntries(STATUS_NAMES.map(s => [s, STATUSES[s].hex])) as Record<KnownStatus, string>
export const STATUS_TAG_COLORS = Object.fromEntries(STATUS_NAMES.map(s => [s, STATUSES[s].tag])) as Record<KnownStatus, string>

// Unknown statuses get the caller's fallback (a theme chart color) — same rule on every page
export function statusHex(status: string, fallback: string): string {
  return lookup<string>(STATUS_COLORS, status) ?? fallback
}

export function statusTagColor(status: string): string {
  return lookup<string>(STATUS_TAG_COLORS, status) ?? 'default'
}

// Known statuses in STATUSES order, then unknown ones alphabetically (deduped)
export function sortStatuses(statuses: Iterable<string>): string[] {
  const rank = (s: string) => {
    const i = STATUS_NAMES.indexOf(s as KnownStatus)
    return i === -1 ? STATUS_NAMES.length : i
  }
  return [...new Set(statuses)].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
}
