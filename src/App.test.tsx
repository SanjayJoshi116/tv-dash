// @vitest-environment jsdom
// Root smoke test: the real <App /> (providers, router, lazy pages) in jsdom — every route mounts
// its page, and saved theme state is handled at the root. Layout / charts are e2e's job.
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { cleanup, configure, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'
import { SYSTEM_THEME } from './themes'
import { SETTINGS_KEY } from './utils/settings'
import { VALID_ROW, csv, withId } from './utils/parseSeriesCsv.fixture'
import { stubMatchMedia } from './hooks/matchMedia.fixture'

// Transform the lazy page chunks up front (cold, under a parallel full-suite run, that took
// > 5s inside the first test's findBy). Then findBy only waits for React, not the module graph.
beforeAll(async () => {
  await Promise.all([
    import('./pages/DashboardPage'),
    import('./pages/ShowsPage'),
    import('./pages/ShowDetailPage'),
    import('./pages/StatisticsPage'),
  ])
}, 60_000)
configure({ asyncUtilTimeout: 5000 })

const SECOND = withId('2', VALID_ROW.replace('Breaking Bad', 'Better Call Saul'))
const CSV = csv(VALID_ROW, SECOND)

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() =>
    Promise.resolve({ ok: true, status: 200, statusText: 'OK', text: () => Promise.resolve(CSV) }),
  ))
  // jsdom has neither matchMedia nor ResizeObserver (the fake covers antd's legacy addListener)
  stubMatchMedia(false)
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  // jsdom has no Element#scrollTo (AppLayout resets Content's scroll on navigation)
  Element.prototype.scrollTo = () => {}
})

afterEach(() => {
  delete (Element.prototype as Partial<Element>).scrollTo
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// App owns its data router (created on mount from window.location) — drive it through the History API
function renderAt(path: string) {
  window.history.pushState({}, '', path)
  return render(<App />)
}

// Header title (AppLayout's <Title level={4}>); the sidebar logo is also an h4, hence `name`
const header = (name: string) => screen.findByRole('heading', { level: 4, name })

describe('routes mount their page', () => {
  it('/ → Dashboard', async () => {
    renderAt('/')
    await header('Dashboard')
    expect((await screen.findAllByText('Breaking Bad')).length).toBeGreaterThan(0)
  })

  it.each(['/shows', '/shows/'])('%s → Shows with both cards', async path => {
    renderAt(path)
    await header('Shows')
    expect(await screen.findByRole('button', { name: /Breaking Bad/ })).toBeTruthy()
    expect(await screen.findByRole('button', { name: /Better Call Saul/ })).toBeTruthy()
  })

  it('/shows?q=saul → Shows filtered by the URL', async () => {
    renderAt('/shows?q=saul')
    await header('Shows')
    expect(await screen.findByRole('button', { name: /Better Call Saul/ })).toBeTruthy()
    await waitFor(() => expect(screen.queryByRole('button', { name: /Breaking Bad/ })).toBeNull())
    expect((screen.getByRole('searchbox', { name: 'Search shows' }) as HTMLInputElement).value).toBe('saul')
  })

  it('/shows/2 → that show', async () => {
    renderAt('/shows/2')
    expect(await screen.findByRole('heading', { level: 3, name: 'Better Call Saul' })).toBeTruthy()
    await header('Better Call Saul')
  })

  it('/shows/999999 → Show not found', async () => {
    renderAt('/shows/999999')
    await header('Show not found')
  })

  it('/stats → Statistics with the chart tabs', async () => {
    // Recharts can't measure in jsdom (width/height 0) — expected here only
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    renderAt('/stats')
    await header('Statistics')
    expect(await screen.findByRole('tab', { name: 'Overview' })).toBeTruthy()
  })

  it('unknown URL → Page not found', async () => {
    renderAt('/does-not-exist')
    await header('Page not found')
  })
})

describe('saved theme at the root', () => {
  // antd Select shows the chosen label as the selection item's title
  const selectedTheme = (title: string) => screen.findByTitle(title)

  it('valid saved theme is applied', async () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ themeName: 'Dracula' }))
    renderAt('/')
    expect(await selectedTheme('Dracula')).toBeTruthy()
  })

  it.each([
    ['unknown name', JSON.stringify({ themeName: 'Solarized' })],
    ['non-string', JSON.stringify({ themeName: 42 })],
    ['non-JSON', '{not json'],
  ])('%s → default preference', async (_, raw) => {
    localStorage.setItem(SETTINGS_KEY, raw)
    renderAt('/')
    expect(await selectedTheme(SYSTEM_THEME)).toBeTruthy()
  })

  it('?theme= overrides the saved theme for the visit and is not saved', async () => {
    const saved = JSON.stringify({ themeName: 'Default Light' })
    localStorage.setItem(SETTINGS_KEY, saved)
    renderAt('/stats?theme=dracula')
    expect(await selectedTheme('Dracula')).toBeTruthy()
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(localStorage.getItem(SETTINGS_KEY)).toBe(saved)
  })

  it('an unknown ?theme= is ignored', async () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ themeName: 'Nord' }))
    renderAt('/?theme=Nope')
    expect(await selectedTheme('Nord')).toBeTruthy()
  })

  it('choosing a theme updates the select, the document and tvdash-settings', async () => {
    renderAt('/')
    await selectedTheme(SYSTEM_THEME)
    // matchMedia stub → not dark, so System resolves to Default Light
    expect(document.documentElement.style.colorScheme).toBe('light')

    // antd opens the dropdown on mousedown of the selector box, not the inner input
    const selector = document.querySelector('#theme-select')?.closest('.ant-select')?.querySelector('.ant-select-selector')
    if (!selector) throw new Error('#theme-select not rendered')
    fireEvent.mouseDown(selector)
    const option = await waitFor(() => {
      const el = document.querySelector('.ant-select-item-option[title="Dracula"]')
      if (!el) throw new Error('Dracula option not rendered')
      return el
    })
    fireEvent.click(option)

    // The still-open dropdown's option also has title="Dracula" — check the selection item
    await waitFor(() => expect(document.querySelector('.ant-select-selection-item')?.getAttribute('title')).toBe('Dracula'))
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}').themeName).toBe('Dracula')
  }, 15_000)
})
