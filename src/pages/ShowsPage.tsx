import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Alert, Button, Pagination, Spin } from 'antd'
import { useTvDataContext } from '../context/TvDataContext'
import { FilterBar, type Filters } from '../components/FilterBar'
import { ShowGrid } from '../components/ShowGrid'

const DEFAULT_FILTERS: Filters = { search: '', genres: [], status: '', sortBy: 'voteAverage' }
const DEFAULT_PAGE_SIZE = 24

function loadFilters(): Filters {
  try {
    const raw = localStorage.getItem('tvdash-settings')
    if (raw) {
      const parsed = JSON.parse(raw) as { filters?: Partial<Filters> }
      return { ...DEFAULT_FILTERS, ...(parsed.filters ?? {}) }
    }
  } catch {}
  return DEFAULT_FILTERS
}

export function ShowsPage() {
  const { data, loading, error, refetch } = useTvDataContext()
  const [filters, setFilters] = useState<Filters>(loadFilters)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const handleFiltersChange = useCallback((f: Filters) => {
    setFilters(f)
    setPage(1)
    try {
      const raw = localStorage.getItem('tvdash-settings')
      const existing = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
      localStorage.setItem('tvdash-settings', JSON.stringify({ ...existing, filters: f }))
    } catch {}
  }, [])

  const deferredFilters = useDeferredValue(filters)

  const filtered = useMemo(() => {
    let result = [...data]

    if (deferredFilters.search) {
      const q = deferredFilters.search.toLowerCase()
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.actors.some(a => a.toLowerCase().includes(q)) ||
        s.keywords.some(k => k.toLowerCase().includes(q))
      )
    }

    if (deferredFilters.genres.length) {
      result = result.filter(s => deferredFilters.genres.every(g => s.genres.includes(g)))
    }

    if (deferredFilters.status) {
      result = result.filter(s => s.status === deferredFilters.status)
    }

    const key = deferredFilters.sortBy
    result.sort((a, b) => {
      if (key === 'name') return a.name.localeCompare(b.name)
      return (b[key] as number) - (a[key] as number)
    })

    return result
  }, [data, deferredFilters])

  // Reset to page 1 when filtered result count changes (filter applied)
  useEffect(() => { setPage(1) }, [filtered.length])

  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  )

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 64 }}><Spin size="large" tip="Loading series..." /></div>
  }
  if (error) {
    return <Alert type="error" message="Failed to load data" description={error} showIcon action={<Button size="small" onClick={refetch}>Retry</Button>} />
  }

  return (
    <>
      <FilterBar data={data} filters={filters} onChange={handleFiltersChange} />
      <ShowGrid data={paged} />
      {filtered.length > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <Pagination
            current={page}
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
