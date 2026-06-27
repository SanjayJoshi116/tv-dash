import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useTvData } from './useTvData'

const VALID_CSV = `TV ID,Name,Language,Seasons,Episode Runtime,First Air Year,Genres,Creators,Networks,Status,Total Episodes,Last Episode Air Date,Popularity,Vote Count,Vote Average,Actors/Actresses,Keywords/Tags,First Air Date,Overview,Tagline,Poster URL,Age Rating,Seasons Watched,Episodes Watched,Total Runtime Watched (min)
1,Breaking Bad,en,5,47,2008,"Drama,Crime",Vince Gilligan,AMC,Ended,62,2013-09-29,500,1000,9.5,Bryan Cranston,,2008-01-20,A chemistry teacher,,https://example.com/bb.jpg,TV-MA,1,62,2914`

const MISSING_COLS_CSV = `ID,Title\n1,Show A`

function mockFetch(body: string, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Not Found',
    text: () => Promise.resolve(body),
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useTvData', () => {
  it('starts in loading state', () => {
    vi.stubGlobal('fetch', mockFetch(VALID_CSV))
    const { result } = renderHook(() => useTvData())
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toHaveLength(0)
    expect(result.current.error).toBeNull()
  })

  it('parses CSV and sets data on success', async () => {
    vi.stubGlobal('fetch', mockFetch(VALID_CSV))
    const { result } = renderHook(() => useTvData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data[0].name).toBe('Breaking Bad')
    expect(result.current.data[0].voteAverage).toBe(9.5)
  })

  it('sets error on HTTP failure', async () => {
    vi.stubGlobal('fetch', mockFetch('Not Found', false, 404))
    const { result } = renderHook(() => useTvData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toContain('HTTP 404')
    expect(result.current.data).toHaveLength(0)
  })

  it('sets error when required CSV columns are missing', async () => {
    vi.stubGlobal('fetch', mockFetch(MISSING_COLS_CSV))
    const { result } = renderHook(() => useTvData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toContain('CSV missing required columns')
  })

  it('exposes refetch that resets error and retries', async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Error', text: () => Promise.resolve('') })
      .mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK', text: () => Promise.resolve(VALID_CSV) })
    vi.stubGlobal('fetch', fetchFn)

    const { result } = renderHook(() => useTvData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()

    result.current.refetch()
    await waitFor(() => expect(result.current.data).toHaveLength(1))
    expect(result.current.error).toBeNull()
  })

  it('sets timeout error message when fetch is aborted', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')))
    const { result } = renderHook(() => useTvData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toContain('timed out')
  })
})
