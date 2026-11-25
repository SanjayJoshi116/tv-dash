import { defineConfig, mergeConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import viteConfig from './vite.config'

// Reuses vite.config.ts (plugins etc.) so tests and build can't drift apart.
// Default env is node — DOM tests opt in with a `// @vitest-environment jsdom` docblock.
export default mergeConfig(
  viteConfig,
  defineConfig({
    resolve: {
      // vite-plugin-pwa's virtual module id isn't loadable by Vitest's module runner
      alias: { 'virtual:pwa-register/react': fileURLToPath(new URL('./src/components/pwaRegister.fixture.ts', import.meta.url)) },
    },
    test: {
      environment: 'node',
      globals: true,
      // Unit tests only — e2e/*.spec.ts belongs to Playwright (`npm run e2e`)
      include: ['src/**/*.test.{ts,tsx}'],
    },
  })
)
