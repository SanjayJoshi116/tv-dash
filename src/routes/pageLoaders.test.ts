import { describe, it, expect, vi } from 'vitest'
import { createPrefetcher, shouldIdlePrefetch } from './pageLoaders'

describe('shouldIdlePrefetch', () => {
  it('prefetches when the browser reports nothing (Firefox / Safari)', () => {
    expect(shouldIdlePrefetch(undefined)).toBe(true)
    expect(shouldIdlePrefetch({})).toBe(true)
  })

  it('skips under Data Saver, even on a fast connection', () => {
    expect(shouldIdlePrefetch({ saveData: true, effectiveType: '4g' })).toBe(false)
  })

  it('skips on 2g / slow-2g, prefetches on 3g / 4g', () => {
    expect(shouldIdlePrefetch({ effectiveType: '2g' })).toBe(false)
    expect(shouldIdlePrefetch({ effectiveType: 'slow-2g' })).toBe(false)
    expect(shouldIdlePrefetch({ effectiveType: '3g' })).toBe(true)
    expect(shouldIdlePrefetch({ effectiveType: '4g', saveData: false })).toBe(true)
  })
})

describe('createPrefetcher', () => {
  const never = () => new Promise<unknown>(() => {})
  const prefetcherWith = (showDetail: () => Promise<unknown>) =>
    createPrefetcher({ dashboard: never, shows: never, statistics: never, showDetail })

  it('calls a loader once for repeated triggers', async () => {
    const load = vi.fn(() => Promise.resolve({}))
    const prefetch = prefetcherWith(load)
    for (let i = 0; i < 10; i++) prefetch('showDetail')
    await Promise.resolve()
    prefetch('showDetail')
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('retries after a rejection, without an unhandled rejection', async () => {
    const load = vi.fn<() => Promise<unknown>>()
      .mockRejectedValueOnce(new Error('chunk failed'))
      .mockResolvedValue({})
    const prefetch = prefetcherWith(load)
    prefetch('showDetail')
    await vi.waitFor(() => {
      prefetch('showDetail')
      expect(load).toHaveBeenCalledTimes(2)
    })
  })
})
