import { describe, it, expect } from 'vitest'
import { CUSTOM_THEME, SYSTEM_THEME, THEMES, THEME_NAMES, THEME_OPTIONS, isThemeName, isThemePreference, parseCustomTheme, parseThemePreference, readThemeOverride, resolveThemeName, type Theme } from './themes'
import { buildCustomTheme } from './customTheme'
import { antdThemeConfig } from './antdTheme'
import { theme as antTheme } from 'antd'
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
    expect(resolveThemeName('Nope' as typeof SYSTEM_THEME, false)).toBe('Default Light')
    expect(resolveThemeName('constructor' as typeof SYSTEM_THEME, true)).toBe('Default Dark')
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
    for (const ok of [SYSTEM_THEME, CUSTOM_THEME, ...THEME_NAMES]) expect(isThemePreference(ok)).toBe(true)
    for (const bad of ['Solarized', '', 'system', 'custom', 'constructor', undefined, null, 42]) expect(isThemePreference(bad)).toBe(false)
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

  it('"System", "Custom" and valid theme names are kept', () => {
    expect(parseThemePreference('System')).toBe(SYSTEM_THEME)
    expect(parseThemePreference('Custom')).toBe(CUSTOM_THEME)
    for (const name of THEME_NAMES) expect(parseThemePreference(name)).toBe(name)
  })
})

it('THEME_OPTIONS lists System first, then every theme, then Custom', () => {
  expect(THEME_OPTIONS).toEqual([SYSTEM_THEME, ...THEME_NAMES, CUSTOM_THEME])
})

describe('parseCustomTheme', () => {
  it('keeps a valid accent (lowercased) and base', () => {
    expect(parseCustomTheme({ accent: '#E11D48', base: 'light' })).toEqual({ accent: '#e11d48', base: 'light' })
  })

  it('invalid base → dark, accent kept', () => {
    for (const base of [undefined, 'Dark', 'constructor', 1, null]) {
      expect(parseCustomTheme({ accent: '#e11d48', base })).toEqual({ accent: '#e11d48', base: 'dark' })
    }
  })

  it('missing / invalid accent → the base theme primary', () => {
    for (const accent of [undefined, '', 'red', '#fff', '#e11d488', 'toString', 42, { r: 1 }]) {
      expect(parseCustomTheme({ accent, base: 'light' }).accent).toBe(THEMES['Default Light'].token.colorPrimary)
      expect(parseCustomTheme({ accent }).accent).toBe(THEMES['Default Dark'].token.colorPrimary)
    }
  })

  it('non-object → defaults', () => {
    for (const raw of [undefined, null, 'x', 42, true, ['#e11d48', 'light']]) {
      expect(parseCustomTheme(raw)).toEqual({ accent: THEMES['Default Dark'].token.colorPrimary, base: 'dark' })
    }
  })
})

// ── Theme contract: every theme is complete and readable on its own contentBg ──

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
const COLOR_FIELDS = ['headerBg', 'contentBg', 'borderColor', 'posterFallbackBg', 'chartGrid', 'chartText', 'star'] as const
const TIERS = ['success', 'warning', 'danger'] as const

// Built-ins + sample Custom themes (pale / grey / black / white / saturated, both bases)
const CUSTOM_SAMPLES = [['#e11d48', 'dark'], ['#fef08a', 'light'], ['#808080', 'dark'], ['#000000', 'dark'], ['#ffffff', 'light'], ['#ffffff', 'dark'], ['#000000', 'light']] as const
const CONTRACT_CASES: [string, Theme][] = [
  ...THEME_NAMES.map((name): [string, Theme] => [name, THEMES[name]]),
  ...CUSTOM_SAMPLES.map(([accent, base]): [string, Theme] => [`Custom ${accent} on ${base}`, buildCustomTheme(accent, base)]),
]

describe.each(CONTRACT_CASES)('theme contract: %s', (label, theme) => {
  it('has every field as a valid color', () => {
    expect(label.startsWith(theme.name)).toBe(true)
    expect(typeof theme.isDark).toBe('boolean')
    expect(theme.token.colorPrimary).toMatch(HEX)
    expect(theme.token.colorBgBase).toMatch(HEX)
    if (theme.token.colorTextBase !== undefined) expect(theme.token.colorTextBase).toMatch(HEX)
    for (const field of COLOR_FIELDS) expect(theme[field], field).toMatch(HEX)
  })

  // The primary drives progress bars, highlights, the nav progress bar, area charts…
  it('colorPrimary ≥ 3:1 vs contentBg (AA graphics)', () => {
    expect(contrast(theme.token.colorPrimary, theme.contentBg)).toBeGreaterThanOrEqual(3)
  })

  // What antd renders: the dark algorithm shifts colorPrimary, and primary-button text is
  // colorTextLightSolid — antdThemeConfig must keep it ≥ 4.5:1 on that rendered primary
  it('primary-button text ≥ 4.5:1 on the primary antd renders (AA text)', () => {
    const rendered = antTheme.getDesignToken(antdThemeConfig(theme, false))
    expect(contrast(rendered.colorTextLightSolid, rendered.colorPrimary)).toBeGreaterThanOrEqual(4.5)
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

// ── Theme-specific guarantees (keyed by name: renaming a theme fails to compile) ──

it('named themes are offered in table order after System, Custom last', () => {
  expect(THEME_NAMES).toEqual(['Default Dark', 'Default Light', 'Dracula', 'High Contrast', 'OLED Black', 'Nord', 'Solarized Light'])
})

describe('High Contrast (AAA text, ≥ 4.5:1 graphics)', () => {
  const hc = THEMES['High Contrast']
  it('text ≥ 7:1 vs contentBg', () => {
    expect(contrast(hc.chartText, hc.contentBg)).toBeGreaterThanOrEqual(7)
    expect(contrast(hc.token.colorTextBase ?? '', hc.contentBg)).toBeGreaterThanOrEqual(7)
  })
  it.each([...hc.chartColors, hc.borderColor])('%s ≥ 4.5:1 vs contentBg', color => {
    expect(contrast(color, hc.contentBg)).toBeGreaterThanOrEqual(4.5)
  })
})

it('OLED Black uses pure black content + header', () => {
  expect(THEMES['OLED Black'].contentBg).toBe('#000000')
  expect(THEMES['OLED Black'].headerBg).toBe('#000000')
})

it('System never resolves to one of the added themes', () => {
  expect([resolveThemeName(SYSTEM_THEME, true), resolveThemeName(SYSTEM_THEME, false)]).toEqual(['Default Dark', 'Default Light'])
})

describe('readThemeOverride', () => {
  it.each([
    ['?theme=Dracula', 'Dracula'],
    ['?theme=dracula', 'Dracula'],
    ['?theme=default%20light', 'Default Light'],
    ['?theme=Default+Light', 'Default Light'],
    ['?theme=%20Nord%20', 'Nord'],
    ['theme=OLED%20BLACK', 'OLED Black'],
    ['?theme=system', 'System'],
    ['?theme=Custom', 'Custom'],
    ['?foo=1&theme=Dracula&bar', 'Dracula'],
    ['?theme=Dracula&theme=Nord', 'Dracula'],
  ] as const)('%s → %s', (search, expected) => {
    expect(readThemeOverride(search)).toBe(expected)
  })

  it.each(['', '?', '?theme', '?theme=', '?theme=%20', '?theme=Nope', '?theme=constructor', '?theme=toString', '?Theme=Dracula', '?themes=Dracula'])(
    '%j → null', search => {
      expect(readThemeOverride(search)).toBeNull()
    },
  )
})
