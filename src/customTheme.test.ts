import { describe, it, expect } from 'vitest'
import { CUSTOM_THEME, THEMES, type CustomBase } from './themes'
import { MIN_CHART_CONTRAST, buildCustomTheme, customChartColors } from './customTheme'
import { contrastRatio, hslToHex } from './utils/color'

const BG: Record<CustomBase, string> = { dark: THEMES['Default Dark'].contentBg, light: THEMES['Default Light'].contentBg }

function expectReadablePalette(accent: string, base: CustomBase) {
  const colors = customChartColors(accent, base)
  expect(colors, accent).toHaveLength(10)
  expect(new Set(colors).size, `${accent} on ${base}: ${colors.join(' ')}`).toBe(10)
  for (const c of colors) {
    expect(c).toMatch(/^#[0-9a-f]{6}$/)
    expect(contrastRatio(c, BG[base]), `${c} (from ${accent}) on ${base}`).toBeGreaterThanOrEqual(MIN_CHART_CONTRAST)
  }
}

describe('customChartColors', () => {
  it.each([
    ['#fef08a', 'light'], ['#fef08a', 'dark'], ['#808080', 'light'], ['#808080', 'dark'],
    ['#000000', 'light'], ['#000000', 'dark'], ['#ffffff', 'light'], ['#ffffff', 'dark'],
    ['#e11d48', 'light'], ['#e11d48', 'dark'],
  ] as const)('%s on %s: 10 distinct colors, each ≥ 3:1', (accent, base) => {
    expectReadablePalette(accent, base)
  })

  // Sweep: every 7° of hue × lightness × saturation, both bases
  const SWEEP: [string, CustomBase][] = []
  for (let h = 0; h < 360; h += 7) {
    for (const l of [0.02, 0.2, 0.5, 0.8, 0.98]) {
      for (const s of [0, 0.3, 1]) {
        const hex = hslToHex([h, s, l])
        SWEEP.push([hex, 'dark'], [hex, 'light'])
      }
    }
  }
  it(`sweep of ${SWEEP.length} accent / base pairs stays readable and distinct`, () => {
    for (const [accent, base] of SWEEP) expectReadablePalette(accent, base)
  })

  it('color 0 is the accent itself when it is already readable', () => {
    expect(customChartColors('#E11D48', 'dark')[0]).toBe('#e11d48')
    expect(customChartColors('#4f46e5', 'light')[0]).toBe('#4f46e5')
  })

  it('a too-pale accent is corrected for color 0', () => {
    const [first] = customChartColors('#fef08a', 'light')
    expect(first).not.toBe('#fef08a')
    expect(contrastRatio(first, BG.light)).toBeGreaterThanOrEqual(MIN_CHART_CONTRAST)
  })
})

describe('buildCustomTheme', () => {
  it.each(['dark', 'light'] as const)('keeps the %s base surfaces, overlays the accent', base => {
    const baseTheme = THEMES[base === 'dark' ? 'Default Dark' : 'Default Light']
    const theme = buildCustomTheme('#e11d48', base)
    expect(theme.name).toBe(CUSTOM_THEME)
    expect(theme.isDark).toBe(base === 'dark')
    expect(theme.token.colorPrimary).toBe('#e11d48')
    expect(theme.token.colorBgBase).toBe(baseTheme.token.colorBgBase)
    expect(theme.contentBg).toBe(baseTheme.contentBg)
    expect(theme.tiers).toBe(baseTheme.tiers)
    expect(theme.star).toBe(baseTheme.star)
    expect(theme.chartColors).toEqual(customChartColors('#e11d48', base))
  })

  it.each([['#ffffff', 'light'], ['#fef08a', 'light'], ['#000000', 'dark']] as const)(
    'an unreadable accent (%s on %s) gets the corrected primary, = chart color 0', (accent, base) => {
      const theme = buildCustomTheme(accent, base)
      expect(theme.token.colorPrimary).not.toBe(accent)
      expect(theme.token.colorPrimary).toBe(theme.chartColors[0])
      expect(contrastRatio(theme.token.colorPrimary, BG[base])).toBeGreaterThanOrEqual(MIN_CHART_CONTRAST)
    },
  )

  it('does not mutate the base theme', () => {
    const before = THEMES['Default Dark'].token.colorPrimary
    buildCustomTheme('#e11d48', 'dark')
    expect(THEMES['Default Dark'].token.colorPrimary).toBe(before)
  })
})
