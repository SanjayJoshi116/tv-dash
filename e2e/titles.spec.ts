import type { Page } from '@playwright/test'
import { test, expect, CSV_GLOB, holdRoute, spaNavigate } from './fixtures'
import { APP_NAME } from '../src/utils/pageTitle'

const SUFFIX = ` · ${APP_NAME}`
const headerTitle = (page: Page) => page.locator('.ant-layout-header h4')

// Header text always equals the tab title minus the suffix
async function expectTitle(page: Page, title: string) {
  await expect(page).toHaveTitle(title + SUFFIX)
  await expect(headerTitle(page)).toHaveText(title)
}

for (const [path, title] of [
  ['/', 'Dashboard'],
  ['/shows', 'Shows'],
  ['/shows/', 'Shows'],
  ['/stats', 'Statistics'],
  ['/Stats', 'Statistics'], // router matches case-insensitively
  ['/does-not-exist', 'Page not found'],
  ['/shows/1/extra', 'Page not found'],
] as const) {
  test(`${path} → "${title}"`, async ({ page }) => {
    await page.goto(path)
    await expectTitle(page, title)
  })
}

test('title follows SPA navigation between pages', async ({ page }) => {
  await page.goto('/')
  await expectTitle(page, 'Dashboard')
  await spaNavigate(page, '/stats')
  await expectTitle(page, 'Statistics')
})

test('Show Detail uses the show name and updates on SPA navigation to another show', async ({ page }) => {
  await page.goto('/shows/1')
  await expectTitle(page, 'Alpha')
  await spaNavigate(page, '/shows/3')
  await expectTitle(page, 'Fraction')
})

test('unknown show ID → "Show not found"', async ({ page }) => {
  await page.goto('/shows/999999')
  await expectTitle(page, 'Show not found')
})

test('while data loads, Show Detail is titled "Show Detail"', async ({ page }) => {
  // Registered after the fixture's CSV route, so it runs first and holds the request back
  const release = await holdRoute(page, CSV_GLOB)
  await page.goto('/shows/1')
  await expectTitle(page, 'Show Detail')
  release()
  await expectTitle(page, 'Alpha')
})
