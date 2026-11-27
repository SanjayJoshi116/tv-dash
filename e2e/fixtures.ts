import { test as base, expect, type Locator, type Page } from '@playwright/test'
// Synthetic CSV for the e2e suite — `csv()` adds the header shared with the unit tests
// (series-search.py FIELDNAMES order), so the column contract lives in one TS place
import { csv } from '../src/utils/parseSeriesCsv.fixture'
import { SETTINGS_KEY } from '../src/utils/settings'
import { CSV_FILE } from '../src/constants/csvFile'
import { THEMES, type ThemeName } from '../src/themes'

// 1×1 PNG — a poster that always loads (quoted in the CSV: the data URI contains a comma)
export const GOOD_POSTER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
// Served by the `page` fixture as a non-image body → the <img> fails to decode → onError.
// Deterministic (no 404 / network error in the console, same under any server).
export const BROKEN_POSTER = '/e2e-broken-poster.png'

export interface Row {
  id: number | string
  name: string
  status?: string
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
  // Comma-separated, written as one quoted CSV field
  genres?: string
  keywords?: string
}

// One CSV data row (TEST_CSV, or a spec's own `csv` option) — only the fields a test is about
export function row(r: Row): string {
  const d = {
    lang: 'en', seasons: '3', runtime: '45', year: '2015', rating: '7.5', poster: GOOD_POSTER, age: 'TV-14',
    seasonsWatched: '1', episodesWatched: '10', totalEpisodes: '30', runtimeWatched: '450', firstAirDate: '2015-03-01',
    genres: 'Drama', keywords: 'kw', status: 'Ended',
    ...r,
  }
  return [
    d.id, d.name, d.lang, d.seasons, d.runtime, d.year, `"${d.genres}"`, 'Someone', 'Net', d.status, d.totalEpisodes,
    '2016-01-01', '12.5', '100', d.rating, '"A, B"', `"${d.keywords}"`, d.firstAirDate, 'An overview', '', `"${d.poster}"`, d.age,
    `"${d.seasonsWatched}"`, d.episodesWatched, d.runtimeWatched,
  ].join(',')
}

// 6 valid shows covering every "unknown value" path and each progress state (not started:
// Unknowny, Huge; in progress: Alpha, Fraction, Newbie; completed: Finished), plus 3 rows the parser must skip
export const TEST_CSV = csv(
  // Alpha: an '&' genre and a hostile keyword for the cross-navigation link tests
  row({ id: 1, name: 'Alpha', rating: '8.5', poster: BROKEN_POSTER, genres: 'Drama,Sci-Fi & Fantasy', keywords: 'kw,javascript:alert(1)' }),
  row({
    id: 2, name: 'Unknowny', lang: 'N/A', seasons: '', runtime: '-5', year: '', rating: '0', poster: '', age: 'N/A',
    seasonsWatched: '', episodesWatched: '0', runtimeWatched: '0', firstAirDate: '',
  }),
  // Completed (watched = total): one show per progress state. Kept before the last 3 rows, so
  // Recently Watched (the last 3) and every Highlight stay the same
  row({ id: 6, name: 'Finished', year: '2010', rating: '7.2', episodesWatched: '30', totalEpisodes: '30' }),
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
// Path-agnostic, so it also matches the CSV under a sub-path base (/sub/tv_series.csv)
export const CSV_GLOB = `**/${CSV_FILE}`

// Fixture routes: `body` for tv_series.csv (null = real file) + the broken poster
async function serveFixtures(page: Page, body: string | null) {
  if (body != null) await page.route(CSV_GLOB, r => r.fulfill({ status: 200, contentType: 'text/csv', body }))
  await page.route(`**${BROKEN_POSTER}`, r => r.fulfill({ status: 200, contentType: 'image/png', body: 'not a png' }))
}

// `theme` option: every page.goto gets `?theme=<name>` (the URL override — applied for that load,
// never saved), so a test runs in a theme without driving the selector or touching storage.
function withThemeParam(url: string, theme: string): string {
  const hashAt = url.indexOf('#')
  const [base, hash] = hashAt < 0 ? [url, ''] : [url.slice(0, hashAt), url.slice(hashAt)]
  return `${base}${base.includes('?') ? '&' : '?'}theme=${encodeURIComponent(theme)}${hash}`
}
function applyTheme(page: Page, theme: string | null) {
  if (theme == null) return
  const goto = page.goto.bind(page)
  page.goto = (url, options) => goto(withThemeParam(url, theme), options)
}

// `newTab()`: another page in the same browser context (shares localStorage, gets `storage`
// events) with the same fixture routes and console-error check as `page`.
export const test = base.extend<{
  csv: string | null
  theme: string | null
  allowConsoleErrors: RegExp | null
  watchConsole: (page: Page) => void
  newTab: () => Promise<Page>
}>({
  csv: [TEST_CSV, { option: true }],
  theme: [null, { option: true }],
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
  page: async ({ page, csv, theme, watchConsole }, use) => {
    watchConsole(page)
    applyTheme(page, theme)
    await serveFixtures(page, csv)
    await use(page)
  },
  newTab: async ({ context, csv, theme, watchConsole }, use) => {
    await use(async () => {
      const tab = await context.newPage()
      watchConsole(tab)
      applyTheme(tab, theme)
      await serveFixtures(tab, csv)
      return tab
    })
  },
})
export { expect }
export type { Page }

export const content = (page: Page): Locator => page.locator('.ant-layout-content')
// Header title (AppLayout's level-4 Title) and a desktop sidebar nav item
export const header = (page: Page, name: string): Locator => page.locator('.ant-layout-header').getByRole('heading', { name })
export const sidebarItem = (page: Page, name: string): Locator => page.locator('.ant-layout-sider').getByRole('menuitem', { name })
export const scrollContent = (page: Page, y: number) => content(page).evaluate((el, top) => el.scrollTo(0, top), y)
// Mobile BottomNav (below lg)
export const bottomNav = (page: Page): Locator => page.locator('nav').filter({ has: page.getByRole('button', { name: 'Dashboard' }) })
// Whole-text match for `hasText` — the text is escaped, so labels with ( ) + ? . match literally
export const exactText = (text: string): RegExp => new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)

