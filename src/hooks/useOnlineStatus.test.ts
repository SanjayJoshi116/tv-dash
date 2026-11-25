// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useOnlineStatus } from './useOnlineStatus'

afterEach(() => vi.restoreAllMocks())

function goOnline(online: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online)
  window.dispatchEvent(new Event(online ? 'online' : 'offline'))
}

describe('useOnlineStatus', () => {
  it('returns the current navigator.onLine', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    expect(renderHook(() => useOnlineStatus()).result.current).toBe(false)
  })

  it('follows offline / online events', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(true)
    act(() => goOnline(false))
    expect(result.current).toBe(false)
    act(() => goOnline(true))
    expect(result.current).toBe(true)
  })

  it('removes its listeners on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    renderHook(() => useOnlineStatus()).unmount()
    expect(remove.mock.calls.map(c => c[0]).sort()).toEqual(['offline', 'online'])
  })
})
