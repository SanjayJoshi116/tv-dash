import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Pagination } from 'antd'
import { useTvDataContext } from '../context/useTvDataContext'
import { FilterBar, type FilterChangeOptions } from '../components/FilterBar'
import { ShowGrid } from '../components/ShowGrid'
import { DataGate } from '../components/DataGate'
import { getSettings, saveSetting } from '../utils/settings'
import { SHOWS_SEARCH_ID, takeSearchFocusRequest } from '../utils/searchFocus'
import {
  buildFilterSets,
  buildSearchIndex,
  clearFilters,
  DEFAULT_FILTERS,
  filterAndSortShows,
  filtersFromParams,
  filtersToParams,
  hasActiveFilters,
  PAGE_SIZE_OPTIONS,
  parseFilters,
  parsePage,
  parsePageSize,
  sanitizeFilters,
  withShowParams,
} from '../utils/showFilters'
import { SECTION_GAP } from '../constants/ui'
import type { Filters } from '../types/filters'

// The URL is the source of truth for the view (filters, page, size — see showFilters.ts' codec).
// Saved filters only seed a URL without filter params, once per mount; they're read on mount and
// deliberately not subscribed to other tabs (subscribeSettings): a live update would overwrite
// what the user is typing here. Another tab's saved filters apply the next time this page mounts
// at a URL without filters; saveSetting merges, so our saves don't revert its other settings.
const loadFilters = (): Filters => parseFilters(getSettings().filters)

function readUrl(paramString: string) {
  const p = new URLSearchParams(paramString)
  return { filters: filtersFromParams(p), page: parsePage(p.get('page')), size: parsePageSize(p.get('size')) }
}

export function ShowsPage() {
  const tvData = useTvDataContext()
  const { data, loading } = tvData
  const [searchParams, setSearchParams] = useSearchParams()
  const paramString = searchParams.toString()
  // Memoized on the string, so the filters object is stable for memos / useDeferredValue
  const url = useMemo(() => readUrl(paramString), [paramString])
  // Saved filters for a mount whose URL has none: used in render right away (no flash of the
  // unfiltered list) and written to the URL with replace by the canonical-URL effect below.
  // Once per mount: cleared as soon as the URL carries filters (the seed has been written, or the
  // user / a link set some), so a later empty URL — Reset, Shows clicked in the nav after paging —
  // means defaults, never the saved filters again.
  const [seed, setSeed] = useState<Filters | null>(() => (url.filters ? null : loadFilters()))
  const filters = url.filters ?? seed ?? DEFAULT_FILTERS
  const { page, size: pageSize } = url
  const urlHasFilters = url.filters != null
  useEffect(() => {
    // Idempotent (StrictMode-safe); the render-time "adjust state" pattern misbehaves here (CLAUDE.md)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (urlHasFilters) setSeed(null)
  }, [urlHasFilters])

  // `/` shortcut from another page: focus the search field once it exists (FilterBar renders only
  // after data has loaded). An effect, not autoFocus (jsx-a11y): this focus is user-requested.
  // The request is one-shot, so StrictMode's second effect run finds nothing to do.
  useEffect(() => {
    if (!loading && takeSearchFocusRequest()) document.getElementById(SHOWS_SEARCH_ID)?.focus()
  }, [loading])

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  // Latest unsaved filters, so unmount can flush a pending debounced save
  const pendingSaveRef = useRef<Filters | null>(null)

  // Search typing replaces the history entry (FilterBar passes replace); every other change pushes,
  // so Back undoes it. Any filter change goes back to page 1; page / size are never saved.
  // Typing is flushSync: React Router navigates in a transition by default, and the controlled
  // search input would snap back to the URL's previous value between keystrokes (losing letters).
  const handleFiltersChange = useCallback((f: Filters, { replace = false }: FilterChangeOptions = {}) => {
    setSeed(null)
    setSearchParams(prev => withShowParams(prev, filtersToParams(f, 1, pageSize)), { replace, flushSync: replace })
    pendingSaveRef.current = f
    clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      pendingSaveRef.current = null
      saveSetting('filters', f)
    }, 300)
  }, [setSearchParams, pageSize])

  useEffect(() => () => {
    clearTimeout(saveTimeoutRef.current)
    if (pendingSaveRef.current) saveSetting('filters', pendingSaveRef.current)
  }, [])

  // Per-data sets / search index, so a keystroke doesn't rescan or re-lowercase every row
  const filterSets = useMemo(() => buildFilterSets(data), [data])
  const searchIndex = useMemo(() => buildSearchIndex(data), [data])

  // Drop saved genre/status values that no longer exist in the data (same object if none)
  const validFilters = useMemo(() => sanitizeFilters(filters, filterSets), [filters, filterSets])

  const deferredFilters = useDeferredValue(validFilters)

  const filtered = useMemo(
    () => filterAndSortShows(data, deferredFilters, searchIndex),
    [data, deferredFilters, searchIndex]
  )

  // Clamp page in-render when the list is shorter than the URL's page (bookmark, shrunk data)
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)

  // Keep the URL canonical with replace (no history entry): seeds an empty URL from saved filters,
  // drops invalid values (unknown sort, bad page / size), stale genres / status (sanitized once
  // data loads) and an out-of-range page. Compared as strings, so it settles in one pass and
  // StrictMode's re-run is a no-op. The page is clamped only once data has loaded and the deferred
  // filters have caught up — otherwise a lagging `filtered` would clamp a valid page. Never after a
  // failed load (data is [] then): a bookmarked page must survive until Retry succeeds.
  const settled = !loading && !tvData.error && deferredFilters === validFilters
  useEffect(() => {
    const ours = filtersToParams(validFilters, settled ? currentPage : page, pageSize)
    const canonical = withShowParams(new URLSearchParams(paramString), ours).toString()
    if (canonical !== paramString) setSearchParams(canonical, { replace: true })
  }, [paramString, validFilters, settled, currentPage, page, pageSize, setSearchParams])

  // Empty result with filters active → "Clear filters" (keeps the sort, pushes like Reset). Not for
  // an empty catalogue (nothing to clear). Memoized: ShowGrid is memo'd.
  const filtersActive = hasActiveFilters(validFilters)
  const sortBy = validFilters.sortBy
  const clearFiltersAction = useMemo(
    () =>
      filtersActive ? (
        <Button type="primary" onClick={() => handleFiltersChange(clearFilters(sortBy))}>
          Clear filters
        </Button>
      ) : null,
    [filtersActive, sortBy, handleFiltersChange]
  )

  // Page / page size changes push, so Back returns to the previous page
  const handlePageChange = (p: number, ps: number) =>
    setSearchParams(prev => withShowParams(prev, filtersToParams(validFilters, p, ps)))

  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize]
  )

  // The URL hooks above stay outside the gate on purpose: they seed / canonicalize the URL while
  // the CSV is still loading, exactly as before DataGate (an inner component would wait for data)
  return (
    <DataGate state={tvData} tip="Loading series...">
      {loaded => (
        <>
          <FilterBar data={loaded} filters={validFilters} onChange={handleFiltersChange} resultCount={filtered.length} />
          <ShowGrid data={paged} emptyAction={clearFiltersAction} />
          {filtered.length > PAGE_SIZE_OPTIONS[0] && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: SECTION_GAP }}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filtered.length}
                showSizeChanger
                pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
                showTotal={(total, range) => `${range[0]}–${range[1]} of ${total} shows`}
                onChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </DataGate>
  )
}
