import { test, expect, content, expectDocTheme, expectThemePainted, holdRoute, markNoReload, pickTheme, rgb, saveTheme, selectedTheme, stillNoReload, themeSelect } from './fixtures'
import { THEMES } from '../src/themes'
import { SETTINGS_KEY } from '../src/utils/settings'

// contentBg as the computed rgb() string
const BG = {
  dark: rgb(THEMES['Default Dark'].contentBg),
  light: rgb(THEMES['Default Light'].contentBg),
  dracula: rgb(THEMES['Dracula'].contentBg),
}

test('dev server serves index.html with the theme boot script', async ({ request }) => {
  const html = await (await request.get('/')).text()
  expect(html).toContain(SETTINGS_KEY)
  expect(html.indexOf(SETTINGS_KEY)).toBeLessThan(html.indexOf('/src/main.tsx'))
  // after <meta charset> — browsers only look for it in the first 1024 bytes
  expect(html.indexOf('charset')).toBeLessThan(html.indexOf(SETTINGS_KEY))
})

test.describe('System theme follows the OS', () => {
  test('light OS, nothing saved → Default Light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await expect(selectedTheme(page)).toHaveText('System')
    await expectDocTheme(page, 'light', BG.light)
    await expect(content(page)).toHaveCSS('background-color', BG.light)
  })

  test('dark OS, nothing saved → Default Dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await expect(selectedTheme(page)).toHaveText('System')
    await expectDocTheme(page, 'dark', BG.dark)
    await expect(content(page)).toHaveCSS('background-color', BG.dark)
  })

  test('OS switch is followed live while System is selected', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await expectDocTheme(page, 'light', BG.light)
    await markNoReload(page)
    await page.emulateMedia({ colorScheme: 'dark' })
    await expectDocTheme(page, 'dark', BG.dark)
    await expect(content(page)).toHaveCSS('background-color', BG.dark)
    await page.emulateMedia({ colorScheme: 'light' })
    await expectDocTheme(page, 'light', BG.light)
    expect(await stillNoReload(page)).toBe(true)
  })

  test('saved Dracula ignores OS switches', async ({ page }) => {
    await saveTheme(page, 'Dracula')
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await expect(selectedTheme(page)).toHaveText('Dracula')
    await expectDocTheme(page, 'dark', BG.dracula)
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.emulateMedia({ colorScheme: 'light' })
    await expectDocTheme(page, 'dark', BG.dracula)
    await expect(content(page)).toHaveCSS('background-color', BG.dracula)
  })

  test('corrupt saved value → System', async ({ page }) => {
    await saveTheme(page, 'constructor')
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await expect(selectedTheme(page)).toHaveText('System')
    await expectDocTheme(page, 'light', BG.light)
  })
})

test('first paint with ?reset ignores the saved theme (System from the start)', async ({ page }) => {
  await saveTheme(page, 'Dracula')
  await page.emulateMedia({ colorScheme: 'light' })
  const release = await holdRoute(page, '**/src/main.tsx')
  await page.goto('/?reset', { waitUntil: 'commit' })
  await expectDocTheme(page, 'light', BG.light) // not Dracula's dark, even before the bundle
  await expect(page.locator('#root')).toBeEmpty()
  release()
  await expect(selectedTheme(page)).toHaveText('System')
})

test('first paint: saved Default Light applies before the app bundle runs', async ({ page }) => {
  await saveTheme(page, 'Default Light')
  await page.emulateMedia({ colorScheme: 'dark' }) // OS disagrees — the saved theme must win
  const release = await holdRoute(page, '**/src/main.tsx')
  await page.goto('/', { waitUntil: 'commit' })
  await expectDocTheme(page, 'light', BG.light)
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', THEMES['Default Light'].headerBg)
  await expect(page.locator('#root')).toBeEmpty() // app has not mounted yet
  release()
  await expect(selectedTheme(page)).toHaveText('Default Light')
  await expectDocTheme(page, 'light', BG.light)
})

test('selector lists System first, Custom last; a chosen theme persists across reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await themeSelect(page).click()
  const options = page.locator('.ant-select-item-option')
  await expect(options).toHaveText(['System', ...Object.keys(THEMES), 'Custom'])
  await options.filter({ hasText: 'Default Light' }).click()
  await expectDocTheme(page, 'light', BG.light)
  await page.reload()
  await expect(selectedTheme(page)).toHaveText('Default Light')
  await expectDocTheme(page, 'light', BG.light)
})

// Added built-in themes: pick each in the selector, open Statistics (charts render without console
// errors — the fixture fails on any), document background = the theme's contentBg
for (const name of ['High Contrast', 'OLED Black', 'Nord', 'Solarized Light'] as const) {
  test(`${name}: selectable, renders Statistics, persists`, async ({ page }) => {
    await page.goto('/stats')
    await pickTheme(page, name)
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible()
    await expectThemePainted(page, name)
    await page.reload()
    await expect(selectedTheme(page)).toHaveText(name)
    await expectThemePainted(page, name)
  })
}
