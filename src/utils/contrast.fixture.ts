// WCAG 2.x contrast ratio for tests — the theme contract (themes.test.ts, hex) and the e2e badge
// check (computed `rgb()` strings) share one formula: utils/color.ts. Accepts #rgb / #rrggbb /
// rgb() / rgba().
import { contrastRgb, parseHex, type Rgb } from './color'

function channels(color: string): Rgb {
  const hex = color.startsWith('#') ? parseHex(color) : null
  if (hex) return hex
  return (color.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number) as unknown as Rgb
}

export function contrast(a: string, b: string): number {
  return contrastRgb(channels(a), channels(b))
}
