import { test, expect, content, continueSection, type Page } from './fixtures'

// TEST_CSV in-progress shows — Alpha: 10/30 × 45m → 15h left, seasons 3 with S1 watched → next S2;
// Fraction: 5/10, runtime 0 (unknown) → no time left; Newbie: 20/40 × 30m → 10h left.
// Most watched: Fraction / Newbie (50%, data order) then Alpha (33%). Least time left: Newbie, Alpha, Fraction.

const rowNames = (page: Page) =>
  continueSection(page).locator('[role=button][aria-label]').evaluateAll(els => els.map(e => e.getAttribute('aria-label')))

test('Show Detail shows time left and the next season', async ({ page }) => {
  await page.goto('/shows/1')
  const card = content(page).locator('.ant-card', { hasText: 'Watch History' })
  await expect(card).toContainText('Time left · 15h · 20 episodes')
  await expect(card).toContainText('Next · Season 2')
})

test('Show Detail hides time left for an unknown runtime and a finished show', async ({ page }) => {
  await page.goto('/shows/3')
  const card = content(page).locator('.ant-card', { hasText: 'Watch History' })
  await expect(card).toContainText('5 of 10 episodes')
  await expect(card).not.toContainText('Time left')
  // seasons 2.5 → unknown count → no next season
  await expect(card).not.toContainText('Next ·')

  await page.goto('/shows/6')
  await expect(card).toContainText('30 of 30 episodes')
  await expect(card).not.toContainText('Time left')
})

test('Continue Watching order toggle: Most watched by default, Least time left puts unknown runtime last', async ({ page }) => {
  await page.goto('/')
  const section = continueSection(page)
  await expect(section.locator('[role=button][aria-label]')).toHaveCount(3)
  expect(await rowNames(page)).toEqual(['Fraction', 'Newbie', 'Alpha'])
  await expect(section.getByRole('button', { name: 'Newbie' })).toContainText('20/40 eps · 50% · 10h left')
  await expect(section.getByRole('button', { name: 'Fraction' })).toContainText(/5\/10 eps · 50%$/)

  await section.getByText('Least time left', { exact: true }).click()
  await expect.poll(() => rowNames(page)).toEqual(['Newbie', 'Alpha', 'Fraction'])

  // Per visit — not saved
  await page.reload()
  await expect.poll(() => rowNames(page)).toEqual(['Fraction', 'Newbie', 'Alpha'])
})

for (const width of [375, 768, 1280]) {
  test(`Continue Watching row text stays inside its card at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const rows = continueSection(page).locator('[role=button][aria-label]')
    await expect(rows).toHaveCount(3)
    const overflowing = await rows.evaluateAll(els =>
      els.filter(el => {
        const card = el.getBoundingClientRect()
        return Array.from(el.querySelectorAll('span')).some(t => t.getBoundingClientRect().right > card.right + 0.5)
      }).map(el => el.getAttribute('aria-label')),
    )
    expect(overflowing).toEqual([])
    // the order toggle stays on screen too
    const toggle = await continueSection(page).locator('.ant-segmented').boundingBox()
    expect(toggle && toggle.x + toggle.width).toBeLessThanOrEqual(width)
  })
}
