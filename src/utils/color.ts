// Pure color math (no deps): hex ↔ RGB ↔ HSL and WCAG 2.x contrast. Used by the Custom theme's
// palette builder (customTheme.ts) and, via contrast.fixture.ts, by the theme contract tests.

export type Rgb = readonly [r: number, g: number, b: number] // 0–255
export type Hsl = readonly [h: number, s: number, l: number] // h 0–360, s / l 0–1

// '#rgb' / '#rrggbb' (case-insensitive) → RGB; anything else → null
export function parseHex(hex: string): Rgb | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex)
  if (!m) return null
  const h = m[1].length === 3 ? [...m[1]].map(c => c + c).join('') : m[1]
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)) as unknown as Rgb
}

export function rgbToHex([r, g, b]: Rgb): string {
  return '#' + [r, g, b].map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')
}

export function rgbToHsl([r, g, b]: Rgb): Hsl {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255]
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return [0, 0, l]
  const s = d / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === rn) h = ((gn - bn) / d) % 6
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  return [(h * 60 + 360) % 360, s, l]
}

export function hslToRgb([h, s, l]: Hsl): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  const [r1, g1, b1] =
    hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x]
  const m = l - c / 2
  return [(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255]
}

// Hex helpers on top of the RGB ones; invalid hex → null
export function hexToHsl(hex: string): Hsl | null {
  const rgb = parseHex(hex)
  return rgb && rgbToHsl(rgb)
}
export const hslToHex = (hsl: Hsl): string => rgbToHex(hslToRgb(hsl))

// WCAG 2.x relative luminance (0 = black, 1 = white)
export function relativeLuminance([r, g, b]: Rgb): number {
  const [lr, lg, lb] = [r, g, b].map(v => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
}

export function contrastRgb(a: Rgb, b: Rgb): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// Contrast of two hex colors; throws on invalid input (callers pass validated / theme colors)
export function contrastRatio(a: string, b: string): number {
  const ra = parseHex(a)
  const rb = parseHex(b)
  if (!ra || !rb) throw new Error(`contrastRatio: not a hex color: ${ra ? b : a}`)
  return contrastRgb(ra, rb)
}

export const AA_TEXT_CONTRAST = 4.5

// Text color for a solid background: white when it reaches AA (4.5:1), else black — one of the
// two always does (they cross at ≈ 4.58:1). Non-hex input → white (antd's own default).
export function readableTextOn(bg: string): '#ffffff' | '#000000' {
  const rgb = parseHex(bg)
  if (!rgb) return '#ffffff'
  return contrastRgb([255, 255, 255], rgb) >= AA_TEXT_CONTRAST ? '#ffffff' : '#000000'
}
