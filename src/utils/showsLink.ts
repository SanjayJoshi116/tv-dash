import type { To } from 'react-router-dom'
import type { Filters, Progress } from '../types/filters'
import { DEFAULT_FILTERS, DEFAULT_PAGE_SIZE, filtersToParams } from './showFilters'

// A link to the Shows list filtered by exactly one value (genre, status, search text or progress).
//
// This is the one documented exception to "never build an href from a CSV field" (CLAUDE.md):
// the pathname is the literal '/shows' and the value only ever goes, percent-encoded by
// URLSearchParams, into the query string — so the rendered href is always `<base>/shows?…`
// (React Router adds the basename). A value like `javascript:alert(1)`, `//evil.example` or
// `a&genre=b#x` can't become a scheme, host, path, extra param or fragment; Shows reads it back
// as the same literal text. Param names come from the Shows codec, so they can't drift.
export function showsLink(
  filter: Partial<Pick<Filters, 'status'>> & { genre?: string; q?: string; progress?: Exclude<Progress, 'all'> }
): To {
  const filters: Filters = {
    ...DEFAULT_FILTERS,
    search: filter.q ?? DEFAULT_FILTERS.search,
    genres: filter.genre != null ? [filter.genre] : DEFAULT_FILTERS.genres,
    status: filter.status ?? DEFAULT_FILTERS.status,
    progress: filter.progress ?? DEFAULT_FILTERS.progress,
  }
  return { pathname: '/shows', search: `?${filtersToParams(filters, 1, DEFAULT_PAGE_SIZE).toString()}` }
}
