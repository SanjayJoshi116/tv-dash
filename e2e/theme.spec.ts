import type { Page } from '@playwright/test'
import { test, expect, content, holdRoute, selectedTheme, themeSelect } from './fixtures'
import { THEMES } from '../src/themes'
import { SETTINGS_KEY } from '../src/utils/settings'

// contentBg as the computed rgb() string
function rgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}
const BG = {
  dark: rgb(THEMES['Default Dark'].contentBg),
  light: rgb(THEMES['Default Light'].contentBg),
  dracula: rgb(THEMES['Dracula'].contentBg),
}

async function expectDocTheme(page: Page, scheme: 'dark' | 'light', bg: string) {
  const html = page.locator('html')
  await expect(html).toHaveCSS('color-scheme', scheme)
  await expect(html).toHaveCSS('background-color', bg)
}

// Runs before every page load (incl. reloads) — use only where the saved value must stay fixed
async function saveTheme(page: Page, themeName: string) {
  await page.addInitScript(([key, name]) => localStorage.setItem(key, JSON.stringify({ themeName: name })), [SETTINGS_KEY, themeName] as const)
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
    await page.evaluate(() => { (window as unknown as { __noReload: boolean }).__noReload = true })
    await page.emulateMedia({ colorScheme: 'dark' })
    await expectDocTheme(page, 'dark', BG.dark)
    await expect(content(page)).toHaveCSS('background-color', BG.dark)
    await page.emulateMedia({ colorScheme: 'light' })
    await expectDocTheme(page, 'light', BG.light)
    expect(await page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload)).toBe(true)
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
  await expect(page.locator('#root')).toBeEmpty() // app has not mounted yet
  release()
  await expect(selectedTheme(page)).toHaveText('Default Light')
  await expectDocTheme(page, 'light', BG.light)
})

test('selector lists System first; a chosen theme persists across reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await themeSelect(page).click()
  const options = page.locator('.ant-select-item-option')
  await expect(options).toHaveText(['System', ...Object.keys(THEMES)])
  await options.filter({ hasText: 'Default Light' }).click()
  await expectDocTheme(page, 'light', BG.light)
  await page.reload()
  await expect(selectedTheme(page)).toHaveText('Default Light')
  await expectDocTheme(page, 'light', BG.light)
})
