import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

// Reuses vite.config.ts (plugins etc.) so tests and build can't drift apart.
// Default env is node — DOM tests opt in with a `// @vitest-environment jsdom` docblock.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      globals: true,
      setupFiles: ['./src/setupTests.ts'],
    },
  })
)
