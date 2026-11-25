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

// `name`: a built-in theme, or 'Custom' (customTheme.ts builds it on a built-in base)
export type Theme = ThemeDef & { name: ThemeName | typeof CUSTOM_THEME }

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
  // Accessibility-focused: AAA text (≥ 7:1), chart colors + border ≥ 4.5:1 (extra test assertions)
  'High Contrast': {
    isDark: true,
    token: { colorPrimary: '#ffd60a', colorBgBase: '#000000', colorTextBase: '#ffffff' },
    headerBg: '#0a0a0a',
    contentBg: '#000000',
    borderColor: '#a3a3a3',
    posterFallbackBg: '#1a1a1a',
    chartColors: ['#ffd60a', '#4cc9f0', '#ff6b9d', '#7cff6b', '#ff9f1c', '#c77dff', '#00f5d4', '#ff5c5c', '#a3e635', '#60a5fa'],
    chartGrid: '#5c5c5c',
    chartText: '#ffffff',
    tiers: {
      success: { fill: '#7cff6b', onFill: '#000000' },
      warning: { fill: '#ffd60a', onFill: '#000000' },
      danger: { fill: '#ff5c5c', onFill: '#000000' },
    },
    star: '#ffd60a',
  },
  // Default Dark on true black (#000) surfaces — OLED phones
  'OLED Black': {
    isDark: true,
    token: { colorPrimary: '#6366f1', colorBgBase: '#000000' },
    headerBg: '#000000',
    contentBg: '#000000',
    borderColor: '#1f1f1f',
    posterFallbackBg: '#111111',
    chartColors: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6', '#f97316', '#84cc16'],
    chartGrid: '#262626',
    chartText: '#cccccc',
    tiers: {
      success: { fill: '#52c41a', onFill: '#000000' },
      warning: { fill: '#faad14', onFill: '#000000' },
      danger: { fill: '#f5222d', onFill: '#000000' },
    },
    star: '#faad14',
  },
  // Nord (nordtheme.com, MIT): Polar Night surfaces, Frost + Aurora accents
  'Nord': {
    isDark: true,
    token: { colorPrimary: '#88c0d0', colorBgBase: '#2e3440', colorTextBase: '#eceff4' },
    headerBg: '#3b4252',
    contentBg: '#2e3440',
    borderColor: '#4c566a',
    posterFallbackBg: '#434c5e',
    chartColors: ['#88c0d0', '#81a1c1', '#b48ead', '#ebcb8b', '#a3be8c', '#d08770', '#bf616a', '#8fbcbb', '#b3d4f0', '#d8dee9'],
    chartGrid: '#4c566a',
    chartText: '#eceff4',
    tiers: {
      success: { fill: '#a3be8c', onFill: '#2e3440' },
      warning: { fill: '#ebcb8b', onFill: '#2e3440' },
      danger: { fill: '#e0828a', onFill: '#2e3440' },
    },
    star: '#ebcb8b',
  },
  // Solarized (ethanschoonover.com/solarized, MIT) light; accents darkened where < 3:1 on base3
  'Solarized Light': {
    isDark: false,
    token: { colorPrimary: '#268bd2', colorBgBase: '#fdf6e3', colorTextBase: '#073642' },
    headerBg: '#eee8d5',
    contentBg: '#fdf6e3',
    borderColor: '#d3cbb7',
    posterFallbackBg: '#e4ddc8',
    chartColors: ['#268bd2', '#6c71c4', '#d33682', '#a07800', '#6f8000', '#1f8a82', '#dc322f', '#cb4b16', '#586e75', '#9c4fa0'],
    chartGrid: '#e4ddc8',
    chartText: '#073642',
    tiers: {
      success: { fill: '#5c7300', onFill: '#fdf6e3' },
      warning: { fill: '#8a6500', onFill: '#fdf6e3' },
      danger: { fill: '#c0281f', onFill: '#fdf6e3' },
    },
    star: '#8a6500',
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


// Theme preference: follow the OS color scheme, an explicit theme name, or the user's Custom
// accent theme (accent + base saved separately as `customTheme`, see parseCustomTheme)
export const SYSTEM_THEME = 'System'
export const CUSTOM_THEME = 'Custom'
export type ThemePreference = ThemeName | typeof SYSTEM_THEME | typeof CUSTOM_THEME
export const THEME_OPTIONS: readonly ThemePreference[] = [SYSTEM_THEME, ...THEME_NAMES, CUSTOM_THEME]
const SYSTEM_DARK: ThemeName = 'Default Dark'
const SYSTEM_LIGHT: ThemeName = 'Default Light'
// Fallback *resolved* theme (ThemeContext default). The default *preference* is SYSTEM_THEME.
export const DEFAULT_THEME_NAME: ThemeName = SYSTEM_DARK

// Own-key check (not `name in THEMES`): 'constructor' / 'toString' must not count as themes
export function isThemeName(name: unknown): name is ThemeName {
  return typeof name === 'string' && Object.prototype.hasOwnProperty.call(THEME_DEFS, name)
}

// 'System', 'Custom' or a known theme name (own-key check, like isThemeName)
export function isThemePreference(raw: unknown): raw is ThemePreference {
  return raw === SYSTEM_THEME || raw === CUSTOM_THEME || isThemeName(raw)
}

// Saved `themeName` → preference: anything invalid → 'System'
export function parseThemePreference(raw: unknown): ThemePreference {
  return isThemePreference(raw) ? raw : SYSTEM_THEME
}

// Preference + OS dark preference → the built-in theme to render. Not for Custom: that's built
// by AppThemeProvider (buildCustomTheme) and painted by the boot script from CUSTOM_BASES.
export function resolveThemeName(pref: Exclude<ThemePreference, typeof CUSTOM_THEME>, prefersDark: boolean): ThemeName {
  if (isThemeName(pref)) return pref
  return prefersDark ? SYSTEM_DARK : SYSTEM_LIGHT
}

// ── Custom theme settings (`customTheme` in tvdash-settings) ──
// Kept here (not in customTheme.ts) because the boot script needs the base → theme mapping and
// this module must stay import-free.
export type CustomBase = 'dark' | 'light'
export const CUSTOM_BASES: Record<CustomBase, ThemeName> = { dark: 'Default Dark', light: 'Default Light' }
export type CustomThemeSettings = { accent: string; base: CustomBase }

const HEX6 = /^#[0-9a-f]{6}$/i
export const isCustomBase = (raw: unknown): raw is CustomBase => raw === 'dark' || raw === 'light'

// Saved value → settings, field by field: invalid base → dark; missing / invalid accent → the
// base theme's own primary. Never throws (any JSON value can come out of storage).
export function parseCustomTheme(raw: unknown): CustomThemeSettings {
  const obj = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
  const base = isCustomBase(obj.base) ? obj.base : 'dark'
  const accent = typeof obj.accent === 'string' && HEX6.test(obj.accent)
    ? obj.accent.toLowerCase()
    : THEMES[CUSTOM_BASES[base]].token.colorPrimary
  return { accent, base }
}

// ── `?theme=<option>` URL override (one visit, never saved) ──
export const THEME_PARAM = 'theme'

// Query string → the selector option it names, or null. Case-insensitive on the decoded, trimmed
// value (URLSearchParams decodes %20 and +); the first `theme` param wins. Matches the option list
// itself (System / names / Custom), so inherited keys like 'constructor' can't match.
export function readThemeOverride(search: string): ThemePreference | null {
  const raw = new URLSearchParams(search).get(THEME_PARAM)
  if (raw === null) return null
  const wanted = raw.trim().toLowerCase()
  if (!wanted) return null
  return THEME_OPTIONS.find(o => o.toLowerCase() === wanted) ?? null
}
