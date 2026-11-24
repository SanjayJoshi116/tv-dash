import { defineConfig, devices } from '@playwright/test'

// Browser e2e suite (`npm run e2e`). Tests serve their own CSV via route interception
// (e2e/fixtures.ts) — only the "real CSV" smoke test reads public/tv_series.csv, and skips
// itself when that file is absent (it's gitignored, so CI has none).
const PORT = 5199

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // A fresh dev server compiles each route on first request; with parallel workers the first
  // Dashboard / Stats loads can take longer than the 5s default
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1400, height: 900 } } }],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
