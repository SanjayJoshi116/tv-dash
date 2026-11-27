import { test, expect, content, CSV_GLOB, pickOption, row, selectById, showCards, type Page, scrollContent, seedSettings, sidebarItem, storedSettings } from './fixtures'
import { csv } from '../src/utils/parseSeriesCsv.fixture'

// 60 shows (Show 01 … Show 60, CSV order) so paging has 5 pages at 12 / 3 at 24; genres cycle
// Drama → Comedy → Crime, status alternates Ended / Returning Series. No posters (no network).
const pad = (n: number) => String(n).padStart(2, '0')
const GENRES = ['Drama', 'Comedy', 'Crime']
const SHOWS_CSV = csv(
  ...Array.from({ length: 60 }, (_, i) =>
    row({ id: i + 1, name: `Show ${pad(i + 1)}`, genres: GENRES[i % 3], status: (i + 1) % 2 ? 'Ended' : 'Returning Series', poster: '' }),
  ),
)
test.use({ csv: SHOWS_CSV })

const urlParams = (page: Page) => new URL(page.url()).searchParams

test('filters and sort appear in the URL, defaults omitted', async ({ page }) => {
  await page.goto('/shows')
  await expect(showCards(page)).toHaveCount(24)
  await pickOption(page, 'shows-genre-filter', 'Drama')
  await expect(page).toHaveURL(/\/shows\?genre=Drama$/)
  await expect(content(page)).toContainText('20 of 60 shows')

  await pickOption(page, 'shows-sort', 'Name A–Z')
  await expect(page).toHaveURL(/\/shows\?genre=Drama&sort=name$/)
})

test('a filtered URL opens that view in a fresh page', async ({ page }) => {
  await page.goto('/shows?genre=Crime&page=2&size=12')
  await expect(content(page)).toContainText('20 of 60 shows')
  await expect(page.locator('.ant-pagination-item-active')).toHaveText('2')
  await expect(showCards(page)).toHaveCount(8)
  // Crime = every third show from Show 03; recentFirst → page 2 starts at the 13th from the end
  await expect(showCards(page).first()).toHaveAttribute('aria-label', 'Show 24')
})

test('URL filters win over saved filters', async ({ page }) => {
  await seedSettings(page, { filters: { search: '', genres: ['Comedy'], status: '', sortBy: 'recentFirst' } })
  await page.goto('/shows?genre=Crime')
  await expect(selectById(page, 'shows-genre-filter')).toContainText('Crime')
  await expect(selectById(page, 'shows-genre-filter')).not.toContainText('Comedy')
  await expect(page).toHaveURL(/\?genre=Crime$/)
})

test('an empty URL is seeded from saved filters without a history entry', async ({ page }) => {
  await seedSettings(page, { filters: { search: '', genres: ['Comedy'], status: '', sortBy: 'recentFirst' } })
  await page.goto('/stats')
  await sidebarItem(page, 'Shows').click()
  await expect(page).toHaveURL(/\/shows\?genre=Comedy$/)
  await expect(content(page)).toContainText('20 of 60 shows')
  await page.goBack()
  await expect(page).toHaveURL(/\/stats$/)
})

test('saved filters seed only once per mount: Shows in the nav after paging is unfiltered', async ({ page }) => {
  await seedSettings(page, { filters: { search: '', genres: [], status: '', sortBy: 'name' } })
  await page.goto('/shows')
  await expect(page).toHaveURL(/\/shows\?sort=name$/)
  await page.locator('.ant-pagination-item').filter({ hasText: /^2$/ }).click()
  await expect(page).toHaveURL(/\?sort=name&page=2$/)
  await expect(page.locator('.ant-pagination-item-active')).toHaveText('2')
  await expect(showCards(page).first()).toHaveAttribute('aria-label', 'Show 25')
  await sidebarItem(page, 'Shows').click()
  await expect(page).toHaveURL(/\/shows$/)
  // Default recentFirst order, not the saved name sort
  await expect(showCards(page).first()).toHaveAttribute('aria-label', 'Show 60')
})

