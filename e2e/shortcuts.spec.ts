import type { Page } from '@playwright/test'
import { test, expect, CSV_GLOB, header, holdRoute, seedSettings, selectedTheme, sidebarItem } from './fixtures'
import { SHOWS_SEARCH_ID } from '../src/utils/searchFocus'

// Global keyboard shortcuts (useHotkeys via GlobalShortcuts). Timing / modifier / IME rules are
// unit-tested in useHotkeys.test.ts; this covers the wiring in the real app.

const search = (page: Page) => page.locator(`#${SHOWS_SEARCH_ID}`)

async function open(page: Page, path: string, ready: (page: Page) => Promise<void>) {
  await page.goto(path)
  await ready(page)
}
const dashboardReady = (page: Page) => expect(page.getByText('Highlights')).toBeVisible()

test('g s / g t / g d navigate between pages', async ({ page }) => {
  await open(page, '/', dashboardReady)
  await page.keyboard.press('g')
  await page.keyboard.press('s')
  await expect(page).toHaveURL(/\/shows$/)
  await expect(header(page, 'Shows')).toBeVisible()

  await page.keyboard.press('g')
  await page.keyboard.press('t')
  await expect(page).toHaveURL(/\/stats$/)
  await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible()

  await page.keyboard.press('g')
  await page.keyboard.press('d')
  await expect(page).toHaveURL(/\/$/)
  await dashboardReady(page)
})

test('g t works from Show Detail', async ({ page }) => {
  await open(page, '/shows/1', p => expect(p.locator('.ant-layout-content h3').first()).toHaveText('Alpha'))
  await page.keyboard.press('g')
  await page.keyboard.press('t')
  await expect(page).toHaveURL(/\/stats$/)
})

test('/ from Dashboard opens Shows with the search focused and no "/" typed', async ({ page }) => {
  await open(page, '/', dashboardReady)
  await page.keyboard.press('/')
  await expect(page).toHaveURL(/\/shows$/)
  await expect(search(page)).toBeFocused()
  await expect(search(page)).toHaveValue('')
  // The request is one-shot and nothing is left in history: a reload doesn't refocus
  await page.reload()
  await expect(search(page)).toBeVisible()
  await expect(search(page)).not.toBeFocused()
})

test('/ on Shows focuses the search field', async ({ page }) => {
  await open(page, '/shows', p => expect(search(p)).toBeVisible())
  await page.keyboard.press('/')
  await expect(search(page)).toBeFocused()
  await expect(search(page)).toHaveValue('')
})

test('typing in the search field never triggers shortcuts', async ({ page }) => {
  await open(page, '/shows', p => expect(search(p)).toBeVisible())
  const before = await selectedTheme(page).textContent()
  await search(page).click()
  await page.keyboard.type('gst?/')
  await expect(search(page)).toHaveValue('gst?/')
  await expect(page).toHaveURL(/\/shows$/)
  await expect(selectedTheme(page)).toHaveText(before ?? '')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('t switches to the next theme option and the choice is saved', async ({ page }) => {
  await seedSettings(page, { themeName: 'Default Dark' })
  await page.reload()
  await dashboardReady(page)
  await expect(selectedTheme(page)).toHaveText('Default Dark')

  await page.keyboard.press('t')
  await expect(selectedTheme(page)).toHaveText('Default Light')
  await page.reload()
  await expect(selectedTheme(page)).toHaveText('Default Light')
})

test('? opens the cheat sheet; Escape closes it and restores focus; shortcuts are off meanwhile', async ({ page }) => {
  await open(page, '/', dashboardReady)
  const collapse = page.getByRole('button', { name: 'Collapse sidebar' })
  await collapse.focus()

  await page.keyboard.press('?')
  const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Go to Statistics')
  await expect(dialog).toContainText('Next theme')
  // antd moves focus into the dialog once its open animation ends; Escape is handled there
  await expect.poll(() => dialog.evaluate(d => d.contains(document.activeElement))).toBe(true)

  await page.keyboard.press('g')
  await page.keyboard.press('s')
  await expect(page).toHaveURL(/\/$/)

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(collapse).toBeFocused()
})

test('/ on Shows while its data is still loading focuses the search once it appears', async ({ page }) => {
  const release = await holdRoute(page, CSV_GLOB)
  await page.goto('/shows')
  await expect(header(page, 'Shows')).toBeVisible()
  await expect(search(page)).toHaveCount(0)
  await page.keyboard.press('/')
  release()
  await expect(search(page)).toBeFocused()
  await expect(search(page)).toHaveValue('')
})

test("a / request for a Shows visit that never happened doesn't focus a later one", async ({ page }) => {
  // Held from the first load: otherwise idle prefetch may already have Shows' code, `/` lands on
  // Shows at once and `g t` is typed into the focused search field
  const release = await holdRoute(page, '**/src/pages/ShowsPage.tsx*')
  await open(page, '/', dashboardReady)
  await page.keyboard.press('/')
  // Change of mind before Shows' code arrives: Statistics wins
  await page.keyboard.press('g')
  await page.keyboard.press('t')
  release()
  await expect(page).toHaveURL(/\/stats$/)
  await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible()

  await sidebarItem(page, 'Shows').click()
  await expect(search(page)).toBeVisible()
  await expect(search(page)).not.toBeFocused()
})
