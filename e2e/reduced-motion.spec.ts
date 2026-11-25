import type { Locator, Page } from '@playwright/test'
import { test, expect, bottomNav, content, scrollContent } from './fixtures'

const legends = (page: Page) => content(page).locator('.recharts-legend-wrapper')
const opacityNow = (loc: Locator) => loc.evaluate(el => getComputedStyle(el).opacity)
const navTransition = (page: Page) => bottomNav(page).evaluate(el => getComputedStyle(el).transitionDuration)
const MOBILE = { width: 390, height: 844 }

// Samples every legend's opacity on every animation frame from page start and keeps the lowest
// value seen — a single read from the test races the fade (it may already be over, or not yet
// started). `__legendMin` is reset by `resetLegendMin` (e.g. before switching tabs back).
async function sampleLegendOpacity(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __legendMin: number }
    w.__legendMin = Infinity
    const tick = () => {
      for (const el of document.querySelectorAll('.recharts-legend-wrapper')) {
        w.__legendMin = Math.min(w.__legendMin, Number(getComputedStyle(el).opacity))
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}
const legendMin = (page: Page) => page.evaluate(() => (window as unknown as { __legendMin: number }).__legendMin)
const resetLegendMin = (page: Page) => page.evaluate(() => { (window as unknown as { __legendMin: number }).__legendMin = Infinity })

async function openOverviewPies(page: Page) {
  await sampleLegendOpacity(page)
  await page.goto('/stats')
  await expect(legends(page)).toHaveCount(2) // Top Genres + Status Breakdown
}

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('pie legends are visible immediately, also after switching tabs back', async ({ page }) => {
    await openOverviewPies(page)
    await page.waitForTimeout(2000) // longer than the pie animation + fade would take
    expect(await legendMin(page)).toBe(1) // never hidden, not even for a frame

    await page.getByRole('tab', { name: 'Ratings' }).click()
    await expect(legends(page)).toHaveCount(0) // Overview pane unmounted (destroyOnHidden)
    await resetLegendMin(page)
    await page.getByRole('tab', { name: 'Overview' }).click()
    await expect(legends(page)).toHaveCount(2)
    await page.waitForTimeout(2000)
    expect(await legendMin(page)).toBe(1)
  })

  test.describe('mobile', () => {
    test.use({ viewport: MOBILE })

    test('bottom nav has no slide transition but still hides / shows on scroll', async ({ page }) => {
      await page.goto('/stats')
      await expect(page.locator('.ant-tabs').first()).toBeVisible()
      expect(await navTransition(page)).toBe('0s')
      await expect(bottomNav(page)).toBeInViewport()
      await scrollContent(page, 400)
      await expect(bottomNav(page)).not.toBeInViewport()
      await scrollContent(page, 300)
      await expect(bottomNav(page)).toBeInViewport()
    })
  })
})

test.describe('no reduced-motion preference', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('pie legends still fade in after the slice animation', async ({ page }) => {
    await openOverviewPies(page)
    for (const l of await legends(page).all()) await expect.poll(() => opacityNow(l)).toBe('1')
    expect(await legendMin(page)).toBe(0) // was hidden while the pie animated
  })

  test('bottom nav keeps its slide transition', async ({ page }) => {
    await page.setViewportSize(MOBILE)
    await page.goto('/stats')
    expect(await navTransition(page)).toBe('0.25s')
  })
})
