import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Pagination } from 'antd'
import { useTvDataContext } from '../context/useTvDataContext'
import { FilterBar } from '../components/FilterBar'
import { ShowGrid } from '../components/ShowGrid'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { getSettings, saveSetting } from '../utils/settings'
import { compareDescNullsLast, recentFirst, uniqueGenres } from '../utils/derive'
import { SECTION_GAP, SORT_OPTIONS } from '../constants/ui'
import type { TvSeries } from '../types/series'
import type { Filters, SortKey } from '../types/filters'

const DEFAULT_FILTERS: Filters = { search: '', genres: [], status: '', sortBy: 'recentFirst' }
const DEFAULT_PAGE_SIZE = 24
const PAGE_SIZE_OPTIONS = [12, 24, 48, 96]

const SORT_KEYS: readonly SortKey[] = SORT_OPTIONS.map(o => o.value)

// Type-check each stored field — a corrupt value falls back to its default (mirrors App's loadThemeName).
// Values absent from the current data (removed genre/status) are dropped in ShowsPage once data loads.
function loadFilters(): Filters {
  const raw = getSettings().filters
  if (!raw || typeof raw !== 'object') return DEFAULT_FILTERS
  const f = raw as Record<string, unknown>
  return {
    search: typeof f.search === 'string' ? f.search : DEFAULT_FILTERS.search,
    genres: Array.isArray(f.genres) && f.genres.every(g => typeof g === 'string') ? f.genres : DEFAULT_FILTERS.genres,
    status: typeof f.status === 'string' ? f.status : DEFAULT_FILTERS.status,
    sortBy: SORT_KEYS.includes(f.sortBy as SortKey) ? (f.sortBy as SortKey) : DEFAULT_FILTERS.sortBy,
  }
}

export function ShowsPage() {
  const { data, loading, error, refetch } = useTvDataContext()
  const [filters, setFilters] = useState<Filters>(loadFilters)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  // Latest unsaved filters, so unmount can flush a pending debounced save
  const pendingSaveRef = useRef<Filters | null>(null)

  const handleFiltersChange = useCallback((f: Filters) => {
    setFilters(f)
    setPage(1)
    pendingSaveRef.current = f
    clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      pendingSaveRef.current = null
      saveSetting('filters', f)
    }, 300)
  }, [])

  useEffect(() => () => {
    clearTimeout(saveTimeoutRef.current)
    if (pendingSaveRef.current) saveSetting('filters', pendingSaveRef.current)
  }, [])

  // Per-data sets / search text, so a keystroke doesn't rescan or re-lowercase every row
  const genreSet = useMemo(() => new Set(uniqueGenres(data)), [data])
  const statusSet = useMemo(() => new Set(data.map(s => s.status)), [data])
  // '\n'-joined: a query (no newline) can't match across two fields
  const searchText = useMemo(
    () => new Map(data.map(s => [s, [s.name, ...s.actors, ...s.keywords, ...s.genres, ...s.creators, ...s.networks].join('\n').toLowerCase()])),
    [data]
  )

  // Drop saved genre/status values that no longer exist in the data
  const validFilters = useMemo(() => {
    if (!data.length) return filters
    const genres = filters.genres.filter(g => genreSet.has(g))
    const status = !filters.status || statusSet.has(filters.status) ? filters.status : ''
    return genres.length === filters.genres.length && status === filters.status
      ? filters
      : { ...filters, genres, status }
  }, [data, filters, genreSet, statusSet])

  const deferredFilters = useDeferredValue(validFilters)

  const filtered = useMemo(() => {
    let result: TvSeries[] = data

    if (deferredFilters.search) {
      const q = deferredFilters.search.toLowerCase()
      result = result.filter(s => searchText.get(s)?.includes(q))
    }

    if (deferredFilters.genres.length) {
      result = result.filter(s => deferredFilters.genres.every(g => s.genres.includes(g)))
    }

    if (deferredFilters.status) {
      result = result.filter(s => s.status === deferredFilters.status)
    }

    const key = deferredFilters.sortBy
    if (key === 'recentFirst') {
      result = recentFirst(result)
    } else {
      result = [...result].sort((a, b) => {
        if (key === 'name') return a.name.localeCompare(b.name)
        return compareDescNullsLast(a[key], b[key])
      })
    }

    return result
  }, [data, deferredFilters, searchText])

  // Clamp page in-render when the filtered count shrinks below the current page (filter applied)
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)

  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize]
  )

  if (loading) return <LoadingState tip="Loading series..." />
  if (error) return <ErrorState message="Failed to load data" description={error} onRetry={refetch} />

  return (
    <>
      <FilterBar data={data} filters={validFilters} onChange={handleFiltersChange} resultCount={filtered.length} />
      <ShowGrid data={paged} />
      {filtered.length > PAGE_SIZE_OPTIONS[0] && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: SECTION_GAP }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filtered.length}
            showSizeChanger
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            showTotal={(total, range) => `${range[0]}–${range[1]} of ${total} shows`}
            onChange={(p, ps) => { setPage(p); setPageSize(ps) }}
          />
        </div>
      )}
    </>
  )
}
