import type { BrowserContext, Page } from '@playwright/test'
import { test, expect, content, pickTheme, spaNavigate, TEST_CSV } from './fixtures'
import { THEMES } from '../src/themes'

// Runs only via playwright.pwa.config.ts (`npm run e2e:pwa`): a production build on `vite preview`,
// service workers allowed.
//
// CSV seeding: once the service worker controls the page, the CSV fetch is made *by the SW*,
// which `page.route` never sees — so TEST_CSV is served with `context.route` (Chromium applies
// it to SW traffic too) and the page-level CSV route is off (`csv: null`). The real
// public/tv_series.csv copied into dist/ is therefore never read. Going offline = unroute the
// CSV + `context.setOffline(true)`, so the SW's NetworkFirst has to fall back to its cache.
test.use({ csv: null, allowConsoleErrors: /ERR_INTERNET_DISCONNECTED|Failed to load resource/ })

const CSV_GLOB = '**/tv_series.csv'

async function serveCsv(context: BrowserContext) {
  await context.route(CSV_GLOB, r => r.fulfill({ status: 200, contentType: 'text/csv', body: TEST_CSV }))
}

// First visit installs the SW, but (prompt mode, no clients.claim) it only controls the page
// after a reload — that second load is the one whose CSV fetch the SW caches.
async function visitControlled(page: Page) {
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined))
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  await expect(content(page)).toContainText('Alpha')
}

test('exposes a valid manifest and registers a service worker', async ({ page, context }) => {
  await serveCsv(context)
  await page.goto('/')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(href).toBeTruthy()
  const manifest = await (await page.request.get(href!)).json()
  expect(manifest).toMatchObject({ name: 'TV Dashboard', start_url: '/', display: 'standalone' })
  const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes)
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']))
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true)
  for (const icon of manifest.icons) expect((await page.request.get(icon.src)).ok(), icon.src).toBe(true)

  const scope = await page.evaluate(() => navigator.serviceWorker.ready.then(r => r.scope))
  expect(scope).toBe(new URL('/', page.url()).href)
})

test('works offline after one visit: every page, cached data, offline notice', async ({ page, context }) => {
  await serveCsv(context)
  await visitControlled(page)
  const notice = page.getByText('Offline — showing saved data')
  await expect(notice).toHaveCount(0)

  await context.unroute(CSV_GLOB)
  await context.setOffline(true)
  await page.reload()
  await expect(content(page)).toContainText('Alpha') // Dashboard from the cached CSV
  await expect(notice).toBeVisible()

  await spaNavigate(page, '/shows')
  await expect(page.locator('#shows-search')).toBeVisible()
  await expect(content(page).locator('[role=button][aria-label]')).toHaveCount(5)
  await spaNavigate(page, '/stats')
  await expect(page.locator('.ant-tabs')).toBeVisible()

  // Deep link straight into Show Detail, offline → navigateFallback serves the app shell
  await page.goto('/shows/3')
  await expect(content(page)).toContainText('Fraction')
  await expect(notice).toBeVisible()

  await context.setOffline(false)
  await expect(notice).toHaveCount(0)
})

test('a file URL opened in a tab is not swallowed by the app-shell fallback', async ({ page, context }) => {
  await serveCsv(context)
  await visitControlled(page)
  // Chrome downloads a text/csv navigation — the app shell would have rendered "Page not found"
  const download = page.waitForEvent('download')
  await page.goto('/tv_series.csv').catch(() => {}) // "Download is starting" aborts the navigation
  expect((await download).suggestedFilename()).toBe('tv_series.csv')
})

test('theme-color meta follows the active theme', async ({ page, context }) => {
  await serveCsv(context)
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  const meta = page.locator('meta[name="theme-color"]')
  await expect(meta).toHaveAttribute('content', THEMES['Default Dark'].headerBg)

  await pickTheme(page, 'Default Light')
  await expect(meta).toHaveAttribute('content', THEMES['Default Light'].headerBg)
})
