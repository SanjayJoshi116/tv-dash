import { test, expect, content, continueSection, pickOption, showCardNames, showCards } from './fixtures'

// TEST_CSV progress states — not started: Unknowny, Huge; in progress: Alpha, Fraction, Newbie;
// completed: Finished (all Drama)
test('progress select filters the list, adds a chip and a URL param', async ({ page }) => {
  await page.goto('/shows')
  await expect(showCards(page)).toHaveCount(6)
  await pickOption(page, 'shows-progress-filter', 'In progress')
  await expect(page).toHaveURL(/\/shows\?progress=inProgress$/)
  await expect(showCards(page)).toHaveCount(3)
  expect(await showCardNames(page)).toEqual(['Alpha', 'Fraction', 'Newbie'])
  const chip = content(page).locator('.ant-tag', { hasText: 'In progress' })
  await expect(chip).toBeVisible()

  await chip.locator('.ant-tag-close-icon').click()
  await expect(page).toHaveURL(/\/shows$/)
  await expect(showCards(page)).toHaveCount(6)
})

test('Completed combines with a genre', async ({ page }) => {
  await page.goto('/shows')
  await pickOption(page, 'shows-progress-filter', 'Completed')
  await pickOption(page, 'shows-genre-filter', 'Drama')
  await expect(page).toHaveURL(/\?genre=Drama&progress=completed$/)
  expect(await showCardNames(page)).toEqual(['Finished'])
})

test('an empty result offers Clear filters, which keeps the sort', async ({ page }) => {
  await page.goto('/shows?q=zzz&progress=completed&sort=name')
  await expect(content(page)).toContainText('No shows match your filters')
  await content(page).getByRole('button', { name: 'Clear filters' }).click()
  await expect(page).toHaveURL(/\/shows\?sort=name$/)
  await expect(showCards(page)).toHaveCount(6)
  await expect(showCards(page).first()).toHaveAttribute('aria-label', 'Alpha')
  // Back returns to the empty filtered view (Clear filters pushed)
  await page.goBack()
  await expect(content(page)).toContainText('No shows match your filters')
})

test('an unknown progress value lists everything and is removed from the URL', async ({ page }) => {
  await page.goto('/shows?progress=halfway')
  await expect(page).toHaveURL(/\/shows$/)
  await expect(showCards(page)).toHaveCount(6)
})

test('Dashboard Not Started → View all lists exactly the not-started shows', async ({ page }) => {
  await page.goto('/')
  const card = page.locator('.ant-card', { has: page.locator('.ant-card-head-title', { hasText: 'Not Started' }) })
  await card.getByRole('button', { name: 'View all' }).click()
  await expect(page).toHaveURL(/\/shows\?progress=notStarted$/)
  await expect(page.locator('#shows-progress-filter')).toBeAttached()
  await expect(showCards(page)).toHaveCount(2)
  expect(await showCardNames(page)).toEqual(['Huge', 'Unknowny'])
})

test('Dashboard Continue Watching → View all lists every in-progress show', async ({ page }) => {
  await page.goto('/')
  const section = continueSection(page)
  await section.getByRole('button', { name: 'View all' }).first().click()
  await expect(page).toHaveURL(/\/shows\?progress=inProgress$/)
  await expect(page.locator('#shows-progress-filter')).toBeAttached()
  await expect(showCards(page)).toHaveCount(3)
  expect(await showCardNames(page)).toEqual(['Alpha', 'Fraction', 'Newbie'])
})
