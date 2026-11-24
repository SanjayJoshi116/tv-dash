import { describe, it, expect } from 'vitest'
import { completionColor, genreTagColor, ratingColor, sortStatuses, statusHex, statusTagColor } from './ui'

describe('ratingColor / completionColor', () => {
  it('maps thresholds to green / amber / red', () => {
    expect([ratingColor(8), ratingColor(6), ratingColor(5.9)]).toEqual(['#52c41a', '#faad14', '#f5222d'])
    expect([completionColor(75), completionColor(40), completionColor(39)]).toEqual(['#52c41a', '#faad14', '#f5222d'])
  })
})

describe('status colors', () => {
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
