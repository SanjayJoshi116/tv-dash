import { describe, it, expect } from 'vitest'
import { SYSTEM_THEME, THEMES, THEME_NAMES, THEME_OPTIONS, isThemeName, isThemePreference, parseThemePreference, resolveThemeName, type ThemePreference } from './themes'
import { contrast } from './utils/contrast.fixture'

describe('resolveThemeName', () => {
  it('System follows the OS color scheme', () => {
    expect(resolveThemeName(SYSTEM_THEME, true)).toBe('Default Dark')
    expect(resolveThemeName(SYSTEM_THEME, false)).toBe('Default Light')
  })

  it('a named theme ignores the OS color scheme', () => {
    for (const name of THEME_NAMES) {
      expect(resolveThemeName(name, true)).toBe(name)
      expect(resolveThemeName(name, false)).toBe(name)
    }
  })

  it('an unknown or inherited name resolves like System', () => {
    // Not a ThemePreference at compile time, but the runtime guard must still hold
    expect(resolveThemeName('Nope' as ThemePreference, false)).toBe('Default Light')
    expect(resolveThemeName('constructor' as ThemePreference, true)).toBe('Default Dark')
  })
})

describe('isThemeName', () => {
  it('accepts every theme name', () => {
    for (const name of THEME_NAMES) expect(isThemeName(name)).toBe(true)
  })

  it('rejects unknown, System, inherited keys and non-strings', () => {
    for (const raw of ['Solarized', '', 'System', 'default dark', 'constructor', 'toString', '__proto__', 'hasOwnProperty', 42, null, undefined]) {
      expect(isThemeName(raw)).toBe(false)
    }
  })
})

describe('isThemePreference', () => {
  it('accepts System and every theme name, rejects anything else (incl. inherited keys)', () => {
    for (const ok of [SYSTEM_THEME, ...THEME_NAMES]) expect(isThemePreference(ok)).toBe(true)
    for (const bad of ['Solarized', '', 'system', 'constructor', undefined, null, 42]) expect(isThemePreference(bad)).toBe(false)
  })
})

describe('parseThemePreference', () => {
  it('missing / non-string → System', () => {
    for (const raw of [undefined, null, 42, true, {}, ['Dracula']]) {
      expect(parseThemePreference(raw)).toBe(SYSTEM_THEME)
    }
  })

  it('unknown or inherited name → System', () => {
    expect(parseThemePreference('Solarized')).toBe(SYSTEM_THEME)
    expect(parseThemePreference('toString')).toBe(SYSTEM_THEME)
    expect(parseThemePreference('')).toBe(SYSTEM_THEME)
  })

  it('"System" and valid theme names are kept', () => {
    expect(parseThemePreference('System')).toBe(SYSTEM_THEME)
    for (const name of THEME_NAMES) expect(parseThemePreference(name)).toBe(name)
  })
})

it('THEME_OPTIONS lists System first, then every theme', () => {
  expect(THEME_OPTIONS).toEqual([SYSTEM_THEME, ...THEME_NAMES])
})

// ── Theme contract: every theme is complete and readable on its own contentBg ──

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
const COLOR_FIELDS = ['headerBg', 'contentBg', 'borderColor', 'posterFallbackBg', 'chartGrid', 'chartText', 'star'] as const
const TIERS = ['success', 'warning', 'danger'] as const

describe.each(THEME_NAMES)('theme contract: %s', name => {
  const theme = THEMES[name]

  it('has every field as a valid color', () => {
    expect(theme.name).toBe(name)
    expect(typeof theme.isDark).toBe('boolean')
    expect(theme.token.colorPrimary).toMatch(HEX)
    expect(theme.token.colorBgBase).toMatch(HEX)
    if (theme.token.colorTextBase !== undefined) expect(theme.token.colorTextBase).toMatch(HEX)
    for (const field of COLOR_FIELDS) expect(theme[field], field).toMatch(HEX)
  })

  it('has exactly 10 distinct chart colors', () => {
    expect(theme.chartColors).toHaveLength(10)
    for (const c of theme.chartColors) expect(c).toMatch(HEX)
    expect(new Set(theme.chartColors.map(c => c.toLowerCase())).size).toBe(10)
  })

  it('chartText ≥ 4.5:1 vs contentBg (AA text)', () => {
    expect(contrast(theme.chartText, theme.contentBg)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(theme.chartColors)('chart color %s ≥ 3:1 vs contentBg (AA graphics)', color => {
    expect(contrast(color, theme.contentBg)).toBeGreaterThanOrEqual(3)
  })

  it.each(TIERS)('tier %s: fill ≥ 3:1 vs contentBg, onFill ≥ 4.5:1 vs fill', tier => {
    const { fill, onFill } = theme.tiers[tier]
    expect(fill).toMatch(HEX)
    expect(onFill).toMatch(HEX)
    expect(contrast(fill, theme.contentBg)).toBeGreaterThanOrEqual(3)
    expect(contrast(onFill, fill)).toBeGreaterThanOrEqual(4.5)
  })

  it('star ≥ 3:1 vs contentBg (AA graphics)', () => {
    expect(contrast(theme.star, theme.contentBg)).toBeGreaterThanOrEqual(3)
  })
})
