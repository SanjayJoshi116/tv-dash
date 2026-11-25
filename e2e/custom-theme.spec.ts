import type { Page } from '@playwright/test'
import { test, expect, expectDocTheme, holdRoute, pickTheme, rgb, seedSettings, selectedTheme, storedSettings } from './fixtures'
import { THEMES } from '../src/themes'

// Custom accent theme: picker + base switch, live apply, persistence, first paint.

const accentButton = (page: Page) => page.locator('#theme-accent')
const baseSwitch = (page: Page) => page.locator('#theme-base')
// Dark base: antd's dark Menu fills the selected item with a colorPrimary-derived shade (the
// dark algorithm shifts it, so compare against what a known primary renders, not the raw hex)
const selectedMenuItem = (page: Page) => page.locator('.ant-layout-sider .ant-menu-item-selected')
const menuBg = (page: Page) => selectedMenuItem(page).evaluate(el => getComputedStyle(el).backgroundColor)
const channels = (css: string) => (css.match(/\d+/g) ?? []).slice(0, 3).map(Number)

async function seedSettingsReloaded(page: Page, settings: Record<string, unknown>) {
  await seedSettings(page, settings)
  await page.reload()
}

async function setAccent(page: Page, hex: string) {
  await accentButton(page).click()
  const input = page.locator('.ant-color-picker-input input').first()
  await input.fill(hex.replace('#', ''))
  await input.press('Enter')
  await page.locator('.ant-layout-header h4').click()
  await expect(page.locator('.ant-popover:visible')).toHaveCount(0)
}


test('Custom shows the picker + base switch only while selected', async ({ page }) => {
  await page.goto('/')
  await expect(accentButton(page)).toHaveCount(0)
  await pickTheme(page, 'Custom')
  await expect(accentButton(page)).toBeVisible()
  await expect(baseSwitch(page)).toBeVisible()
  await pickTheme(page, 'Dracula')
  await expect(accentButton(page)).toHaveCount(0)
  await expect(baseSwitch(page)).toHaveCount(0)
})

test('an accent applies live and survives a reload', async ({ page }) => {
  await page.goto('/')
  await pickTheme(page, 'Custom')
  const defaultBg = await menuBg(page) // Custom's default accent = Default Dark's primary
  await setAccent(page, '#e11d48')
  // Applied live: the selection turns red
  await expect.poll(async () => { const [r, g, b] = channels(await menuBg(page)); return r > 150 && g < 80 && b < 120 }).toBe(true)
  const accentBg = await menuBg(page)
  expect(accentBg).not.toBe(defaultBg)
  await expect.poll(() => storedSettings(page)).toMatchObject({ themeName: 'Custom', customTheme: { accent: '#e11d48', base: 'dark' } })

  await page.reload()
  await expect(selectedTheme(page)).toHaveText('Custom')
  await expect(accentButton(page)).toHaveAttribute('aria-label', 'Accent color #e11d48')
  await expect(selectedMenuItem(page)).toHaveCSS('background-color', accentBg)
})

test('the base switch changes surfaces and color scheme, keeping the accent', async ({ page }) => {
  await seedSettingsReloaded(page, { themeName: 'Custom', customTheme: { accent: '#e11d48', base: 'dark' } })
  await expectDocTheme(page, 'dark', rgb(THEMES['Default Dark'].contentBg))
  await baseSwitch(page).getByText('Light').click()
  await expectDocTheme(page, 'light', rgb(THEMES['Default Light'].contentBg))
  await expect(accentButton(page)).toHaveAttribute('aria-label', 'Accent color #e11d48')
  await expect.poll(() => storedSettings(page)).toMatchObject({ customTheme: { accent: '#e11d48', base: 'light' } })
})

test('leaving Custom and coming back restores accent and base', async ({ page }) => {
  await seedSettingsReloaded(page, { themeName: 'Custom', customTheme: { accent: '#e11d48', base: 'light' } })
  await pickTheme(page, 'Dracula')
  await pickTheme(page, 'Custom')
  await expect(accentButton(page)).toHaveAttribute('aria-label', 'Accent color #e11d48')
  await expectDocTheme(page, 'light', rgb(THEMES['Default Light'].contentBg))
})

test('a corrupt saved accent falls back to the base primary', async ({ page }) => {
  await seedSettingsReloaded(page, { themeName: 'Default Dark' })
  const defaultDarkBg = await menuBg(page)
  await seedSettingsReloaded(page, { themeName: 'Custom', customTheme: { accent: 'javascript:alert(1)', base: 'dark' } })
  await expect(selectedTheme(page)).toHaveText('Custom')
  await expect(accentButton(page)).toHaveAttribute('aria-label', `Accent color ${THEMES['Default Dark'].token.colorPrimary}`)
  await expect(selectedMenuItem(page)).toHaveCSS('background-color', defaultDarkBg)
})

test('first paint: Custom uses its saved base before the app loads', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await seedSettingsReloaded(page, { themeName: 'Custom', customTheme: { accent: '#e11d48', base: 'light' } })
  const release = await holdRoute(page, '**/src/main.tsx*')
  await page.reload({ waitUntil: 'commit' })
  await expectDocTheme(page, 'light', rgb(THEMES['Default Light'].contentBg))
  release()
  await expect(selectedTheme(page)).toHaveText('Custom')
})

test.describe('narrow phone', () => {
  test.use({ viewport: { width: 360, height: 740 } })

  test('Custom controls move into a Customize popover; the header fits', async ({ page }) => {
    await seedSettingsReloaded(page, { themeName: 'Custom', customTheme: { accent: '#e11d48', base: 'dark' } })
    await expect(selectedTheme(page)).toHaveText('Custom')
    await expect(accentButton(page)).toHaveCount(0)
    const customize = page.locator('#theme-customize')
    await expect(customize).toBeInViewport({ ratio: 1 })
    await expect(page.locator('.ant-layout-header .ant-select')).toBeInViewport({ ratio: 1 })

    await customize.click()
    await expect(accentButton(page)).toBeVisible()
    await expect(baseSwitch(page)).toBeVisible()
    await baseSwitch(page).getByText('Light').click()
    await expectDocTheme(page, 'light', rgb(THEMES['Default Light'].contentBg))
  })
})

test('accent presets are listed once each', async ({ page }) => {
  await seedSettingsReloaded(page, { themeName: 'Custom' })
  await accentButton(page).click()
  const swatches = page.locator('.ant-color-picker-presets-color')
  await expect(swatches.first()).toBeVisible()
  const colors = await swatches.evaluateAll(els => els.map(el => getComputedStyle(el.querySelector('*') ?? el).backgroundColor))
  expect(new Set(colors).size).toBe(colors.length)
})
