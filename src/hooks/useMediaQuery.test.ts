// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useMediaQuery } from './useMediaQuery'
import { stubMatchMedia } from './matchMedia.fixture'

afterEach(() => vi.unstubAllGlobals())

describe('useMediaQuery', () => {
  it('returns the initial match state', () => {
    stubMatchMedia(true)
    expect(renderHook(() => useMediaQuery('(prefers-color-scheme: dark)')).result.current).toBe(true)
  })

  it('updates live on a change event', () => {
    const mq = stubMatchMedia(false)
    const { result } = renderHook(() => useMediaQuery('(prefers-color-scheme: dark)'))
    expect(result.current).toBe(false)
    act(() => mq.set(true))
    expect(result.current).toBe(true)
    act(() => mq.set(false))
    expect(result.current).toBe(false)
  })

  it('removes its listener on unmount', () => {
    const mq = stubMatchMedia(false)
    const { unmount } = renderHook(() => useMediaQuery('(prefers-color-scheme: dark)'))
    expect(mq.listeners.size).toBe(1)
    unmount()
    expect(mq.listeners.size).toBe(0)
  })

  it('returns false without matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(renderHook(() => useMediaQuery('(prefers-color-scheme: dark)')).result.current).toBe(false)
  })
})
