import { describe, it, expect } from 'vitest'
import { resolveBase } from './paths'

describe('resolveBase', () => {
  it.each([
    ['/', 'https://x.dev/shows/12', '/'],
    ['/tv-dash/', 'https://x.dev/tv-dash/stats', '/tv-dash/'],
  ])('absolute base %s passes through', (base, page, expected) => {
    expect(resolveBase(base, page)).toBe(expected)
  })

  it.each([
    ['./', 'https://x.dev/apps/tv/', '/apps/tv/'],
    ['./', 'https://x.dev/apps/tv/index.html', '/apps/tv/'],
    ['', 'https://x.dev/apps/tv/', '/apps/tv/'],
    ['../', 'https://x.dev/apps/tv/', '/apps/'],
  ])('relative base %j at %s → %s', (base, page, expected) => {
    expect(resolveBase(base, page)).toBe(expected)
  })
})
