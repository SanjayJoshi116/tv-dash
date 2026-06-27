const KEY = 'tvdash-settings'

export function getSettings(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') } catch { return {} }
}

export function saveSetting(key: string, value: unknown): void {
  localStorage.setItem(KEY, JSON.stringify({ ...getSettings(), [key]: value }))
}
