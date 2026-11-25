import type { Page } from '@playwright/test'
import { test, expect, themeSelect } from './fixtures'
import { SETTINGS_KEY, SIDEBAR_KEY } from '../src/utils/settings'

// Crashes are forced by serving a throwing module in place of a source file (Vite dev serves
// /src/... as ES modules) — no test hooks in app code. The trailing * covers ?t= / ?v= queries.
async function crashModule(page: Page, file: string, exportName: string, message: string) {
  await page.route(`**/src/${file}*`, r =>
    r.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `export function ${exportName}() { throw new Error(${JSON.stringify(message)}) }`,
    }),
  )
}

const SETTINGS = JSON.stringify({ themeName: 'Dracula', filters: { search: 'frac' } })

async function seedSettings(page: Page) {
  await page.goto('/')
  await page.evaluate(([keys, s]) => {
    localStorage.setItem(keys[0], s)
    localStorage.setItem(keys[1], 'true')
  }, [[SETTINGS_KEY, SIDEBAR_KEY], SETTINGS] as const)
}

const stored = (page: Page) =>
  page.evaluate(keys => keys.map(k => localStorage.getItem(k)), [SETTINGS_KEY, SIDEBAR_KEY])

test.describe('shell crash → recovery screen', () => {
  // React's own report of the caught error + RootErrorBoundary's console.error
  test.use({ allowConsoleErrors: /boom: shell crash|AppLayout|App shell render failed/ })

  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await crashModule(page, 'components/AppLayout.tsx', 'AppLayout', 'boom: shell crash')
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
  await seedSettings(page)
  await page.goto('/shows?reset&foo=1')
  await expect(page).toHaveURL(/\/shows\?foo=1$/)
  await expect(page.locator('#shows-search')).toHaveValue('')
  await expect(themeSelect(page)).toContainText('System')
  // Saved search 'frac' would leave 1 card — all 5 means the filters were reset
  await expect(page.locator('.ant-layout-content [role=button][aria-label]')).toHaveCount(5)
  expect(await stored(page)).toEqual([null, null])
})

test.describe('page crash', () => {
  test.use({ allowConsoleErrors: /boom: page crash|ShowsPage|Route render failed/ })

  test('stays in the layout (RouteErrorBoundary), not the recovery screen', async ({ page }) => {
    await crashModule(page, 'pages/ShowsPage.tsx', 'ShowsPage', 'boom: page crash')
    await page.goto('/shows')
    await expect(page.locator('.ant-alert-error')).toContainText('boom: page crash')
    await expect(page.locator('.ant-layout-header')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reset saved settings' })).toHaveCount(0)
  })
})
