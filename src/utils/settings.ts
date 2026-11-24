const KEY = 'tvdash-settings'

export function getSettings(): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export function saveSetting(key: string, value: unknown): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...getSettings(), [key]: value }))
  } catch {
    // Storage blocked or full — setting just won't persist.
  }
}
