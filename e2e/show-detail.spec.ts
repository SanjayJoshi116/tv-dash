import { test, expect, content, descriptionValue, fallbackIcon, spaNavigate, statistic } from './fixtures'

test.describe('Show Detail unknown values', () => {
  test('blank / 0 / N/A / negative values render "–"', async ({ page }) => {
    await page.goto('/shows/2')
    await expect(page.getByText('Unknowny').first()).toBeVisible()
    await expect(descriptionValue(page, 'Seasons')).toHaveText('–')
    await expect(descriptionValue(page, 'Ep. Runtime')).toHaveText('–') // CSV: -5
    await expect(statistic(page, 'Seasons Watched')).toContainText(/0\s*\/ –/)
    await expect(statistic(page, 'First Aired')).toContainText('–')
    await expect(page.locator('body')).not.toContainText('N/A')
    await expect(page.locator('body')).not.toContainText(/\b0\.0\b/)
    await expect(content(page).locator('img')).toHaveCount(0) // empty poster
    await expect(fallbackIcon(content(page)).first()).toBeVisible()
  })

  test('fractional season count and zero runtime render "–"', async ({ page }) => {
    await page.goto('/shows/3')
    await expect(page.getByText('Fraction').first()).toBeVisible()
    await expect(descriptionValue(page, 'Seasons')).toHaveText('–') // CSV: 2.5
    await expect(descriptionValue(page, 'Ep. Runtime')).toHaveText('–') // CSV: 0
    await expect(page.locator('body')).not.toContainText(/(^|[^\d.])2\.5\b/) // popularity "12.5" is fine
  })

  test('huge season count does not render millions of season tags', async ({ page }) => {
    await page.goto('/shows/4')
    await expect(page.getByText('Huge').first()).toBeVisible({ timeout: 5000 })
    await expect(descriptionValue(page, 'Seasons')).toHaveText('–') // CSV: 1e7
    expect(await page.locator('.ant-tag').count()).toBeLessThan(50)
  })
})

test('stat tiles never overflow or clip their value at in-between widths', async ({ page }) => {
  for (const width of [600, 900, 1100, 1250]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/shows/5') // Newbie: "20 / 40", "50h 0m"
    await expect(page.getByText('Newbie').first()).toBeVisible()
    const issues = await content(page).locator('.ant-statistic').evaluateAll(stats => stats.slice(0, 4).flatMap(s => {
      const card = s.closest('.ant-card')!.getBoundingClientRect()
      const value = s.querySelector('.ant-statistic-content') as HTMLElement
      const over = value.getBoundingClientRect().right > card.right + 0.5
      const clipped = value.scrollWidth > value.clientWidth + 1
      return over || clipped ? [`${value.textContent} (over=${over} clipped=${clipped})`] : []
    }))
    expect(issues, `width ${width}`).toEqual([])
  }
})

test('poster fallback is per URL across client-side navigation', async ({ page }) => {
  await page.goto('/shows/1') // broken poster
  await expect(page.getByText('Alpha').first()).toBeVisible()
  await expect(fallbackIcon(content(page)).first()).toBeVisible()
  await expect(content(page).locator('img')).toHaveCount(0)

  await spaNavigate(page, '/shows/5') // same component instance, good poster
  await expect(page.getByText('Newbie').first()).toBeVisible()
  await expect(content(page).locator('img')).toHaveAttribute('src', /^data:image\/png/)

  await spaNavigate(page, '/shows/1')
  await expect(page.getByText('Alpha').first()).toBeVisible()
  await expect(content(page).locator('img')).toHaveCount(0)
})
