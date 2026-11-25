import { vi } from 'vitest'

// jsdom has no matchMedia — a controllable fake (one shared state for every query), stubbed
// as a global. Includes the legacy addListener / removeListener that antd's Grid.useBreakpoint
// still calls. Undo with vi.unstubAllGlobals().
export function stubMatchMedia(initial = false) {
  let matches = initial
  const listeners = new Set<() => void>()
  const add = (_: string, cb: () => void) => { listeners.add(cb) }
  const remove = (_: string, cb: () => void) => { listeners.delete(cb) }
  const matchMedia = vi.fn((query: string) => ({
    media: query,
    get matches() { return matches },
    addEventListener: add,
    removeEventListener: remove,
    addListener: (cb: () => void) => add('change', cb),
    removeListener: (cb: () => void) => remove('change', cb),
  }))
  vi.stubGlobal('matchMedia', matchMedia)
  return {
    matchMedia,
    listeners,
    set(next: boolean) {
      matches = next
      listeners.forEach(cb => cb())
    },
  }
}
