import { defineConfig, devices } from '@playwright/test'
import base from './playwright.config'

// `npm run e2e:pwa`: e2e/pwa.spec.ts against a production build — the service worker only exists
// there. Separate from playwright.config.ts so ordinary e2e runs never pay for the build.
const PORT = 4199

export default defineConfig({
  ...base,
  testMatch: 'pwa.spec.ts',
  use: { ...base.use, baseURL: `http://localhost:${PORT}` },
  projects: [
    {
      name: 'pwa',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1400, height: 900 }, serviceWorkers: 'allow' },
    },
  ],
  webServer: {
    // Never reused: a stale preview would test an old build
    command: `npx vite build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
