import type { Locator } from '@playwright/test'
import { test, expect, content, saveTheme } from './fixtures'
import { contrast } from '../src/utils/contrast.fixture'

async function badgeContrast(badge: Locator): Promise<number> {
  const { color, bg } = await badge.evaluate(el => {
    const s = getComputedStyle(el)
    return { color: s.color, bg: s.backgroundColor }
  })
  expect(bg, 'badge has an opaque fill').not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/)
  return contrast(color, bg)
}

// The rating badge: the filled <span> holding the rating number
const ratingBadge = (scope: Locator, rating: string): Locator =>
  scope.locator('span[style*="background"]').filter({ hasText: rating }).first()

for (const themeName of ['Default Light', 'Default Dark']) {
  test.describe(themeName, () => {
    test.beforeEach(async ({ page }) => saveTheme(page, themeName))

    test('show card rating badges: text ≥ 4.5:1 vs fill', async ({ page }) => {
      await page.goto('/shows')
      // Alpha 8.5 / Huge 9.1 → success, Fraction 7.0 / Newbie 6.0 → warning
      for (const [name, rating] of [['Alpha', '8.5'], ['Fraction', '7.0'], ['Newbie', '6.0'], ['Huge', '9.1']]) {
        const badge = ratingBadge(page.getByRole('button', { name }), rating)
        await expect(badge).toBeVisible()
        expect(await badgeContrast(badge), `${name} ${rating}`).toBeGreaterThanOrEqual(4.5)
      }
    })

    test('Show Detail rating badge: text ≥ 4.5:1 vs fill', async ({ page }) => {
      await page.goto('/shows/3')
      const badge = ratingBadge(content(page), '7.0')
      await expect(badge).toBeVisible()
      expect(await badgeContrast(badge)).toBeGreaterThanOrEqual(4.5)
    })
  })
}
