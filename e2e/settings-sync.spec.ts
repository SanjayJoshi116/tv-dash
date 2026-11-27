import { test, expect, expectDocTheme, markNoReload, pickTheme, rgb, selectedTheme, spaNavigate, stillNoReload, countStorageEvents, storageEvents } from './fixtures'
import { THEMES } from '../src/themes'
import { SETTINGS_KEY } from '../src/utils/settings'

// Two pages in one browser context share localStorage; the browser fires `storage` only in the
// page that did NOT write — exactly the cross-tab case.

test('a theme change in one tab applies to the other without reload', async ({ page: a, newTab }) => {
  const b = await newTab()
  await a.emulateMedia({ colorScheme: 'dark' })
  await b.emulateMedia({ colorScheme: 'light' })
  await a.goto('/')
  await b.goto('/')
  await expect(selectedTheme(b)).toHaveText('System')
  await expectDocTheme(b, 'light', rgb(THEMES['Default Light'].contentBg))
  await markNoReload(b)

  await pickTheme(a, 'Dracula')
  await expect(selectedTheme(b)).toHaveText('Dracula')
  await expectDocTheme(b, 'dark', rgb(THEMES['Dracula'].contentBg))

  // System: B follows *its own* OS preference (light), not A's
  await pickTheme(a, 'System')
  await expect(selectedTheme(b)).toHaveText('System')
  await expectDocTheme(b, 'light', rgb(THEMES['Default Light'].contentBg))
  expect(await stillNoReload(b)).toBe(true)
})

test('Shows filters are not applied live; the other tab picks them up on its next visit', async ({ page: a, newTab }) => {
  const b = await newTab()
  await a.goto('/shows')
  await b.goto('/shows')
  await expect(b.locator('#shows-search')).toHaveValue('')

  await a.locator('#shows-search').fill('frac')
  // ShowsPage debounces the save (300ms) — wait until it's stored
  await expect.poll(() => a.evaluate(key => localStorage.getItem(key) ?? '', SETTINGS_KEY)).toContain('"frac"')
  await expect(b.locator('#shows-search')).toHaveValue('')

  await spaNavigate(b, '/')
  await expect(b.locator('#shows-search')).toHaveCount(0)
  await spaNavigate(b, '/shows')
  await expect(b.locator('#shows-search')).toHaveValue('frac')
})

test("a filtered Shows link in the other tab shows the link's filters, not the saved ones", async ({ page: a, newTab }) => {
  const b = await newTab()
  await a.goto('/shows')
  await a.locator('#shows-search').fill('frac')
  await expect.poll(() => a.evaluate(key => localStorage.getItem(key) ?? '', SETTINGS_KEY)).toContain('"frac"')

  await b.goto('/shows?q=alp')
  await expect(b.locator('#shows-search')).toHaveValue('alp')
  await expect(b.getByRole('button', { name: 'Alpha' })).toBeVisible()
  await expect(b.getByRole('button', { name: 'Fraction' })).toHaveCount(0)
})

test('corrupt or unknown settings from another tab are ignored', async ({ page: a, newTab }) => {
  const b = await newTab()
  await a.goto('/')
  await b.goto('/')
  await pickTheme(b, 'Dracula')
  // Count storage events B receives, so the assertions run after B has seen both writes
  await countStorageEvents(b)

  await a.evaluate(key => {
    localStorage.setItem(key, '{not json')
    localStorage.setItem(key, JSON.stringify({ themeName: 'Solarized' }))
  }, SETTINGS_KEY)
  await expect.poll(() => storageEvents(b)).toBe(2)

  await expect(selectedTheme(b)).toHaveText('Dracula')
  await expectDocTheme(b, 'dark', rgb(THEMES['Dracula'].contentBg))
})
