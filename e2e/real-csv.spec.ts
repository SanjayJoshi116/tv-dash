import { existsSync } from 'node:fs'
import { test, expect, content } from './fixtures'

// Smoke test against the real public/tv_series.csv. It's gitignored (personal data), so this
// skips in CI and on fresh clones. `csv: null` = no interception; console errors still fail it.
test.skip(!existsSync('public/tv_series.csv'), 'public/tv_series.csv not present')
test.use({ csv: null })

test('real CSV loads cleanly on every page', async ({ page }) => {
  for (const path of ['/shows', '/stats', '/']) {
    await page.goto(path)
    await expect(content(page)).not.toBeEmpty()
  }
  await expect(page.getByText('Highlights')).toBeVisible()
  await expect(page.locator('.ant-alert-warning'), 'skipped-rows banner').toHaveCount(0)
  await expect(page.getByRole('button', { name: /^(Most Watched|Top Rated|Newest Release): / })).toHaveCount(3)
})