test.describe('failed CSV load', () => {
  test.use({ allowConsoleErrors: /Failed to load resource/ })

  test('keeps a bookmarked page until Retry succeeds', async ({ page }) => {
    const fail = (route: import('@playwright/test').Route) => route.fulfill({ status: 500, body: 'nope' })
    await page.route(CSV_GLOB, fail)
    await page.goto('/shows?genre=Crime&page=2&size=12')
    await expect(content(page)).toContainText('Failed to load data')
    await expect(page).toHaveURL(/page=2/)
    await page.unroute(CSV_GLOB, fail)
    await content(page).getByRole('button', { name: 'Retry' }).click()
    await expect(page.locator('.ant-pagination-item-active')).toHaveText('2')
    await expect(page).toHaveURL(/\?genre=Crime&page=2&size=12$/)
  })
})

test('Back undoes a genre', async ({ page }) => {
  await page.goto('/shows')
  await expect(showCards(page)).toHaveCount(24)
  await pickOption(page, 'shows-genre-filter', 'Drama')
  await expect(page).toHaveURL(/\?genre=Drama$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/shows$/)
  await expect(selectById(page, 'shows-genre-filter')).not.toContainText('Drama')
  await expect(content(page)).not.toContainText('20 of 60 shows')
})

test('typing a search is one history step', async ({ page }) => {
  await page.goto('/stats')
  await sidebarItem(page, 'Shows').click()
  await expect(showCards(page)).toHaveCount(24)
  await page.locator('#shows-search').pressSequentially('show 1')
  await expect(page).toHaveURL(/\/shows\?q=show\+1$/)
  await expect(content(page)).toContainText('10 of 60 shows')
  await page.goBack()
  await expect(page).toHaveURL(/\/stats$/)
})

test('a stale genre is dropped from the URL; an out-of-range page shows the last page', async ({ page }) => {
  await page.goto('/shows?genre=Gone&genre=Drama&sort=nope')
  await expect(page).toHaveURL(/\/shows\?genre=Drama$/)
  await expect(content(page)).toContainText('20 of 60 shows')

  await page.goto('/shows?page=999')
  await expect(page.locator('.ant-pagination-item-active')).toHaveText('3')
  await expect(page).toHaveURL(/\/shows\?page=3$/)
  await expect(showCards(page)).toHaveCount(12)
})

test('page 3 → a show → Back returns to page 3 at the same scroll position', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 700 })
  await page.goto('/shows?size=12')
  await page.locator('.ant-pagination-item', { hasText: /^3$/ }).click()
  await expect(page).toHaveURL(/\/shows\?page=3&size=12$/)
  await expect(showCards(page).first()).toHaveAttribute('aria-label', 'Show 36')
  await scrollContent(page, 250)
  // Let the rAF-throttled recorder store the position (scrollTop may clamp to the list's height)
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
  const before = await content(page).evaluate(el => el.scrollTop)
  expect(before).toBeGreaterThan(100)

  // dispatchEvent, not click(): Playwright would scroll the card into view first
  await showCards(page).nth(5).dispatchEvent('click')
  await expect(page).toHaveURL(/\/shows\/\d+$/)
  await expect.poll(() => content(page).evaluate(el => el.scrollTop)).toBe(0)

  await page.goBack()
  await expect(page).toHaveURL(/\/shows\?page=3&size=12$/)
  await expect(page.locator('.ant-pagination-item-active')).toHaveText('3')
  await expect.poll(() => content(page).evaluate(el => el.scrollTop)).toBe(before)
})

test('scrolled Shows → Statistics via the nav starts at the top', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 700 })
  await page.goto('/shows')
  await expect(showCards(page)).toHaveCount(24)
  await scrollContent(page, 500)
  await sidebarItem(page, 'Statistics').click()
  await expect(page).toHaveURL(/\/stats$/)
  await expect.poll(() => content(page).evaluate(el => el.scrollTop)).toBe(0)
})

test('page and size are never saved', async ({ page }) => {
  await page.goto('/shows?size=12&page=2')
  await pickOption(page, 'shows-genre-filter', 'Drama')
  await expect(page).toHaveURL(/\?genre=Drama&size=12$/)
  await expect.poll(async () => JSON.stringify((await storedSettings(page))?.filters ?? null)).toContain('Drama')
  const saved = (await storedSettings(page))?.filters as Record<string, unknown>
  expect(saved).not.toHaveProperty('page')
  expect(saved).not.toHaveProperty('size')
})
