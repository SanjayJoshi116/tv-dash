// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { SEQUENCE_TIMEOUT_MS, isTypingTarget, useHotkeys, type HotkeyMap } from './useHotkeys'

function press(key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(e)
  return e
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}) {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  document.body.append(node)
  return node
}

let spies: Record<string, ReturnType<typeof vi.fn>>
let map: HotkeyMap

beforeEach(() => {
  vi.useFakeTimers()
  spies = { t: vi.fn(), '?': vi.fn(), 'g d': vi.fn(), 'g s': vi.fn() }
  map = spies as unknown as HotkeyMap
})

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('useHotkeys', () => {
  it('fires a single key and prevents its default', () => {
    renderHook(() => useHotkeys(map))
    const e = press('t')
    expect(spies.t).toHaveBeenCalledOnce()
    expect(e.defaultPrevented).toBe(true)
  })

  it('fires a sequence, not the single key of its second half', () => {
    renderHook(() => useHotkeys({ ...map, d: vi.fn() }))
    press('g')
    press('d')
    expect(spies['g d']).toHaveBeenCalledOnce()
  })

  it('drops a sequence after the timeout', () => {
    renderHook(() => useHotkeys(map))
    press('g')
    vi.advanceTimersByTime(SEQUENCE_TIMEOUT_MS + 1)
    press('s')
    expect(spies['g s']).not.toHaveBeenCalled()
  })

  it('handles a non-matching second key on its own', () => {
    renderHook(() => useHotkeys(map))
    press('g')
    press('t')
    expect(spies.t).toHaveBeenCalledOnce()
    press('d') // prefix was consumed
    expect(spies['g d']).not.toHaveBeenCalled()
  })

  it.each([
    ['text input', () => el('input')],
    ['textarea', () => el('textarea')],
    ['contenteditable', () => el('div', { contenteditable: 'true' })],
    ['combobox', () => el('input', { role: 'combobox' })],
    ['inside a textbox', () => el('div', { role: 'textbox' }).appendChild(document.createElement('span'))],
  ])('is suppressed in a %s', (_, make) => {
    renderHook(() => useHotkeys(map))
    const target = make()
    press('t', {}, target)
    press('g', {}, target)
    press('d', {}, target)
    expect(spies.t).not.toHaveBeenCalled()
    expect(spies['g d']).not.toHaveBeenCalled()
  })

  it('still fires on a checkbox', () => {
    renderHook(() => useHotkeys(map))
    press('t', {}, el('input', { type: 'checkbox' }))
    expect(spies.t).toHaveBeenCalledOnce()
  })

  it.each(['ctrlKey', 'metaKey', 'altKey'])('is suppressed with %s', mod => {
    renderHook(() => useHotkeys(map))
    const e = press('t', { [mod]: true })
    expect(spies.t).not.toHaveBeenCalled()
    expect(e.defaultPrevented).toBe(false)
  })

  it('ignores auto-repeat and IME composition', () => {
    renderHook(() => useHotkeys(map))
    press('t', { repeat: true })
    press('t', { isComposing: true })
    expect(spies.t).not.toHaveBeenCalled()
  })

  it('treats Shift as part of the key (Shift+/ → ?)', () => {
    renderHook(() => useHotkeys(map))
    press('?', { shiftKey: true })
    expect(spies['?']).toHaveBeenCalledOnce()
  })

  it('does nothing while disabled, and resumes when enabled', () => {
    const { rerender } = renderHook(({ enabled }) => useHotkeys(map, { enabled }), { initialProps: { enabled: false } })
    press('t')
    expect(spies.t).not.toHaveBeenCalled()
    rerender({ enabled: true })
    press('t')
    expect(spies.t).toHaveBeenCalledOnce()
  })

  it('uses the latest map without re-subscribing', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(({ m }) => useHotkeys(m), { initialProps: { m: { t: first } as HotkeyMap } })
    rerender({ m: { t: second } })
    press('t')
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledOnce()
    expect(add.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(1)
  })

  it('removes its listener on unmount', () => {
    const { unmount } = renderHook(() => useHotkeys(map))
    unmount()
    press('t')
    expect(spies.t).not.toHaveBeenCalled()
  })

  it('ignores inherited keys', () => {
    renderHook(() => useHotkeys(map))
    expect(() => press('constructor')).not.toThrow()
  })
})

describe('isTypingTarget', () => {
  it('is false for non-elements and plain elements', () => {
    expect(isTypingTarget(null)).toBe(false)
    expect(isTypingTarget(window)).toBe(false)
    expect(isTypingTarget(el('button'))).toBe(false)
    expect(isTypingTarget(el('div', { contenteditable: 'false' }))).toBe(false)
  })

  it('is true for select', () => {
    expect(isTypingTarget(el('select'))).toBe(true)
  })
})
