import { CUSTOM_BASES, CUSTOM_THEME, THEMES, type CustomBase, type Theme } from './themes'
import { contrastRgb, hslToHex, parseHex, rgbToHsl, type Hsl, type Rgb } from './utils/color'

// The Custom theme: a built-in base (Default Dark / Default Light — surfaces, text, tiers, star,
// all contract-tested) + the user's accent as antd's colorPrimary and a 10-color chart palette
// derived from it. Separate from themes.ts, which must stay import-free (boot script).

export const MIN_CHART_CONTRAST = 3
const HUE_STEP = 36 // 10 colors around the wheel
const MIN_SAT = 0.45 // grey accents still give 10 distinct hues
const MAX_SAT = 0.85 // keeps hue-rotated palettes from going garish
const L_STEP = 0.02
const L_MIN = 0.05
const L_MAX = 0.95
// Derived hues start inside this lightness band: at L 0 / 1 every hue is the same black / white
const START_L_MIN = 0.3
const START_L_MAX = 0.7

// Moves lightness away from the background (lighter on dark, darker on light) in 2% steps until
// the color reaches MIN_CHART_CONTRAST vs `bg`; stops at L_MIN / L_MAX, which pass on both bases.
function readable([h, s, l]: Hsl, bgRgb: Rgb, isDark: boolean): string {
  let light = l
  for (;;) {
    // Checked on the rounded hex — a float that just reaches 3:1 can round below it
    const hex = hslToHex([h, s, light])
    const atLimit = isDark ? light >= L_MAX : light <= L_MIN
    if (contrastRgb(parseHex(hex)!, bgRgb) >= MIN_CHART_CONTRAST || atLimit) return hex
    light = isDark ? Math.min(L_MAX, light + L_STEP) : Math.max(L_MIN, light - L_STEP)
  }
}

// 10 chart colors from the accent: hue + i·36°. Color 0 is the accent itself when it's already
// readable on the base (else its lightness-corrected version); the rest use a saturation clamped
// to [MIN_SAT, MAX_SAT] and start from the accent's lightness clamped to the mid band.
// `accent` must be a valid hex (parseCustomTheme guarantees it).
export function customChartColors(accent: string, base: CustomBase): string[] {
  const { contentBg, isDark } = THEMES[CUSTOM_BASES[base]]
  const accentRgb = parseHex(accent)!
  const bgRgb = parseHex(contentBg)!
  const [h, s, l] = rgbToHsl(accentRgb)
  const sat = Math.min(MAX_SAT, Math.max(MIN_SAT, s))
  const startL = Math.min(START_L_MAX, Math.max(START_L_MIN, l))
  return Array.from({ length: 10 }, (_, i) => {
    if (i === 0) {
      return contrastRgb(accentRgb, bgRgb) >= MIN_CHART_CONTRAST ? accent.toLowerCase() : readable([h, s, l], bgRgb, isDark)
    }
    return readable([h + i * HUE_STEP, sat, startL], bgRgb, isDark)
  })
}

// colorPrimary = chart color 0: the accent itself when it's readable on the base (≥ 3:1),
// otherwise the nearest readable lightness of the same hue — a white accent on the Light base
// would make progress bars, highlights and the nav progress bar invisible. Button text contrast
// is antdThemeConfig's job.
export function buildCustomTheme(accent: string, base: CustomBase): Theme {
  const baseTheme = THEMES[CUSTOM_BASES[base]]
  const chartColors = customChartColors(accent, base)
  return {
    ...baseTheme,
    name: CUSTOM_THEME,
    token: { ...baseTheme.token, colorPrimary: chartColors[0] },
    chartColors,
  }
}
