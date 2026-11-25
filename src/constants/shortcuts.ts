// Global keyboard shortcuts — the one list. GlobalShortcuts maps every entry to a handler
// (typed by ShortcutKey, so an entry without one fails to compile) and ShortcutsHelp renders it,
// so the cheat sheet can't drift from the behavior. Keys are useHotkeys keys (`e.key`, or
// two-key `'g d'` sequences).
export const SHORTCUTS = [
  { keys: 'g d', label: 'Go to Dashboard' },
  { keys: 'g s', label: 'Go to Shows' },
  { keys: 'g t', label: 'Go to Statistics' },
  { keys: '/', label: 'Search shows' },
  { keys: 't', label: 'Next theme' },
  { keys: '?', label: 'Show keyboard shortcuts' },
] as const

export type ShortcutKey = (typeof SHORTCUTS)[number]['keys']
