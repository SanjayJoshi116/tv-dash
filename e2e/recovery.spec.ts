import type { Page } from '@playwright/test'
import { test, expect, allowProvokedErrors, crashModule, themeSelect } from './fixtures'
import { SETTINGS_KEY, SIDEBAR_KEY } from '../src/utils/settings'


const SETTINGS = JSON.stringify({ themeName: 'Dracula', filters: { search: 'frac' } })

async function seedSettingsAndSidebar(page: Page) {
  await page.goto('/')
  await page.evaluate(([keys, s]) => {
    localStorage.setItem(keys[0], s)
    localStorage.setItem(keys[1], 'true')
  }, [[SETTINGS_KEY, SIDEBAR_KEY], SETTINGS] as const)
}

const stored = (page: Page) =>
  page.evaluate(keys => keys.map(k => localStorage.getItem(k)), [SETTINGS_KEY, SIDEBAR_KEY])

test.describe('shell crash → recovery screen', () => {
  // + RootErrorBoundary's own console.error
  test.use({ allowConsoleErrors: allowProvokedErrors('boom: shell crash|App shell render failed') })

  test.beforeEach(async ({ page }) => {
    await seedSettingsAndSidebar(page)
    await crashModule(page, 'components/AppLayout.tsx', 'AppLayout', 'throw new Error("boom: shell crash")')
    await page.reload()
  })

  test('shows the message and both actions instead of a blank page', async ({ page }) => {
    const screen = page.getByRole('alert')
    await expect(screen).toContainText("TV Dashboard couldn’t start")
    await expect(screen).toContainText('boom: shell crash')
    await expect(page.getByRole('button', { name: 'Reload' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reset saved settings' })).toBeVisible()
    await expect(page.locator('.ant-layout')).toHaveCount(0)
  })

  test('"Reload" reloads and keeps saved settings', async ({ page }) => {
    await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Reload' }).click()])
    await expect(page.getByRole('alert')).toContainText('boom: shell crash')
    expect(await stored(page)).toEqual([SETTINGS, 'true'])
  })

  test('"Reset saved settings" clears both keys and reloads', async ({ page }) => {
    await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Reset saved settings' }).click()])
    await expect(page.getByRole('alert')).toBeVisible() // module still broken — but storage is clean
    expect(await stored(page)).toEqual([null, null])
  })
})

test('?reset clears saved settings before the app starts and drops only that param', async ({ page }) => {
  await seedSettingsAndSidebar(page)
  await page.goto('/shows?reset&foo=1')
  await expect(page).toHaveURL(/\/shows\?foo=1$/)
  await expect(page.locator('#shows-search')).toHaveValue('')
  await expect(themeSelect(page)).toContainText('System')
  // Saved search 'frac' would leave 1 card — all 5 means the filters were reset
  await expect(page.locator('.ant-layout-content [role=button][aria-label]')).toHaveCount(6)
  expect(await stored(page)).toEqual([null, null])
})

test.describe('page crash', () => {
  test.use({ allowConsoleErrors: allowProvokedErrors('boom: page crash') })

  test('stays in the layout (PageError), not the recovery screen', async ({ page }) => {
    await crashModule(page, 'pages/ShowsPage.tsx', 'ShowsPage', 'throw new Error("boom: page crash")')
    await page.goto('/shows')
    await expect(page.locator('.ant-alert-error')).toContainText('boom: page crash')
    await expect(page.locator('.ant-layout-header')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reset saved settings' })).toHaveCount(0)
  })
})
