import { describe, it, expect } from 'vitest'
import { NAV_PAGES, PAGES } from './pages'
import { PAGE_LOADERS } from './pageLoaders'

describe('PAGES', () => {
  it('has unique page keys and paths', () => {
    const keys = PAGES.map(p => p.page)
    const paths = PAGES.map(p => p.path)
    expect(new Set(keys).size).toBe(keys.length)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('has absolute paths', () => {
    for (const p of PAGES) expect(p.path.startsWith('/')).toBe(true)
  })

  it('lists nav pages in sidebar order', () => {
    expect(NAV_PAGES.map(p => p.path)).toEqual(['/', '/shows', '/stats'])
  })

  it('keeps Show Detail out of the nav', () => {
    const detail = PAGES.find(p => p.path === '/shows/:id')
    expect(detail).toBeDefined()
    expect(detail && 'nav' in detail).toBe(false)
  })

  it('derives PAGE_LOADERS from exactly the table keys', () => {
    expect(Object.keys(PAGE_LOADERS).sort()).toEqual(PAGES.map(p => p.page).sort())
  })
})
