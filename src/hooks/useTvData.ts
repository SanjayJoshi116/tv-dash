import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TvSeries } from '../types/series'
import { parseSeriesCsv } from '../utils/parseSeriesCsv'

const FETCH_TIMEOUT_MS = 10_000

export function useTvData() {
  const [data, setData] = useState<TvSeries[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Skipped-row warnings from the last successful parse — surfaced as a banner by AppLayout
  const [warnings, setWarnings] = useState<string[]>([])
  // The in-flight request's controller. A response is stale once this no longer points at
  // its own controller (superseded by refetch, or nulled on unmount) — replaces a separate
  // request-id counter, and StrictMode-safe since each effect run gets its own.
  const controllerRef = useRef<AbortController | null>(null)
  // Guards a retained `refetch` called after unmount — it would otherwise install a fresh
  // (non-stale) controller and set state on an unmounted component
  const mountedRef = useRef(false)

  const fetchData = useCallback(() => {
    if (!mountedRef.current) return
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    const isStale = () => controllerRef.current !== controller

    setLoading(true)
    setError(null)

    let timedOut = false
    const timeoutId = setTimeout(() => { timedOut = true; controller.abort() }, FETCH_TIMEOUT_MS)

    fetch('/tv_series.csv', { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`)
        return r.text()
      })
      .then(text => {
        if (isStale()) return
        const { rows, warnings } = parseSeriesCsv(text)
        warnings.forEach(w => console.warn(w))
        setData(rows)
        setWarnings(warnings)
        setLoading(false)
      })
      .catch(err => {
        if (isStale()) return
        // One contract for every page: on error there is no data (no stale rows from a prior load)
        setData([])
        setWarnings([])
        setError(timedOut
          ? 'Request timed out. Check that tv_series.csv is in the public/ folder.'
          : err instanceof Error ? err.message : String(err))
        setLoading(false)
      })
      .finally(() => clearTimeout(timeoutId))
  }, [])

  useEffect(() => {
    mountedRef.current = true
    fetchData()
    return () => {
      mountedRef.current = false
      controllerRef.current?.abort()
      controllerRef.current = null
    }
  }, [fetchData])

  // Stable identity across re-renders, so TvDataProvider can pass it straight through as the context value
  return useMemo(
    () => ({ data, loading, error, warnings, refetch: fetchData }),
    [data, loading, error, warnings, fetchData]
  )
}