// Clickable show cards / rows in the page content, and their aria-labels sorted
export const showCards = (page: Page): Locator => content(page).locator('[role=button][aria-label]')
export const showCardNames = (page: Page): Promise<(string | null)[]> =>
  showCards(page).evaluateAll(els => els.map(e => e.getAttribute('aria-label')).sort())
// Dashboard's Continue Watching section (heading + order toggle + rows)
export const continueSection = (page: Page): Locator =>
  page.getByRole('heading', { name: 'Continue Watching', level: 5 }).locator('xpath=../..')

// antd Select by its input id; pickOption opens it, clicks the exact option and closes the dropdown
export const selectById = (page: Page, id: string): Locator => page.locator('.ant-select', { has: page.locator(`#${id}`) })
export async function pickOption(page: Page, id: string, option: string): Promise<void> {
  await selectById(page, id).locator('.ant-select-selector').click()
  await page.locator('.ant-select-dropdown:visible .ant-select-item-option', { hasText: exactText(option) }).click()
  await page.keyboard.press('Escape')
}

export const themeSelect = (page: Page): Locator => selectById(page, 'theme-select')
export const selectedTheme = (page: Page): Locator => themeSelect(page).locator('.ant-select-selection-item')

// Picks a theme in the header selector (exact option text) and waits until it's selected
export async function pickTheme(page: Page, name: string): Promise<void> {
  await themeSelect(page).click()
  await page.locator('.ant-select-item-option').filter({ hasText: exactText(name) }).click()
  await expect(selectedTheme(page)).toHaveText(name)
}

// Saved theme before every page load (incl. reloads) — use only where it must stay fixed
export async function saveTheme(page: Page, themeName: string): Promise<void> {
  await page.addInitScript(([key, name]) => localStorage.setItem(key, JSON.stringify({ themeName: name })), [SETTINGS_KEY, themeName] as const)
}

// <html> painted in a theme (color scheme + contentBg), by name
export async function expectThemePainted(page: Page, name: ThemeName): Promise<void> {
  await expectDocTheme(page, THEMES[name].isDark ? 'dark' : 'light', rgb(THEMES[name].contentBg))
}

// Writes tvdash-settings once (after loading `/`, so the origin's storage exists); the caller
// reloads / navigates. For a value that must survive every reload use saveTheme.
export async function seedSettings(page: Page, settings: Record<string, unknown>): Promise<void> {
  await page.goto('/')
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [SETTINGS_KEY, JSON.stringify(settings)] as const)
}
// Parsed tvdash-settings, or null when nothing is saved
export const storedSettings = (page: Page): Promise<Record<string, unknown> | null> =>
  page.evaluate(key => { const raw = localStorage.getItem(key); return raw === null ? null : JSON.parse(raw) }, SETTINGS_KEY)

// Counts `storage` events the page receives from now on — wait on storageEvents() so an assertion
// about another tab's write can't pass before the event has arrived
type StorageCountWindow = { __storageEvents: number }
export async function countStorageEvents(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as StorageCountWindow
    w.__storageEvents = 0
    addEventListener('storage', () => { w.__storageEvents++ })
  })
}
export const storageEvents = (page: Page): Promise<number> =>
  page.evaluate(() => (window as unknown as StorageCountWindow).__storageEvents)

// Serves `export function <exportName>() { <body> }` in place of a source module (Vite dev serves
// /src/... as ES modules) — forces a crash with no test hooks in app code. The trailing * covers
// ?t= / ?v= queries.
export async function crashModule(page: Page, file: string, exportName: string, body: string): Promise<void> {
  await page.route(`**/src/${file}*`, r =>
    r.fulfill({ status: 200, contentType: 'application/javascript', body: `export function ${exportName}() { ${body} }` }),
  )
}

// allowConsoleErrors for a provoked crash: the spec's own marker (e.g. 'boom: page crash') plus
// the reports React / React Router log for any caught render error — whichever component or
// error layer logs them, so a new boundary or a rename doesn't widen every spec's pattern.
export const allowProvokedErrors = (marker: string): RegExp =>
  new RegExp(`${marker}|The above error occurred|React Router caught`)

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
    // A new history entry the way React Router pushes one: its own `key` (scroll positions are
    // stored per key — `{}` would reuse the initial entry's 'default' key) and the next `idx`
    const idx = ((history.state as { idx?: number } | null)?.idx ?? 0) + 1
    history.pushState({ usr: null, key: Math.random().toString(36).slice(2, 10), idx }, '', p)
    dispatchEvent(new PopStateEvent('popstate'))
  }, to)
}

export function descriptionValue(page: Page, label: string): Locator {
  return page
    .locator('.ant-descriptions-item', { has: page.locator('.ant-descriptions-item-label', { hasText: exactText(label) }) })
    .locator('.ant-descriptions-item-content')
}

export function statistic(page: Page, title: string): Locator {
  return page.locator('.ant-statistic', { has: page.locator('.ant-statistic-title', { hasText: title }) })
}
