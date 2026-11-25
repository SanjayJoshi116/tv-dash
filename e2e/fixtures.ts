import { test as base, expect, type Locator, type Page } from '@playwright/test'
// Synthetic CSV for the e2e suite — `csv()` adds the header shared with the unit tests
// (series-search.py FIELDNAMES order), so the column contract lives in one TS place
import { csv } from '../src/utils/parseSeriesCsv.fixture'
import { SETTINGS_KEY } from '../src/utils/settings'

// 1×1 PNG — a poster that always loads (quoted in the CSV: the data URI contains a comma)
export const GOOD_POSTER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
// Served by the `page` fixture as a non-image body → the <img> fails to decode → onError.
// Deterministic (no 404 / network error in the console, same under any server).
export const BROKEN_POSTER = '/e2e-broken-poster.png'

interface Row {
  id: number | string
  name: string
  lang?: string
  seasons?: string
  runtime?: string
  year?: string
  rating?: string
  poster?: string
  age?: string
  seasonsWatched?: string
  episodesWatched?: string
  totalEpisodes?: string
  runtimeWatched?: string
  firstAirDate?: string
}

function row(r: Row): string {
  const d = {
    lang: 'en', seasons: '3', runtime: '45', year: '2015', rating: '7.5', poster: GOOD_POSTER, age: 'TV-14',
    seasonsWatched: '1', episodesWatched: '10', totalEpisodes: '30', runtimeWatched: '450', firstAirDate: '2015-03-01',
    ...r,
  }
  return [
    d.id, d.name, d.lang, d.seasons, d.runtime, d.year, '"Drama"', 'Someone', 'Net', 'Ended', d.totalEpisodes,
    '2016-01-01', '12.5', '100', d.rating, '"A, B"', 'kw', d.firstAirDate, 'An overview', '', `"${d.poster}"`, d.age,
    `"${d.seasonsWatched}"`, d.episodesWatched, d.runtimeWatched,
  ].join(',')
}

// 5 valid shows covering every "unknown value" path, plus 3 rows the parser must skip
export const TEST_CSV = csv(
  row({ id: 1, name: 'Alpha', rating: '8.5', poster: BROKEN_POSTER }),
  row({
    id: 2, name: 'Unknowny', lang: 'N/A', seasons: '', runtime: '-5', year: '', rating: '0', poster: '', age: 'N/A',
    seasonsWatched: '', episodesWatched: '0', runtimeWatched: '0', firstAirDate: '',
  }),
  row({ id: 3, name: 'Fraction', seasons: '2.5', runtime: '0', year: '2020', rating: '7.0', episodesWatched: '5', totalEpisodes: '10' }),
  row({ id: 4, name: 'Huge', seasons: '1e7', year: '2022', rating: '9.1', poster: BROKEN_POSTER, seasonsWatched: '', episodesWatched: '0', runtimeWatched: '0' }),
  row({ id: 5, name: 'Newbie', year: '2024', rating: '6.0', runtime: '30', runtimeWatched: '3000', episodesWatched: '20', totalEpisodes: '40' }),
  '6,Too,Few,Fields', // wrong field count
  row({ id: 1, name: 'Alpha Duplicate' }), // duplicate TV ID
  row({ id: 'abc', name: 'Bad Id' }), // invalid TV ID
)

// Every test fails on a console error / uncaught exception. `csv` is the CSV served for
// tv_series.csv — TEST_CSV by default; `test.use({ csv: null })` lets the real file through.
// `allowConsoleErrors`: one pattern for errors a test provokes on purpose (default none), e.g.
// `test.use({ allowConsoleErrors: /boom/ })` in a spec that forces a crash. A RegExp, not an
// array — Playwright reads an array option value as a `[value, options]` tuple.
// Fixture routes: `body` for tv_series.csv (null = real file) + the broken poster
async function serveFixtures(page: Page, body: string | null) {
  if (body != null) await page.route('**/tv_series.csv', r => r.fulfill({ status: 200, contentType: 'text/csv', body }))
  await page.route(`**${BROKEN_POSTER}`, r => r.fulfill({ status: 200, contentType: 'image/png', body: 'not a png' }))
}

