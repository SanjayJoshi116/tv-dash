import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Pagination } from 'antd'
import { useTvDataContext } from '../context/TvDataContext'
import { FilterBar, type Filters } from '../components/FilterBar'
import { ShowGrid } from '../components/ShowGrid'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { getSettings, saveSetting } from '../utils/settings'
import { recentFirst } from '../utils/derive'

const DEFAULT_FILTERS: Filters = { search: '', genres: [], status: '', sortBy: 'recentFirst' }
const DEFAULT_PAGE_SIZE = 24

function loadFilters(): Filters {
  try {
    const parsed = getSettings() as { filters?: Partial<Filters> }
    return { ...DEFAULT_FILTERS, ...(parsed.filters ?? {}) }
  } catch {
    return DEFAULT_FILTERS
  }
}

export function ShowsPage() {
  const { data, loading, error, refetch } = useTvDataContext()
  const [filters, setFilters] = useState<Filters>(loadFilters)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const handleFiltersChange = useCallback((f: Filters) => {
    setFilters(f)
    setPage(1)
    clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => saveSetting('filters', f), 300)
  }, [])

  useEffect(() => () => clearTimeout(saveTimeoutRef.current), [])

  const deferredFilters = useDeferredValue(filters)

  const filtered = useMemo(() => {
    let result = [...data]

    if (deferredFilters.search) {
      const q = deferredFilters.search.toLowerCase()
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.actors.some(a => a.toLowerCase().includes(q)) ||
        s.keywords.some(k => k.toLowerCase().includes(q)) ||
        s.genres.some(g => g.toLowerCase().includes(q)) ||
        s.creators.some(c => c.toLowerCase().includes(q)) ||
        s.networks.some(n => n.toLowerCase().includes(q))
      )
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
      result.sort((a, b) => {
        if (key === 'name') return a.name.localeCompare(b.name)
        return (b[key] as number) - (a[key] as number)
      })
    }

    return result
  }, [data, deferredFilters])

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
      <FilterBar data={data} filters={filters} onChange={handleFiltersChange} />
      <ShowGrid data={paged} />
      {filtered.length > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filtered.length}
            showSizeChanger
            pageSizeOptions={[12, 24, 48, 96]}
            showTotal={(total, range) => `${range[0]}–${range[1]} of ${total} shows`}
            onChange={(p, ps) => { setPage(p); setPageSize(ps) }}
          />
        </div>
      )}
    </>
  )
}
