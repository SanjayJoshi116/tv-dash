// Keep this module dependency-free (pure data + pure functions, no imports): vite.config.ts
// imports it to generate the index.html boot script, and tsconfig.node.json type-checks it.

// Everything a theme defines; `name` is added from its THEME_DEFS key
type ThemeDef = {
  isDark: boolean
  token: { colorPrimary: string; colorBgBase: string; colorTextBase?: string }
  headerBg: string
  contentBg: string
  borderColor: string
  posterFallbackBg: string
  chartColors: readonly string[]
  chartGrid: string
  chartText: string
  // Good / medium / poor values (ratings, completion): fill ≥ 3:1 vs contentBg, onFill ≥ 4.5:1 vs fill
  tiers: Record<Tier, { fill: string; onFill: string }>
  // Star icon next to ratings in compact lists (same for every rating) — ≥ 3:1 vs contentBg
  star: string
}

export type Tier = 'success' | 'warning' | 'danger'

export type Theme = ThemeDef & { name: ThemeName }

const THEME_DEFS = {
  'Default Dark': {
    isDark: true,
    token: { colorPrimary: '#6366f1', colorBgBase: '#0a0a0a' },
    headerBg: '#141414',
    contentBg: '#0a0a0a',
    borderColor: '#2a2a2a',
    posterFallbackBg: '#1a1a2e',
    chartColors: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6', '#f97316', '#84cc16'],
    chartGrid: '#333',
    chartText: '#ccc',
    tiers: {
      success: { fill: '#52c41a', onFill: '#141414' },
      warning: { fill: '#faad14', onFill: '#141414' },
      danger: { fill: '#f5222d', onFill: '#141414' },
    },
    star: '#faad14',
  },
  'Default Light': {
    isDark: false,
    token: { colorPrimary: '#4f46e5', colorBgBase: '#ffffff', colorTextBase: '#000000' },
    headerBg: '#ffffff',
    contentBg: '#f5f5f7',
    borderColor: '#d9d9d9',
    posterFallbackBg: '#e8e8ed',
    chartColors: ['#4f46e5', '#7c3aed', '#db2777', '#b45309', '#059669', '#2563eb', '#dc2626', '#0d9488', '#ea580c', '#4d7c0f'],
    chartGrid: '#e0e0e0',
    chartText: '#1a1a1a',
    tiers: {
      success: { fill: '#237804', onFill: '#ffffff' },
      warning: { fill: '#a05e00', onFill: '#ffffff' },
      danger: { fill: '#cf1322', onFill: '#ffffff' },
    },
    star: '#a05e00',
  },
  'Dracula': {
    isDark: true,
    token: { colorPrimary: '#bd93f9', colorBgBase: '#282a36' },
    headerBg: '#21222c',
    contentBg: '#282a36',
    borderColor: '#44475a',
    posterFallbackBg: '#1e1f29',
    chartColors: ['#bd93f9', '#ff79c6', '#50fa7b', '#f1fa8c', '#8be9fd', '#ffb86c', '#ff5555', '#6272a4', '#94e6ff', '#45b3e0'],
    chartGrid: '#44475a',
    chartText: '#f8f8f2',
    tiers: {
      success: { fill: '#50fa7b', onFill: '#21222c' },
      warning: { fill: '#f1fa8c', onFill: '#21222c' },
      danger: { fill: '#ff5555', onFill: '#21222c' },
    },
    star: '#f1fa8c',
  },
} as const satisfies Record<string, ThemeDef>

export type ThemeName = keyof typeof THEME_DEFS

// Key order = THEME_DEFS order (string keys keep insertion order)
export const THEME_NAMES = Object.keys(THEME_DEFS) as ThemeName[]

// The key is the theme's `name` — written once
export const THEMES = Object.fromEntries(
  THEME_NAMES.map((name): [ThemeName, Theme] => {
    const def: ThemeDef = THEME_DEFS[name]
    return [name, { ...def, name }]
  }),
) as Record<ThemeName, Theme>


// Theme preference: follow the OS color scheme, or an explicit theme name
export const SYSTEM_THEME = 'System'
export type ThemePreference = ThemeName | typeof SYSTEM_THEME
export const THEME_OPTIONS: readonly ThemePreference[] = [SYSTEM_THEME, ...THEME_NAMES]
const SYSTEM_DARK: ThemeName = 'Default Dark'
const SYSTEM_LIGHT: ThemeName = 'Default Light'
// Fallback *resolved* theme (ThemeContext default). The default *preference* is SYSTEM_THEME.
export const DEFAULT_THEME_NAME: ThemeName = SYSTEM_DARK

// Own-key check (not `name in THEMES`): 'constructor' / 'toString' must not count as themes
export function isThemeName(name: unknown): name is ThemeName {
  return typeof name === 'string' && Object.prototype.hasOwnProperty.call(THEME_DEFS, name)
}

// 'System' or a known theme name (own-key check, like isThemeName)
export function isThemePreference(raw: unknown): raw is ThemePreference {
  return raw === SYSTEM_THEME || isThemeName(raw)
}

// Saved `themeName` → preference: anything invalid → 'System'
export function parseThemePreference(raw: unknown): ThemePreference {
  return isThemePreference(raw) ? raw : SYSTEM_THEME
}

// Preference + OS dark preference → the theme name to render
export function resolveThemeName(pref: ThemePreference, prefersDark: boolean): ThemeName {
  if (isThemeName(pref)) return pref
  return prefersDark ? SYSTEM_DARK : SYSTEM_LIGHT
}
