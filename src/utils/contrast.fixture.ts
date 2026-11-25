// WCAG 2.x contrast ratio for tests — the theme contract (themes.test.ts, hex) and the e2e badge
// check (computed `rgb()` strings) share one formula. Accepts #rgb / #rrggbb / rgb() / rgba().

function channels(color: string): number[] {
  if (color.startsWith('#')) {
    let h = color.slice(1)
    if (h.length === 3) h = [...h].map(c => c + c).join('')
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16))
  }
  return (color.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number)
}

function luminance(color: string): number {
  const [r, g, b] = channels(color).map(v => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
