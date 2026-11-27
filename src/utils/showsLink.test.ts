import { describe, it, expect } from 'vitest'
import type { Path } from 'react-router-dom'
import { showsLink } from './showsLink'
import { DEFAULT_FILTERS, filtersFromParams } from './showFilters'

const parts = (to: ReturnType<typeof showsLink>) => to as Partial<Path>
const back = (to: ReturnType<typeof showsLink>) => filtersFromParams(new URLSearchParams(parts(to).search))

const HOSTILE = ['Sci-Fi & Fantasy', 'a&genre=b', 'x#frag', 'why?', 'a/b/../c', '100%', '//evil.example', 'javascript:alert(1)', 'Amélie — 東京 🎬', ' spaced ']

describe('showsLink', () => {
  it('always targets the literal /shows path, with no hash', () => {
    for (const v of HOSTILE) {
      for (const to of [showsLink({ genre: v }), showsLink({ status: v }), showsLink({ q: v })]) {
        expect(parts(to).pathname).toBe('/shows')
        expect(parts(to).hash).toBeUndefined()
        expect(parts(to).search?.startsWith('?')).toBe(true)
      }
    }
  })

  it('round-trips every value as the same literal text through the Shows codec', () => {
    for (const v of HOSTILE) {
      expect(back(showsLink({ genre: v }))?.genres).toEqual([v])
      expect(back(showsLink({ status: v }))?.status).toBe(v)
      expect(back(showsLink({ q: v }))?.search).toBe(v)
    }
  })

  it('sets only the given field (URL precedence clears everything else)', () => {
    expect(parts(showsLink({ genre: 'Crime' })).search).toBe('?genre=Crime')
    expect(parts(showsLink({ status: 'Ended' })).search).toBe('?status=Ended')
    expect(parts(showsLink({ q: 'Bryan Cranston' })).search).toBe('?q=Bryan+Cranston')
    expect(parts(showsLink({ progress: 'notStarted' })).search).toBe('?progress=notStarted')
    expect(back(showsLink({ progress: 'inProgress' }))).toEqual({ ...DEFAULT_FILTERS, progress: 'inProgress' })
    expect(back(showsLink({ genre: 'Crime' }))).toEqual({ ...DEFAULT_FILTERS, genres: ['Crime'] })
  })
})
