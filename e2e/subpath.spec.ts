import { test, expect, header, sidebarItem } from './fixtures'
import { CSV_FILE } from '../src/constants/csvFile'

// `npm run e2e:subpath` (playwright.subpath.config.ts): the production build with base `/sub/`,
// served by `vite preview`. Proves a sub-path deploy needs only the build flag: data, navigation,
// deep links, 404s and the PWA manifest / service worker all stay under the base.
const BASE = '/sub/'


test('Dashboard loads its data from under the base — nothing from the domain root', async ({ page }) => {
  const csvRequests: string[] = []
  page.on('request', r => { if (r.url().endsWith(`/${CSV_FILE}`)) csvRequests.push(new URL(r.url()).pathname) })
  await page.goto(BASE)
  await expect(page.getByText('Highlights')).toBeVisible()
  await expect(header(page, 'Dashboard')).toBeVisible()
  expect(csvRequests).toEqual([`${BASE}${CSV_FILE}`])
})

test('navigation keeps URLs under the base and highlights the right item', async ({ page }) => {
  await page.goto(BASE)
  await expect(page.getByText('Highlights')).toBeVisible()
  await sidebarItem(page, 'Shows').click()
  await expect(page).toHaveURL(/\/sub\/shows$/)
  await expect(header(page, 'Shows')).toBeVisible()
  await expect(page.locator('.ant-layout-sider .ant-menu-item-selected')).toHaveText('Shows')
  await sidebarItem(page, 'Statistics').click()
  await expect(page).toHaveURL(/\/sub\/stats$/)
  await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible()
})

test('a deep link to a show renders it (server falls back to the entry page)', async ({ page }) => {
  await page.goto(`${BASE}shows/1`)
  await expect(page.locator('.ant-layout-content h3').first()).toHaveText('Alpha')
  await expect(header(page, 'Alpha')).toBeVisible()
})

test('an unknown path under the base shows the not-found page inside the shell', async ({ page }) => {
  await page.goto(`${BASE}nope`)
  await expect(header(page, 'Page not found')).toBeVisible()
  await expect(page.locator('.ant-layout-sider')).toBeVisible()
})

// `/sub` without the trailing slash is the server's job (GitHub Pages redirects it to `/sub/`;
// `vite preview` answers 404 before the app loads), so it isn't asserted here.

test('the PWA manifest points at the base and its icons load', async ({ page, request }) => {
  await page.goto(BASE)
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(href?.startsWith(BASE)).toBe(true)
  const manifestUrl = new URL(href!, page.url())
  const manifest = await (await request.get(manifestUrl.href)).json() as { start_url: string; scope: string; icons: { src: string }[] }
  expect(manifest.start_url).toBe(BASE)
  expect(manifest.scope).toBe(BASE)
  for (const icon of manifest.icons) {
    const res = await request.get(new URL(icon.src, manifestUrl).href)
    expect(res.status(), icon.src).toBe(200)
  }
})

test.describe('service worker', () => {
  test.use({ serviceWorkers: 'allow' })

  test('registers with the base as its scope', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.getByText('Highlights')).toBeVisible()
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope)
    expect(new URL(scope).pathname).toBe(BASE)
  })
})
