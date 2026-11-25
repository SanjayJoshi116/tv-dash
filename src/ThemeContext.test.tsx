// @vitest-environment jsdom
// AppThemeProvider's Custom settings: debounced save, and cross-tab sync that must not clobber this
// tab's own unsaved change (an unrelated write in another tab carries the old accent).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AppThemeProvider, useThemeSetting } from './ThemeContext'
import { SETTINGS_KEY } from './utils/settings'
import { stubMatchMedia } from './hooks/matchMedia.fixture'

const OLD = { accent: '#6366f1', base: 'dark' } as const
const RED = { accent: '#e11d48', base: 'dark' } as const

const wrapper = ({ children }: { children: ReactNode }) => <AppThemeProvider>{children}</AppThemeProvider>
const stored = () => JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}')

// What another tab's save looks like here: storage already holds it, then the event fires
function otherTabWrites(settings: Record<string, unknown>) {
  const value = JSON.stringify(settings)
  localStorage.setItem(SETTINGS_KEY, value)
  window.dispatchEvent(new StorageEvent('storage', { key: SETTINGS_KEY, newValue: value, storageArea: localStorage }))
}

beforeEach(() => {
  vi.useFakeTimers()
  stubMatchMedia(true)
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ themeName: 'Custom', customTheme: OLD }))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('Custom theme settings', () => {
  it('setCustom applies at once and saves after the debounce', () => {
    const { result } = renderHook(() => useThemeSetting(), { wrapper })
    act(() => result.current.setCustom(RED))
    expect(result.current.custom).toEqual(RED)
    expect(stored().customTheme).toEqual(OLD)
    act(() => { vi.advanceTimersByTime(300) })
    expect(stored().customTheme).toEqual(RED)
  })

  it("another tab's unrelated write doesn't revert a change that is still waiting to be saved", () => {
    const { result } = renderHook(() => useThemeSetting(), { wrapper })
    act(() => result.current.setCustom(RED))
    act(() => otherTabWrites({ themeName: 'Custom', customTheme: OLD, filters: { search: 'x' } }))
    expect(result.current.custom).toEqual(RED)
    act(() => { vi.advanceTimersByTime(300) })
    expect(stored().customTheme).toEqual(RED)
    expect(result.current.custom).toEqual(RED)
  })

  it("with nothing pending, another tab's accent is applied (and not re-saved)", () => {
    const { result } = renderHook(() => useThemeSetting(), { wrapper })
    act(() => otherTabWrites({ themeName: 'Custom', customTheme: RED }))
    expect(result.current.custom).toEqual(RED)
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    act(() => { vi.advanceTimersByTime(1000) })
    expect(setItem).not.toHaveBeenCalled()
  })

  it('a pending change is flushed on unmount', () => {
    const { result, unmount } = renderHook(() => useThemeSetting(), { wrapper })
    act(() => result.current.setCustom(RED))
    unmount()
    expect(stored().customTheme).toEqual(RED)
  })
})
