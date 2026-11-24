import { test, expect, content, fallbackIcon } from './fixtures'

test.describe('CSV warning banner', () => {
  test('lists skipped rows by record number and can be dismissed', async ({ page }) => {
    await page.goto('/')
    const banner = page.locator('.ant-alert-warning')
    await expect(banner).toContainText('3 rows in tv_series.csv skipped')
    await expect(banner).toContainText(/record \d/)
    await expect(banner).not.toContainText(/line \d/)
    await expect(banner).toContainText('duplicate TV ID 1')
    await expect(banner).toContainText('invalid TV ID')
    await banner.locator('.ant-alert-close-icon').click()
    await expect(banner).toHaveCount(0)
  })
})

test.describe('Dashboard highlights', () => {
  test('pick the right shows, with poster fallback for a broken URL', async ({ page }) => {
    await page.goto('/')
    const most = page.getByRole('button', { name: 'Most Watched: Newbie' })
    const top = page.getByRole('button', { name: 'Top Rated: Huge' })
    const newest = page.getByRole('button', { name: 'Newest Release: Newbie' })
    await expect(most).toBeVisible()
    await expect(top).toContainText('9.1 rating')
    await expect(newest).toContainText('2024')
    await expect(fallbackIcon(top)).toHaveCount(1) // broken poster
    await expect(top.locator('img')).toHaveCount(0)
    await expect(most.locator('img')).toHaveCount(1) // good poster
    await expect(top).toHaveAttribute('tabindex', '0')
  })

  test('navigate on click, Enter and Space', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Top Rated: Huge' }).click()
    await expect(page).toHaveURL(/\/shows\/4$/)

    await page.goBack() // SPA history — no app reload / CSV re-fetch
    await page.getByRole('button', { name: 'Most Watched: Newbie' }).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/shows\/5$/)

    await page.goBack()
    await page.getByRole('button', { name: 'Newest Release: Newbie' }).focus()
    await page.keyboard.press(' ')
    await expect(page).toHaveURL(/\/shows\/5$/)
  })
})

test('Not Started list: unknowns show "–", rated shows first, no N/A', async ({ page }) => {
  await page.goto('/')
  const card = page.locator('.ant-card', { has: page.locator('.ant-card-head-title', { hasText: 'Not Started' }) })
  await expect(card.locator('[role=button]').first()).toContainText('Huge')
  const unknowny = card.getByRole('button', { name: 'Unknowny' })
  await expect(unknowny).toContainText('–')
  await expect(unknowny).not.toContainText(/\b0(\.0)?\b/)
  await expect(content(page)).not.toContainText('N/A')
})
