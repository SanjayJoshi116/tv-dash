import type { Page } from '@playwright/test'
import { test, expect, allowProvokedErrors, content, crashModule, header, holdRoute, scrollContent, sidebarItem, spaNavigate } from './fixtures'

// Data router navigation feedback: the current page stays while the next page's code loads
// (NavProgress bar), page errors stay in the layout and clear on navigation, Show Detail isn't
// remounted between shows.

const bar = (page: Page) => page.getByRole('progressbar', { name: 'Loading page' })


// Records every appear / disappear of the bar (MutationObserver, from before the app loads) — a
// single read could miss a StrictMode flicker
async function traceBar(page: Page) {
  await page.addInitScript(() => {
    const log: string[] = []
    ;(window as unknown as { __barLog: string[] }).__barLog = log
    let shown = false
    new MutationObserver(() => {
      const now = document.querySelector('[role=progressbar][aria-label="Loading page"]') != null
      if (now !== shown) log.push(now ? 'show' : 'hide')
      shown = now
    }).observe(document, { childList: true, subtree: true })
  })
}
const barLog = (page: Page) => page.evaluate(() => (window as unknown as { __barLog: string[] }).__barLog)

test('unloaded page: current page stays with a progress bar until the next one renders', async ({ page }) => {
  await traceBar(page)
  const release = await holdRoute(page, '**/src/pages/StatisticsPage.tsx*')
  await page.goto('/')
  await expect(page.getByText('Highlights')).toBeVisible()

  await sidebarItem(page, 'Statistics').click()
  await expect(bar(page)).toBeVisible()
  await expect(page.getByText('Highlights')).toBeVisible()
  await expect(header(page, 'Dashboard')).toBeVisible()
  await expect(page.locator('.ant-layout-content .ant-spin')).toHaveCount(0)

  release()
  await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible()
  await expect(header(page, 'Statistics')).toBeVisible()
  await expect(bar(page)).toHaveCount(0)
  // Shown once, hidden once — no StrictMode oscillation
  expect(await barLog(page)).toEqual(['show', 'hide'])
})

test('loaded page: no progress bar', async ({ page }) => {
  await traceBar(page)
  await page.goto('/stats')
  await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible()
  await sidebarItem(page, 'Dashboard').click()
  await expect(page.getByText('Highlights')).toBeVisible()
  await sidebarItem(page, 'Statistics').click()
  await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible()
  expect(await barLog(page)).toEqual([])
})

test('page module is requested once: prefetch on hover + route lazy share it', async ({ page }) => {
  const requests: string[] = []
  page.on('request', r => { if (/\/src\/pages\/StatisticsPage\.tsx/.test(r.url())) requests.push(r.url()) })
  await page.goto('/')
  await expect(page.getByText('Highlights')).toBeVisible()
  await sidebarItem(page, 'Statistics').hover()
  await sidebarItem(page, 'Statistics').click()
  await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible()
  expect(requests).toHaveLength(1)
})

test.describe('page errors', () => {
  // + the bare `undefined` React logs for the falsy throw
  test.use({ allowConsoleErrors: allowProvokedErrors('boom: page crash|^undefined$') })

  test('a page that throws while navigating to it shows the error in the layout; the next page renders', async ({ page }) => {
    await crashModule(page, 'pages/ShowsPage.tsx', 'ShowsPage', 'throw new Error("boom: page crash")')
    await page.goto('/')
    await expect(page.getByText('Highlights')).toBeVisible()

    await sidebarItem(page, 'Shows').click()
    const alert = page.locator('.ant-layout-content .ant-alert-error')
    await expect(alert).toContainText('boom: page crash')
    await expect(alert.getByRole('button', { name: 'Retry' })).toBeVisible()
    await expect(page.locator('.ant-layout-sider')).toBeVisible()

    await sidebarItem(page, 'Dashboard').click()
    await expect(page.getByText('Highlights')).toBeVisible()
    await expect(alert).toHaveCount(0)
  })

  test('a falsy throw is still caught in the layout', async ({ page }) => {
    await crashModule(page, 'pages/ShowsPage.tsx', 'ShowsPage', 'throw undefined')
    await page.goto('/shows')
    await expect(page.locator('.ant-layout-content .ant-alert-error')).toBeVisible()
    await expect(page.locator('.ant-layout-header')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reset saved settings' })).toHaveCount(0)
  })
})

test('/shows/1 → /shows/3: same page instance, no loading state, scrolled to top', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 400 })
  await page.goto('/shows/1')
  const title = page.locator('.ant-layout-content h3').first()
  await expect(title).toHaveText('Alpha')
  await title.evaluate(el => { (el as HTMLElement & { __mark?: boolean }).__mark = true })
  await scrollContent(page, 300)

  await spaNavigate(page, '/shows/3')
  await expect(title).toHaveText('Fraction')
  expect(await title.evaluate(el => (el as HTMLElement & { __mark?: boolean }).__mark)).toBe(true)
  await expect(page.locator('.ant-layout-content .ant-spin')).toHaveCount(0)
  await expect.poll(() => content(page).evaluate(el => el.scrollTop)).toBe(0)
})

test('first load: the loading state shows inside the layout until the page code arrives', async ({ page }) => {
  const release = await holdRoute(page, '**/src/pages/DashboardPage.tsx*')
  await page.goto('/')
  await expect(page.locator('.ant-layout-content .ant-spin')).toBeVisible()
  await expect(page.locator('.ant-layout-header')).toBeVisible()
  release()
  await expect(page.getByText('Highlights')).toBeVisible()
  await expect(page.locator('.ant-layout-content .ant-spin')).toHaveCount(0)
})

test('reduced motion: the bar still shows, without a width transition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const release = await holdRoute(page, '**/src/pages/StatisticsPage.tsx*')
  await page.goto('/')
  await expect(page.getByText('Highlights')).toBeVisible()
  await sidebarItem(page, 'Statistics').click()
  await expect(bar(page)).toBeVisible()
  expect(await bar(page).evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s')
  release()
  await expect(bar(page)).toHaveCount(0)
})
