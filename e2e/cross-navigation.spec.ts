import { test, expect, content, showCardNames, showCards, type Page } from './fixtures'

// TEST_CSV: all 6 shows are Drama + Ended; Alpha is also "Sci-Fi & Fantasy" and has the keyword
// `javascript:alert(1)`; every show has actors "A" / "B" and creator "Someone" on network "Net".
const chips = (page: Page) => content(page).locator('.ant-card', { has: page.locator('#shows-search') }).locator('.ant-tag').evaluateAll(els => els.map(e => e.textContent?.trim()))
const link = (page: Page, name: string) => content(page).getByRole('link', { name, exact: true })

async function openShow(page: Page, id: number, name: string) {
  await page.goto(`/shows/${id}`)
  await expect(page.locator('.ant-layout-content h3').first()).toHaveText(name)
}

test('a genre tag opens Shows filtered to only that genre', async ({ page }) => {
  await openShow(page, 3, 'Fraction')
  await link(page, 'Shows in genre Drama').click()
  await expect(page).toHaveURL(/\/shows\?genre=Drama$/)
  await expect(showCards(page)).toHaveCount(6)
  expect(await chips(page)).toEqual(['Drama'])
})

test('"Sci-Fi & Fantasy" arrives exactly', async ({ page }) => {
  await openShow(page, 1, 'Alpha')
  await link(page, 'Shows in genre Sci-Fi & Fantasy').click()
  await expect(page).toHaveURL(/\/shows\?genre=Sci-Fi\+%26\+Fantasy$/)
  await expect(showCards(page)).toHaveCount(1)
  expect(await chips(page)).toEqual(['Sci-Fi & Fantasy'])
})

test('an actor opens a search that includes the show it came from', async ({ page }) => {
  await openShow(page, 3, 'Fraction')
  await content(page).getByRole('link', { name: 'Shows matching A' }).first().click()
  await expect(page).toHaveURL(/\/shows\?q=A$/)
  await expect(page.locator('#shows-search')).toHaveValue('A')
  expect(await showCardNames(page)).toContain('Fraction')
})

test('the status tag opens Shows filtered to that status', async ({ page }) => {
  await openShow(page, 3, 'Fraction')
  await link(page, 'Shows with status Ended').click()
  await expect(page).toHaveURL(/\/shows\?status=Ended$/)
  await expect(showCards(page)).toHaveCount(6)
})

test('a keyword link works from the keyboard', async ({ page }) => {
  await openShow(page, 3, 'Fraction')
  const kw = link(page, 'Shows matching kw')
  await kw.focus()
  await expect(kw).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/shows\?q=kw$/)
  await expect(page.locator('#shows-search')).toHaveValue('kw')
})

test('Ctrl-click opens the filtered list in a new tab and keeps the show', async ({ page }) => {
  await openShow(page, 3, 'Fraction')
  const [tab] = await Promise.all([
    page.context().waitForEvent('page'),
    link(page, 'Shows in genre Drama').click({ modifiers: ['Control'] }),
  ])
  await tab.waitForLoadState('domcontentloaded')
  expect(new URL(tab.url()).pathname + new URL(tab.url()).search).toBe('/shows?genre=Drama')
  await expect(page).toHaveURL(/\/shows\/3$/)
  await tab.close()
})

test('the Dashboard Drama bar count equals the listed count', async ({ page }) => {
  await page.goto('/')
  const bar = content(page).getByRole('link', { name: /shows in genre Drama$/ })
  const label = await bar.getAttribute('aria-label')
  const count = Number(label?.match(/^(\d+) shows/)?.[1])
  expect(count).toBe(6)
  await bar.click()
  await expect(page).toHaveURL(/\/shows\?genre=Drama$/)
  await expect(showCards(page)).toHaveCount(count)
})

test('a hostile keyword is only search text: no script, href stays on /shows', async ({ page }) => {
  page.on('dialog', d => { throw new Error(`unexpected dialog: ${d.message()}`) })
  await openShow(page, 1, 'Alpha')
  const hostile = link(page, 'Shows matching javascript:alert(1)')
  expect(await hostile.getAttribute('href')).toBe('/shows?q=javascript%3Aalert%281%29')
  await hostile.click()
  await expect(page).toHaveURL(/\/shows\?q=javascript%3Aalert%281%29$/)
  await expect(page.locator('#shows-search')).toHaveValue('javascript:alert(1)')
  expect(await showCardNames(page)).toEqual(['Alpha'])
})
