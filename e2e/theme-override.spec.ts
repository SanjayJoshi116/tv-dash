import { test, expect, countStorageEvents, expectThemePainted, holdRoute, pickTheme, seedSettings, selectedTheme, sidebarItem, storageEvents, storedSettings } from './fixtures'

// `?theme=<option>`: one-visit theme override, never saved (readThemeOverride + boot script).



test('?theme= applies for the visit, survives in-app navigation, and is never saved', async ({ page }) => {
  await seedSettings(page, { themeName: 'Default Light' })

  await page.goto('/stats?theme=dracula')
  await expect(selectedTheme(page)).toHaveText('Dracula')
  await expectThemePainted(page, 'Dracula')

  await sidebarItem(page, 'Shows').click()
  await expect(page).toHaveURL(/\/shows$/)
  await expectThemePainted(page, 'Dracula')
  expect(await storedSettings(page)).toEqual({ themeName: 'Default Light' })

  // Next visit without the parameter: the saved theme again
  await page.goto('/')
  await expect(selectedTheme(page)).toHaveText('Default Light')
  await expectThemePainted(page, 'Default Light')
})

test('picking a theme in the selector ends the override and saves', async ({ page }) => {
  await seedSettings(page, { themeName: 'Default Light' })
  await page.goto('/?theme=Dracula')
  await pickTheme(page, 'Nord')
  await expectThemePainted(page, 'Nord')
  expect(await storedSettings(page)).toMatchObject({ themeName: 'Nord' })
})

test('an unknown value is ignored', async ({ page }) => {
  await seedSettings(page, { themeName: 'Nord' })
  await page.goto('/?theme=Nope')
  await expect(selectedTheme(page)).toHaveText('Nord')
  await expectThemePainted(page, 'Nord')
})

test('first paint already uses the override', async ({ page }) => {
  await seedSettings(page, { themeName: 'Default Dark' })
  const release = await holdRoute(page, '**/src/main.tsx*')
  await page.goto('/?theme=Default+Light', { waitUntil: 'commit' })
  await expectThemePainted(page, 'Default Light')
  release()
  await expect(selectedTheme(page)).toHaveText('Default Light')
})

test("another tab's theme change doesn't replace an active override", async ({ page, newTab }) => {
  await seedSettings(page, { themeName: 'Default Light' })
  await page.goto('/?theme=Dracula')
  await expect(selectedTheme(page)).toHaveText('Dracula')
  await countStorageEvents(page)

  const other = await newTab()
  await other.goto('/')
  await pickTheme(other, 'Nord')
  await expectThemePainted(other, 'Nord')

  // B's save reached A as a storage event; A keeps the override
  await expect.poll(() => storageEvents(page)).toBeGreaterThan(0)
  await expect(selectedTheme(page)).toHaveText('Dracula')
  await expectThemePainted(page, 'Dracula')
})

test.describe('fixture option', () => {
  test.use({ theme: 'Solarized Light' })

  test('`theme` runs the test in that theme without saving it', async ({ page }) => {
    await page.goto('/shows')
    await expect(selectedTheme(page)).toHaveText('Solarized Light')
    await expectThemePainted(page, 'Solarized Light')
    expect(await storedSettings(page)).toBeNull()
  })
})
