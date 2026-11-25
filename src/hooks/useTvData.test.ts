// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useTvData } from './useTvData'
import { VALID_CSV, VALID_ROW, csv, withId } from '../utils/parseSeriesCsv.fixture'
import { CSV_URL } from '../constants/paths'

// Parsing rules live in parseSeriesCsv.test.ts — these cover the fetch lifecycle only.

function fakeResponse(body: string, status = 200) {
  const ok = status >= 200 && status < 300
  return { ok, status, statusText: ok ? 'OK' : 'Error', text: () => Promise.resolve(body) }
}

function stubFetch(...responses: ReturnType<typeof fakeResponse>[]) {
  const fn = vi.fn()
  responses.forEach(r => fn.mockResolvedValueOnce(r))
  vi.stubGlobal('fetch', fn)
  return fn
}

async function renderLoaded() {
  const hook = renderHook(() => useTvData())
  await waitFor(() => expect(hook.result.current.loading).toBe(false))
  return hook.result
}

// A fetch whose response is released manually — for racing a slow request against a newer one
function deferredFetchResponse() {
  let release!: (r: ReturnType<typeof fakeResponse>) => void
  const promise = new Promise<ReturnType<typeof fakeResponse>>(r => { release = r })
  return { promise, release }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals() // restoreAllMocks doesn't undo stubGlobal
  vi.useRealTimers()
})

describe('useTvData', () => {
  it('starts in loading state', () => {
    stubFetch(fakeResponse(VALID_CSV))
    const { result } = renderHook(() => useTvData())
    expect(result.current).toMatchObject({ loading: true, data: [], error: null })
  })

  it('parses CSV and sets data on success', async () => {
    const fetchFn = stubFetch(fakeResponse(VALID_CSV))
    const result = await renderLoaded()
    expect(result.current.error).toBeNull()
    expect(result.current.data.map(s => s.name)).toEqual(['Breaking Bad'])
    // CSV_URL under Vite's base — '/' in tests, as in a root deploy
    expect(fetchFn).toHaveBeenCalledWith(CSV_URL, expect.anything())
    expect(CSV_URL).toBe('/tv_series.csv')
  })

  it('sets error on HTTP failure', async () => {
    stubFetch(fakeResponse('Not Found', 404))
    const result = await renderLoaded()
    expect(result.current.error).toContain('HTTP 404')
    expect(result.current.data).toHaveLength(0)
  })

  it('surfaces a fatal parse error', async () => {
    stubFetch(fakeResponse('ID,Title\n1,Show A'))
    const result = await renderLoaded()
    expect(result.current.error).toContain('CSV missing required columns')
  })

  it('logs skipped-row warnings and keeps the valid rows', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    stubFetch(fakeResponse(csv(VALID_ROW, '2,Broken Row,en')))
    const result = await renderLoaded()
    expect(result.current.data).toHaveLength(1)
    expect(result.current.warnings).toEqual([expect.stringContaining('skipped record 2')])
    expect(warn).toHaveBeenCalledOnce()
  })

  it('exposes refetch that resets error and retries', async () => {
    stubFetch(fakeResponse('', 500), fakeResponse(VALID_CSV))
    const result = await renderLoaded()
    expect(result.current.error).not.toBeNull()
    act(() => result.current.refetch())
    await waitFor(() => expect(result.current.data).toHaveLength(1))
    expect(result.current.error).toBeNull()
  })

  it('clears previous data when a refetch fails', async () => {
    stubFetch(fakeResponse(VALID_CSV), fakeResponse('', 500))
    const result = await renderLoaded()
    expect(result.current.data).toHaveLength(1)
    act(() => result.current.refetch())
    await waitFor(() => expect(result.current.error).toContain('HTTP 500'))
    expect(result.current.data).toHaveLength(0)
  })

  it('sets timeout error message when the request times out', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    // Never resolves on its own — only rejects when the hook's timeout aborts the signal
    vi.stubGlobal('fetch', vi.fn((_url: string, { signal }: { signal: AbortSignal }) =>
      new Promise((_, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))))))
    const { result } = renderHook(() => useTvData())
    await act(() => vi.advanceTimersByTimeAsync(10_000))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toContain('timed out')
  })

  it('ignores a slow response superseded by a refetch', async () => {
    const slow = deferredFetchResponse()
    const fetchFn = vi.fn()
      .mockReturnValueOnce(slow.promise)
      .mockResolvedValueOnce(fakeResponse(VALID_CSV))
    vi.stubGlobal('fetch', fetchFn)
    const { result } = renderHook(() => useTvData())
    act(() => result.current.refetch())
    await waitFor(() => expect(result.current.data).toHaveLength(1))
    // First request finally answers with 2 rows — must be discarded
    await act(async () => { slow.release(fakeResponse(csv(VALID_ROW, withId('2')))) })
    expect(result.current.data).toHaveLength(1)
    expect(result.current.error).toBeNull()
  })

  it('does not fetch when refetch is called after unmount', async () => {
    const fetchFn = stubFetch(fakeResponse(VALID_CSV))
    const { result, unmount } = renderHook(() => useTvData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const { refetch } = result.current
    unmount()
    refetch()
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })
})
