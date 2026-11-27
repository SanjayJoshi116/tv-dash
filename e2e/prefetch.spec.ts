import type { Page } from '@playwright/test'
import { test, expect, content } from './fixtures'

// In the dev server every module is its own request, so a page's code = its page module URL
const PAGES = ['DashboardPage', 'ShowsPage', 'StatisticsPage', 'ShowDetailPage'] as const
type PageName = (typeof PAGES)[number]

function trackPageRequests(page: Page): Record<PageName, number> {
  const counts = Object.fromEntries(PAGES.map(p => [p, 0])) as Record<PageName, number>
  page.on('request', req => {
    const { pathname } = new URL(req.url())
    for (const p of PAGES) if (pathname === `/src/pages/${p}.tsx`) counts[p]++
  })
  return counts
}

async function enableDataSaver(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true, effectiveType: '4g' } })
  })
}

// Resolves after the app's own idle callback (registered earlier) has run — plus one more round
const afterIdle = (page: Page) =>
  page.evaluate(() => new Promise(r => requestIdleCallback(() => requestIdleCallback(() => r(null)))))

test.describe('with Data Saver', () => {
  test.beforeEach(async ({ page }) => enableDataSaver(page))

  test('no idle prefetch; hovering a nav item loads only that page', async ({ page }) => {
    const counts = trackPageRequests(page)
    await page.goto('/')
    await expect(page.getByRole('menuitem', { name: 'Statistics' })).toBeVisible()
    await afterIdle(page)
    expect(counts).toMatchObject({ ShowsPage: 0, StatisticsPage: 0, ShowDetailPage: 0 })

    await page.getByRole('menuitem', { name: 'Statistics' }).hover()
    await expect.poll(() => counts.StatisticsPage).toBe(1)
    expect(counts).toMatchObject({ ShowsPage: 0, ShowDetailPage: 0 })
  })

  test('hovering show cards requests Show Detail code once', async ({ page }) => {
    const counts = trackPageRequests(page)
    await page.goto('/shows')
    const cards = content(page).locator('[role=button][aria-label]')
    await expect(cards).toHaveCount(6)
    await afterIdle(page)
    expect(counts.ShowDetailPage).toBe(0)

    await cards.nth(0).hover()
    await expect.poll(() => counts.ShowDetailPage).toBe(1)
    for (let i = 1; i < 5; i++) await cards.nth(i).hover()
    await cards.nth(0).focus()
    await afterIdle(page)
    expect(counts.ShowDetailPage).toBe(1)
  })
})

test('without Data Saver, idle prefetch still loads every page', async ({ page }) => {
  const counts = trackPageRequests(page)
  await page.goto('/')
  await expect.poll(() => counts).toMatchObject({ ShowsPage: 1, StatisticsPage: 1, ShowDetailPage: 1 })
})