// `newTab()`: another page in the same browser context (shares localStorage, gets `storage`
// events) with the same fixture routes and console-error check as `page`.
export const test = base.extend<{
  csv: string | null
  allowConsoleErrors: RegExp | null
  watchConsole: (page: Page) => void
  newTab: () => Promise<Page>
}>({
  csv: [TEST_CSV, { option: true }],
  allowConsoleErrors: [null, { option: true }],
  watchConsole: [
    async ({ allowConsoleErrors }, use) => {
      const errors: string[] = []
      const record = (text: string) => { if (!allowConsoleErrors?.test(text)) errors.push(text) }
      await use(page => {
        page.on('console', m => { if (m.type() === 'error') record(m.text()) })
        page.on('pageerror', e => record(String(e)))
      })
      expect(errors, 'console errors').toEqual([])
    },
    { auto: true },
  ],
  page: async ({ page, csv, watchConsole }, use) => {
    watchConsole(page)
    await serveFixtures(page, csv)
    await use(page)
  },
  newTab: async ({ context, csv, watchConsole }, use) => {
    await use(async () => {
      const tab = await context.newPage()
      watchConsole(tab)
      await serveFixtures(tab, csv)
      return tab
    })
  },
})
export { expect }

export const content = (page: Page): Locator => page.locator('.ant-layout-content')
export const scrollContent = (page: Page, y: number) => content(page).evaluate((el, top) => el.scrollTo(0, top), y)
// Mobile BottomNav (below lg)
export const bottomNav = (page: Page): Locator => page.locator('nav').filter({ has: page.getByRole('button', { name: 'Dashboard' }) })
export const themeSelect = (page: Page): Locator => page.locator('.ant-select', { has: page.locator('#theme-select') })
export const selectedTheme = (page: Page): Locator => themeSelect(page).locator('.ant-select-selection-item')

// Picks a theme in the header selector (exact option text) and waits until it's selected
export async function pickTheme(page: Page, name: string): Promise<void> {
  await themeSelect(page).click()
  await page.locator('.ant-select-item-option').filter({ hasText: new RegExp(`^${name}$`) }).click()
  await expect(selectedTheme(page)).toHaveText(name)
}

// Saved theme before every page load (incl. reloads) — use only where it must stay fixed
export async function saveTheme(page: Page, themeName: string): Promise<void> {
  await page.addInitScript(([key, name]) => localStorage.setItem(key, JSON.stringify({ themeName: name })), [SETTINGS_KEY, themeName] as const)
}

// #rrggbb → the computed-style `rgb(r, g, b)` string
export function rgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}

// <html> color-scheme + background as AppThemeProvider / the boot script set them (`bg` = rgb())
export async function expectDocTheme(page: Page, scheme: 'dark' | 'light', bg: string): Promise<void> {
  const html = page.locator('html')
  await expect(html).toHaveCSS('color-scheme', scheme)
  await expect(html).toHaveCSS('background-color', bg)
}

// Window flag that a reload would clear — proves a change was applied live
type NoReloadWindow = { __noReload?: boolean }
export async function markNoReload(page: Page): Promise<void> {
  await page.evaluate(() => { (window as NoReloadWindow).__noReload = true })
}
export const stillNoReload = (page: Page): Promise<boolean | undefined> =>
  page.evaluate(() => (window as NoReloadWindow).__noReload)

// Holds matching requests until the returned `release()` is called. Register it after the
// fixture's routes: it runs first, then `fallback()` hands the request on (fixture or network).
export async function holdRoute(page: Page, url: string): Promise<() => void> {
  let release!: () => void
  const gate = new Promise<void>(r => { release = r })
  await page.route(url, async route => {
    await gate
    await route.fallback()
  })
  return release
}
export const fallbackIcon = (scope: Locator): Locator => scope.locator('.anticon-video-camera')

// Client-side navigation (react-router listens to popstate) — the page component is NOT remounted
export async function spaNavigate(page: Page, to: string): Promise<void> {
  await page.evaluate(p => {
    history.pushState({}, '', p)
    dispatchEvent(new PopStateEvent('popstate'))
  }, to)
}

export function descriptionValue(page: Page, label: string): Locator {
  return page
    .locator('.ant-descriptions-item', { has: page.locator('.ant-descriptions-item-label', { hasText: new RegExp(`^${label}$`) }) })
    .locator('.ant-descriptions-item-content')
}

export function statistic(page: Page, title: string): Locator {
  return page.locator('.ant-statistic', { has: page.locator('.ant-statistic-title', { hasText: title }) })
}
