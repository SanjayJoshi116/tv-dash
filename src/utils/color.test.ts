import { describe, it, expect } from 'vitest'
import { contrastRatio, hexToHsl, hslToHex, parseHex, readableTextOn, rgbToHex, rgbToHsl, relativeLuminance } from './color'
import { contrast } from './contrast.fixture'

describe('parseHex / rgbToHex', () => {
  it('parses #rrggbb and #rgb, case-insensitive', () => {
    expect(parseHex('#e11d48')).toEqual([225, 29, 72])
    expect(parseHex('#FFF')).toEqual([255, 255, 255])
  })

  it.each(['', 'e11d48', '#e11d4', '#e11d488', '#gggggg', 'red', 'constructor'])('rejects %j', s => {
    expect(parseHex(s)).toBeNull()
  })

  it('formats lowercase, clamped, rounded', () => {
    expect(rgbToHex([255, 0, 127.6])).toBe('#ff0080')
    expect(rgbToHex([300, -5, 0])).toBe('#ff0000')
  })
})

describe('HSL round trips', () => {
  it.each(['#000000', '#ffffff', '#808080', '#e11d48', '#6366f1', '#fef08a', '#10b981', '#bd93f9'])('%s', hex => {
    expect(hslToHex(hexToHsl(hex)!)).toBe(hex)
  })

  it('known values', () => {
    expect(rgbToHsl([255, 0, 0])).toEqual([0, 1, 0.5])
    const [h, s, l] = hexToHsl('#808080')!
    expect([h, s]).toEqual([0, 0])
    expect(l).toBeCloseTo(0.502, 3)
    expect(hexToHsl('nope')).toBeNull()
  })

  it('wraps hue', () => {
    expect(hslToHex([360 + 120, 1, 0.5])).toBe('#00ff00')
    expect(hslToHex([-120, 1, 0.5])).toBe('#0000ff')
  })
})

describe('WCAG contrast', () => {
  it('black / white = 21:1, same color = 1:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#ffffff', '#000')).toBeCloseTo(21, 5)
    expect(contrastRatio('#6366f1', '#6366f1')).toBe(1)
  })

  it('#777 on white ≈ 4.48', () => {
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2)
  })

  it('luminance endpoints', () => {
    expect(relativeLuminance([0, 0, 0])).toBe(0)
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 10)
  })

  it('throws on non-hex input', () => {
    expect(() => contrastRatio('red', '#fff')).toThrow(/not a hex color: red/)
  })

  it('the test fixture agrees for hex and rgb() strings', () => {
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(contrastRatio('#777777', '#ffffff'), 10)
    expect(contrast('rgb(119, 119, 119)', 'rgba(255, 255, 255, 1)')).toBeCloseTo(4.48, 2)
  })
})

describe('readableTextOn', () => {
  it('keeps white when it reaches 4.5:1, else black', () => {
    expect(readableTextOn('#4f46e5')).toBe('#ffffff')
    expect(readableTextOn('#575ad0')).toBe('#ffffff')
    expect(readableTextOn('#ffd60a')).toBe('#000000')
    expect(readableTextOn('#a480d7')).toBe('#000000')
  })

  it('the chosen color always reaches 4.5:1 (every grey level)', () => {
    for (let v = 0; v <= 255; v++) {
      const bg = rgbToHex([v, v, v])
      expect(contrastRatio(readableTextOn(bg), bg), bg).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('non-hex input → white', () => {
    expect(readableTextOn('rgb(0,0,0)')).toBe('#ffffff')
  })
})
