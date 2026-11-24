import { test as base, expect, type Locator, type Page } from '@playwright/test'
// Synthetic CSV for the e2e suite — `csv()` adds the header shared with the unit tests
// (series-search.py FIELDNAMES order), so the column contract lives in one TS place
import { csv } from '../src/utils/parseSeriesCsv.fixture'

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
export const test = base.extend<{ csv: string | null; consoleErrors: string[] }>({
  csv: [TEST_CSV, { option: true }],
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = []
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
      page.on('pageerror', e => errors.push(String(e)))
      await use(errors)
      expect(errors, 'console errors').toEqual([])
    },
    { auto: true },
  ],
  page: async ({ page, csv: body }, use) => {
    if (body != null) await page.route('**/tv_series.csv', r => r.fulfill({ status: 200, contentType: 'text/csv', body }))
    await page.route(`**${BROKEN_POSTER}`, r => r.fulfill({ status: 200, contentType: 'image/png', body: 'not a png' }))
    await use(page)
  },
})
export { expect }

export const content = (page: Page): Locator => page.locator('.ant-layout-content')
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
