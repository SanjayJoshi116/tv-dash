import type { Page } from '@playwright/test'
import { test, expect, content, spaNavigate } from './fixtures'

// BottomNav (below lg): hides on scroll-down, reappears on scroll-up / near the top / after navigating.
// /stats is the tallest page with the 5-show TEST_CSV, so it's the one that can scroll.
const MOBILE = { width: 390, height: 844 }
const nav = (page: Page) => page.locator('nav').filter({ has: page.getByRole('button', { name: 'Dashboard' }) })
const scrollContent = (page: Page, y: number) => content(page).evaluate((el, top) => el.scrollTo(0, top), y)
// Hidden = slid below the viewport (translateY(100%)); waits through the CSS transition
const expectShown = (page: Page) => expect(nav(page)).toBeInViewport()
const expectHidden = (page: Page) => expect(nav(page)).not.toBeInViewport()

async function gotoStats(page: Page) {
  await page.goto('/stats')
  await expect(page.locator('.ant-tabs').first()).toBeVisible() // charts rendered → page can scroll
}

test.describe('mobile bottom nav', () => {
  test.use({ viewport: MOBILE })

  test('hides on scroll-down, shows on scroll-up and near the top', async ({ page }) => {
    await gotoStats(page)
    await expectShown(page)
    await scrollContent(page, 400)
    await expectHidden(page)
    await scrollContent(page, 300)
    await expectShown(page)
    await scrollContent(page, 600)
    await expectHidden(page)
    await scrollContent(page, 0)
    await expectShown(page)
  })

  test('reappears and resets scroll after navigating', async ({ page }) => {
    await gotoStats(page)
    await scrollContent(page, 500)
    await expectHidden(page)
    await spaNavigate(page, '/shows')
    await expectShown(page)
    await expect.poll(() => content(page).evaluate(el => el.scrollTop)).toBe(0)
  })

  test('nav buttons navigate and mark the current page', async ({ page }) => {
    await page.goto('/')
    await nav(page).getByRole('button', { name: 'Shows' }).click()
    await expect(page).toHaveURL(/\/shows$/)
    await expect(nav(page).getByRole('button', { name: 'Shows' })).toHaveAttribute('aria-current', 'page')
  })
})

test('desktop → mobile while scrolled: bar starts visible', async ({ page }) => {
  await gotoStats(page)
  await expect(nav(page)).toHaveCount(0) // desktop: Sider, no bottom nav
  await scrollContent(page, 600)
  await page.setViewportSize(MOBILE)
  await expect(nav(page)).toHaveCount(1)
  await expectShown(page)
  // Deliberate fixed wait: outlast BottomNav's 800ms scroll-anchoring ignore window, then check
  // the reflow's scroll events didn't hide the bar (there's no event to wait on for "nothing happened")
  await page.waitForTimeout(1000)
  await expectShown(page)
})
