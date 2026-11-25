// Dependency-free (no imports): vite.config.ts's theme boot script imports SETTINGS_KEY
export const SETTINGS_KEY = 'tvdash-settings'
// Sidebar collapsed state — read/written directly by AppLayout (intentional isolation from
// tvdash-settings); defined here so resetSettings() knows every key the dashboard owns.
export const SIDEBAR_KEY = 'tvdash-sidebar'

export function getSettings(): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export function saveSetting(key: string, value: unknown): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...getSettings(), [key]: value }))
  } catch {
    // Storage blocked or full — setting just won't persist.
  }
}

// Clears every key the dashboard owns (never localStorage.clear(): other apps may share the
// origin, e.g. localhost during dev). Each removal in its own try — blocked storage is a no-op.
export function resetSettings(): void {
  for (const key of [SETTINGS_KEY, SIDEBAR_KEY]) {
    try {
      localStorage.removeItem(key)
    } catch {
      // Storage blocked — nothing to clear.
    }
  }
}

// A raw query segment (`reset`, `reset=1`) names the reset param. Raw on purpose: removing it
// must leave the other params byte-for-byte (URLSearchParams would turn `debug` into `debug=`,
// `%20` into `+`). vite.config.ts's boot script applies the same rule to skip the saved theme.
export const RESET_PARAM = 'reset'
const isResetSegment = (seg: string) => seg.split('=')[0] === RESET_PARAM

// `?reset` escape hatch (main.tsx, before render): clear saved settings, then drop only the
// `reset` param — other params + hash kept, no new history entry. Returns whether it reset.
export function consumeResetParam(
  loc: Pick<Location, 'href'> = location,
  hist: Pick<History, 'state' | 'replaceState'> = history,
): boolean {
  const url = new URL(loc.href)
  const segments = url.search.slice(1).split('&')
  if (!segments.some(isResetSegment)) return false
  resetSettings()
  // URL#search's setter keeps existing escapes as they are
  url.search = segments.filter(s => s && !isResetSegment(s)).join('&')
  hist.replaceState(hist.state, '', url.href)
  return true
}