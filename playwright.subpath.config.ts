import { defineConfig, devices } from '@playwright/test'
import base from './playwright.config'

// `npm run e2e:subpath`: e2e/subpath.spec.ts against a production build with base `/sub/`
// (as for GitHub Pages at /<repo>/). Separate from playwright.config.ts so ordinary e2e runs never
// pay for the build. `vite preview` serves index.html for unknown paths — the SPA fallback.
const PORT = 5299
export const SUBPATH = '/sub/'

export default defineConfig({
  ...base,
  testMatch: 'subpath.spec.ts',
  use: { ...base.use, baseURL: `http://localhost:${PORT}` },
  projects: [
    // Service workers blocked: a controlling SW fetches the CSV itself, past page.route (one test
    // opts back in to check the registration scope)
    { name: 'subpath', use: { ...devices['Desktop Chrome'], viewport: { width: 1400, height: 900 }, serviceWorkers: 'block' } },
  ],
  webServer: {
    // Never reused: a stale preview would test an old build
    command: `npx vite build --base=${SUBPATH} --outDir dist-sub && npx vite preview --outDir dist-sub --base=${SUBPATH} --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}${SUBPATH}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
