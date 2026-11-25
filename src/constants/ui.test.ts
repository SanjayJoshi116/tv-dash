import { describe, it, expect } from 'vitest'
import { STATUSES, completionColor, genreTagColor, ratingColor, ratingTierColors, sortStatuses, statusHex, statusTagColor, tier } from './ui'
import { THEMES, THEME_NAMES } from '../themes'

describe('tier / ratingTierColors / ratingColor / completionColor', () => {
  it('tier maps thresholds to success / warning / danger', () => {
    expect([tier(8, 8, 6), tier(7.99, 8, 6), tier(6, 8, 6), tier(5.9, 8, 6)]).toEqual(['success', 'warning', 'warning', 'danger'])
    expect([tier(75, 75, 40), tier(74, 75, 40), tier(40, 75, 40), tier(39, 75, 40)]).toEqual(['success', 'warning', 'warning', 'danger'])
  })

  it.each(THEME_NAMES)('reads colors from the given theme (%s)', name => {
    const t = THEMES[name].tiers
    const theme = THEMES[name]
    expect([ratingColor(8, theme), ratingColor(6, theme), ratingColor(5.9, theme)]).toEqual([t.success.fill, t.warning.fill, t.danger.fill])
    expect([ratingTierColors(8, theme), ratingTierColors(6, theme), ratingTierColors(5.9, theme)]).toEqual([t.success, t.warning, t.danger])
    expect([completionColor(75, theme), completionColor(40, theme), completionColor(39, theme)]).toEqual([t.success.fill, t.warning.fill, t.danger.fill])
  })

  it('same tier, different theme → different color', () => {
    expect(ratingColor(8.4, THEMES['Default Light'])).not.toBe(ratingColor(8.4, THEMES['Dracula']))
  })

  it('unknown (null) rating → undefined', () => {
    expect(ratingColor(null, THEMES['Default Dark'])).toBeUndefined()
    expect(ratingTierColors(null, THEMES['Default Dark'])).toBeUndefined()
  })
})

describe('status colors', () => {
  it('exposes literal-key hex + tag per status', () => {
    expect(STATUSES['Returning Series']).toEqual({ hex: '#52c41a', tag: 'green' })
  })
  it('returns known colors, with Canceled matching its red tag preset', () => {
    expect(statusHex('Canceled', '#000')).toBe('#f5222d')
    expect(statusTagColor('Canceled')).toBe('red')
  })

  it('falls back for unknown statuses', () => {
    expect(statusHex('Hiatus', '#123456')).toBe('#123456')
    expect(statusTagColor('Hiatus')).toBe('default')
  })

  it('ignores inherited Object.prototype keys', () => {
    expect(statusHex('constructor', '#123456')).toBe('#123456')
    expect(statusTagColor('toString')).toBe('default')
    expect(genreTagColor('constructor')).toBe('default')
  })
})

describe('sortStatuses', () => {
  it('orders known statuses first, unknown ones alphabetically, deduped', () => {
    expect(sortStatuses(['Zeta', 'Ended', 'Hiatus', 'Returning Series', 'Ended'])).toEqual(['Returning Series', 'Ended', 'Hiatus', 'Zeta'])
  })
})
