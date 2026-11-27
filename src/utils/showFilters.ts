import type { TvSeries } from '../types/series'
import type { Filters, Progress, SortKey } from '../types/filters'
import { PROGRESS_LABELS, SORT_OPTIONS } from '../constants/ui'
import { compareAscNullsLast, compareDescNullsLast, minutesLeft, recentFirst, uniqueGenres } from './derive'

// Pure Shows-list logic: saved-filter validation, search index, stale-value cleanup, filter + sort.
// No React / storage imports — ShowsPage owns state, persistence and memo wiring.

export const DEFAULT_FILTERS: Filters = { search: '', genres: [], status: '', sortBy: 'recentFirst', progress: 'all' }

// Any filter beyond the sort set (the sort isn't a filter: Reset / Clear keep it)
export function hasActiveFilters(f: Filters): boolean {
  return !!f.search || f.genres.length > 0 || !!f.status || f.progress !== DEFAULT_FILTERS.progress
}

// Every filter back to its default, sort kept (FilterBar Reset, Shows empty-result Clear)
export function clearFilters(sortBy: SortKey): Filters {
  return { ...DEFAULT_FILTERS, sortBy }
}

const SORT_KEYS: readonly SortKey[] = SORT_OPTIONS.map(o => o.value)
const PROGRESS_KEYS: readonly Progress[] = ['all', ...(Object.keys(PROGRESS_LABELS) as Progress[])]

// The one progress definition (Shows filter + Dashboard Continue Watching / Not Started):
// nothing (or a negative, hand-edited count) watched → notStarted; watched ≥ total (and something
// watched) → completed — so a row with totalEpisodes 0 and some watched is completed, never in
// progress; else inProgress, which therefore always has 0 < watched < total
export function progressOf(s: TvSeries): Exclude<Progress, 'all'> {
  if (s.episodesWatched <= 0) return 'notStarted'
  if (s.episodesWatched >= s.totalEpisodes && s.episodesWatched > 0) return 'completed'
  return 'inProgress'
}

// Dashboard Continue Watching: in-progress shows, ordered, then the first n — sorted before the
// slice so "least time left" picks the right shows. Ties (and the default order) by share watched;
// unknown runtime goes last under leastTime. Never mutates.
export type ContinueOrder = 'mostWatched' | 'leastTime'
export function continueWatching(data: TvSeries[], order: ContinueOrder, n: number): TvSeries[] {
  // In progress ⇒ totalEpisodes > 0, so no division by zero
  const share = (s: TvSeries) => s.episodesWatched / s.totalEpisodes
  const byWatched = (a: TvSeries, b: TvSeries) => share(b) - share(a)
  return data
    .filter(s => progressOf(s) === 'inProgress')
    .sort(order === 'leastTime' ? (a, b) => compareAscNullsLast(minutesLeft(a), minutesLeft(b)) || byWatched(a, b) : byWatched)
    .slice(0, n)
}

// Type-check each field of an untrusted value (saved settings, later URL params) — a corrupt field
// falls back to its default (mirrors themes.ts parseThemePreference). Values absent from the
// current data (removed genre/status) are dropped separately by sanitizeFilters once data loads.
export function parseFilters(raw: unknown): Filters {
  if (!raw || typeof raw !== 'object') return DEFAULT_FILTERS
  const f = raw as Record<string, unknown>
  return {
    search: typeof f.search === 'string' ? f.search : DEFAULT_FILTERS.search,
    // Deduped (first occurrence kept): ?genre=Drama&genre=Drama is one selection
    genres: Array.isArray(f.genres) && f.genres.every(g => typeof g === 'string') ? [...new Set<string>(f.genres)] : DEFAULT_FILTERS.genres,
    status: typeof f.status === 'string' ? f.status : DEFAULT_FILTERS.status,
    sortBy: SORT_KEYS.includes(f.sortBy as SortKey) ? (f.sortBy as SortKey) : DEFAULT_FILTERS.sortBy,
    // Missing in filters saved before v0.4.34 → all
    progress: PROGRESS_KEYS.includes(f.progress as Progress) ? (f.progress as Progress) : DEFAULT_FILTERS.progress,
  }
}

// ── URL codec ────────────────────────────────────────────────────────────────────────────────
// Shows view state in the query string: q, genre (repeated, selection order), status, progress,
// sort, page, size. Defaults are omitted, so the unfiltered first page is plain /shows. Values only ever reach
// React state / text (never an href).

export const DEFAULT_PAGE_SIZE = 24
export const PAGE_SIZE_OPTIONS: readonly number[] = [12, 24, 48, 96]

