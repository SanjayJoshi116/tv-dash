// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { SIDEBAR_KEY, consumeResetParam, getSettings, resetSettings, saveSetting, subscribeSettings } from './settings'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

function seed() {
  localStorage.setItem('tvdash-settings', JSON.stringify({ themeName: 'Dracula' }))
  localStorage.setItem(SIDEBAR_KEY, 'true')
  localStorage.setItem('other-app', 'keep')
}

describe('resetSettings', () => {
  it('clears both dashboard keys and leaves unrelated keys', () => {
    seed()
    resetSettings()
    expect(localStorage.getItem('tvdash-settings')).toBeNull()
    expect(localStorage.getItem(SIDEBAR_KEY)).toBeNull()
    expect(localStorage.getItem('other-app')).toBe('keep')
  })

  it('survives throwing storage, still trying every key', () => {
    const remove = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(() => resetSettings()).not.toThrow()
    expect(remove).toHaveBeenCalledTimes(2)
  })
})

describe('consumeResetParam', () => {
  function run(href: string) {
    const hist = { state: { idx: 0 }, replaceState: vi.fn() }
    const didReset = consumeResetParam({ href }, hist)
    return { didReset, hist }
  }

  it('?reset → resets and drops the param', () => {
    seed()
    const { didReset, hist } = run('http://x.test/shows?reset')
    expect(didReset).toBe(true)
    expect(localStorage.getItem('tvdash-settings')).toBeNull()
    expect(hist.replaceState).toHaveBeenCalledWith({ idx: 0 }, '', 'http://x.test/shows')
  })

  it('?reset&foo=1 → keeps the other params', () => {
    const { hist } = run('http://x.test/shows?reset&foo=1')
    expect(hist.replaceState).toHaveBeenCalledWith({ idx: 0 }, '', 'http://x.test/shows?foo=1')
  })

  it('keeps the hash', () => {
    const { hist } = run('http://x.test/stats?foo=1&reset=1#top')
    expect(hist.replaceState).toHaveBeenCalledWith({ idx: 0 }, '', 'http://x.test/stats?foo=1#top')
  })

  it('other params stay byte-for-byte (bare flags, escapes, +)', () => {
    const { hist } = run('http://x.test/shows?reset&debug&q=a%20b&r=c+d')
    expect(hist.replaceState).toHaveBeenCalledWith({ idx: 0 }, '', 'http://x.test/shows?debug&q=a%20b&r=c+d')
  })

  it('a param that only starts with reset is not reset', () => {
    const { didReset } = run('http://x.test/?resetting=1')
    expect(didReset).toBe(false)
  })

  it('?foo=1 → no-op', () => {
    seed()
    const { didReset, hist } = run('http://x.test/shows?foo=1')
    expect(didReset).toBe(false)
    expect(hist.replaceState).not.toHaveBeenCalled()
    expect(localStorage.getItem('tvdash-settings')).not.toBeNull()
  })

  it('blocked storage still strips the param', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    const { didReset, hist } = run('http://x.test/?reset')
    expect(didReset).toBe(true)
    expect(hist.replaceState).toHaveBeenCalledWith({ idx: 0 }, '', 'http://x.test/')
  })
})

describe('subscribeSettings', () => {
  // What another tab's write looks like here (jsdom never fires `storage` for its own writes)
  function fire(init: StorageEventInit) {
    window.dispatchEvent(new StorageEvent('storage', { storageArea: localStorage, ...init }))
  }

  it('passes the new settings on a tvdash-settings change', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeSettings(listener)
    fire({ key: 'tvdash-settings', newValue: JSON.stringify({ themeName: 'Dracula' }) })
    expect(listener).toHaveBeenCalledExactlyOnceWith({ themeName: 'Dracula' })
    unsubscribe()
  })

  it('ignores other keys and other storage areas', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeSettings(listener)
    fire({ key: 'other-app', newValue: '{}' })
    fire({ key: SIDEBAR_KEY, newValue: 'true' })
    fire({ key: 'tvdash-settings', newValue: '{}', storageArea: sessionStorage })
    expect(listener).not.toHaveBeenCalled()
    unsubscribe()
  })

  it('a corrupt or non-object value is ignored (listener not called)', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeSettings(listener)
    for (const newValue of ['{not json', '42', '"Dracula"', '[1]', 'null']) fire({ key: 'tvdash-settings', newValue })
    expect(listener).not.toHaveBeenCalled()
    unsubscribe()
  })

  it('removed settings (reset) or localStorage.clear() → {}', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeSettings(listener)
    fire({ key: 'tvdash-settings', newValue: null })
    fire({ key: null })
    expect(listener.mock.calls).toEqual([[{}], [{}]])
    unsubscribe()
  })

  it('unsubscribe stops calls', () => {
    const listener = vi.fn()
    subscribeSettings(listener)()
    fire({ key: 'tvdash-settings', newValue: '{}' })
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('saveSetting', () => {
  it("keeps another tab's change made since this tab loaded", () => {
    localStorage.setItem('tvdash-settings', JSON.stringify({ themeName: 'Default Light' }))
    // another tab writes the theme directly
    localStorage.setItem('tvdash-settings', JSON.stringify({ themeName: 'Dracula' }))
    saveSetting('filters', { search: 'x' })
    expect(getSettings()).toEqual({ themeName: 'Dracula', filters: { search: 'x' } })
  })
})
