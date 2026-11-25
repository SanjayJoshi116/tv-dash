import { describe, it, expect } from 'vitest'
import { normalizePath, pageTitleFor, type PageTitleInput } from './pageTitle'
import type { TvSeries } from '../types/series'

// Only tvId / name matter for the title lookup
const show = (tvId: number, name: string) => ({ tvId, name }) as TvSeries
const DATA = [show(1, 'Severance'), show(2, 'Andor')]
// Mirrors AppLayout's NAV_ITEMS — every fixed-title route
const NAV = [
  { key: '/', label: 'Dashboard' },
  { key: '/shows', label: 'Shows' },
  { key: '/stats', label: 'Statistics' },
]

const title = (input: Partial<PageTitleInput>) =>
  pageTitleFor({ path: '/', showId: null, data: DATA, loading: false, navItems: NAV, ...input })

describe('pageTitleFor', () => {
  it('nav routes use their label', () => {
    expect(title({ path: '/' })).toBe('Dashboard')
    expect(title({ path: '/shows' })).toBe('Shows')
    expect(title({ path: '/stats' })).toBe('Statistics')
  })

  it('normalized trailing-slash / mixed-case path gets the same title', () => {
    // react-router matches both, so AppLayout normalizes before the lookup
    expect(title({ path: normalizePath('/shows/') })).toBe('Shows')
    expect(title({ path: normalizePath('/Stats') })).toBe('Statistics')
    expect(title({ path: normalizePath('/SHOWS//') })).toBe('Shows')
  })

  it('a show with a blank name → Untitled show', () => {
    expect(title({ showId: '3', data: [...DATA, show(3, '')] })).toBe('Untitled show')
  })

  it('unknown path → Page not found', () => {
    expect(title({ path: '/does-not-exist' })).toBe('Page not found')
    expect(title({ path: '/shows/1/extra' })).toBe('Page not found')
  })

  it('known show → its name', () => {
    expect(title({ path: '/shows/2', showId: '2' })).toBe('Andor')
  })

  it('unknown show ID → Show not found', () => {
    expect(title({ path: '/shows/999999', showId: '999999' })).toBe('Show not found')
    expect(title({ path: '/shows/abc', showId: 'abc' })).toBe('Show not found')
  })

  it('loading → Show Detail, even for an ID that will match', () => {
    expect(title({ path: '/shows/1', showId: '1', data: [], loading: true })).toBe('Show Detail')
  })

  it('error state (loaded, no data) → Show not found', () => {
    expect(title({ path: '/shows/1', showId: '1', data: [], loading: false })).toBe('Show not found')
  })

  it('nav routes are unaffected by loading', () => {
    expect(title({ path: '/stats', data: [], loading: true })).toBe('Statistics')
  })
})

describe('normalizePath', () => {
  it('strips trailing slashes and lowercases; root stays /', () => {
    expect(normalizePath('/')).toBe('/')
    expect(normalizePath('//')).toBe('/')
    expect(normalizePath('/shows/')).toBe('/shows')
    expect(normalizePath('/Stats')).toBe('/stats')
  })
})
