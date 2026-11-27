import { test, expect, content } from './fixtures'

test('show card with unknown year / rating shows "–", no 0.0 or N/A', async ({ page }) => {
  await page.goto('/shows')
  const card = page.getByRole('button', { name: /Unknowny/ }).first()
  await expect(card).toContainText(/^\s*Unknowny\s*–\s*·/) // textContent: no spaces between elements
  await expect(card).not.toContainText(/\b0\.0\b/)
  await expect(card).not.toContainText('N/A')
})

test('search narrows the grid', async ({ page }) => {
  await page.goto('/shows')
  await expect(page.getByRole('button', { name: /Unknowny/ })).toBeVisible()
  await page.locator('#shows-search').fill('frac')
  await expect(content(page)).toContainText('1 of 6 shows')
  const cards = content(page).locator('[role=button][aria-label]')
  await expect(cards).toHaveCount(1)
  await expect(cards.first()).toHaveAttribute('aria-label', /Fraction/)
})

test('form fields have ids', async ({ page }) => {
  await page.goto('/shows')
  for (const id of ['#theme-select', '#shows-search', '#shows-genre-filter', '#shows-status-filter', '#shows-progress-filter', '#shows-sort']) {
    await expect(page.locator(id), id).toHaveCount(1)
  }
})