const FILTER_PARAMS = ['q', 'genre', 'status', 'progress', 'sort'] as const
const SHOW_PARAMS: readonly string[] = [...FILTER_PARAMS, 'page', 'size']

// Filters from the URL, validated like saved filters (parseFilters); null when no filter param is
// present — the caller then seeds from saved filters
export function filtersFromParams(params: URLSearchParams): Filters | null {
  if (!FILTER_PARAMS.some(k => params.has(k))) return null
  return parseFilters({
    search: params.get('q') ?? DEFAULT_FILTERS.search,
    genres: params.getAll('genre'),
    status: params.get('status') ?? DEFAULT_FILTERS.status,
    progress: params.get('progress') ?? DEFAULT_FILTERS.progress,
    sortBy: params.get('sort') ?? DEFAULT_FILTERS.sortBy,
  })
}

const POSITIVE_INT = /^[1-9]\d*$/

// Canonical positive integer, else page 1 ('0', '-1', '1.5', 'abc', '01' → 1)
export function parsePage(raw: string | null): number {
  return raw != null && POSITIVE_INT.test(raw) ? Number(raw) : 1
}

// One of PAGE_SIZE_OPTIONS, else the default
export function parsePageSize(raw: string | null): number {
  const n = raw != null && POSITIVE_INT.test(raw) ? Number(raw) : NaN
  return PAGE_SIZE_OPTIONS.includes(n) ? n : DEFAULT_PAGE_SIZE
}

// The Shows params for a view, defaults omitted
export function filtersToParams(filters: Filters, page: number, size: number): URLSearchParams {
  const p = new URLSearchParams()
  if (filters.search) p.set('q', filters.search)
  for (const g of filters.genres) p.append('genre', g)
  if (filters.status) p.set('status', filters.status)
  if (filters.progress !== DEFAULT_FILTERS.progress) p.set('progress', filters.progress)
  if (filters.sortBy !== DEFAULT_FILTERS.sortBy) p.set('sort', filters.sortBy)
  if (page > 1) p.set('page', String(page))
  if (size !== DEFAULT_PAGE_SIZE) p.set('size', String(size))
  return p
}

// `current` with its Shows params replaced by `ours` — other params (e.g. ?theme=) are kept
export function withShowParams(current: URLSearchParams, ours: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams()
  current.forEach((v, k) => { if (!SHOW_PARAMS.includes(k)) next.append(k, v) })
  ours.forEach((v, k) => next.append(k, v))
  return next
}

// Per-row lowercase search text, built once per data (a keystroke doesn't re-lowercase every row).
// '\n'-joined: a query (no newline) can't match across two fields.
export function buildSearchIndex(data: TvSeries[]): Map<TvSeries, string> {
  return new Map(data.map(s => [s, [s.name, ...s.actors, ...s.keywords, ...s.genres, ...s.creators, ...s.networks].join('\n').toLowerCase()]))
}

export interface FilterSets {
  genres: ReadonlySet<string>
  statuses: ReadonlySet<string>
}

// Genres / statuses present in the data, built once per data
export function buildFilterSets(data: TvSeries[]): FilterSets {
  return { genres: new Set(uniqueGenres(data)), statuses: new Set(data.map(s => s.status)) }
}

// Drop saved genre/status values that no longer exist in the data. Returns the same object when
// nothing is dropped (memos / useDeferredValue don't churn), and leaves filters untouched while
// there's no data (empty sets) so saved values survive the loading phase.
export function sanitizeFilters(filters: Filters, sets: FilterSets): Filters {
  // Every row has a status (possibly ''), so no statuses = no data
  if (!sets.statuses.size) return filters
  const genres = filters.genres.filter(g => sets.genres.has(g))
  const status = !filters.status || sets.statuses.has(filters.status) ? filters.status : ''
  return genres.length === filters.genres.length && status === filters.status
    ? filters
    : { ...filters, genres, status }
}

// Search → every selected genre (AND) → status → progress → sort. Never mutates `data`.
export function filterAndSortShows(data: TvSeries[], filters: Filters, index: Map<TvSeries, string>): TvSeries[] {
  let result = data

  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(s => index.get(s)?.includes(q))
  }

  if (filters.genres.length) {
    result = result.filter(s => filters.genres.every(g => s.genres.includes(g)))
  }

  if (filters.status) {
    result = result.filter(s => s.status === filters.status)
  }

  if (filters.progress !== 'all') {
    result = result.filter(s => progressOf(s) === filters.progress)
  }

  const key = filters.sortBy
  if (key === 'recentFirst') return recentFirst(result)
  return [...result].sort((a, b) => {
    if (key === 'name') return a.name.localeCompare(b.name)
    return compareDescNullsLast(a[key], b[key])
  })
}
