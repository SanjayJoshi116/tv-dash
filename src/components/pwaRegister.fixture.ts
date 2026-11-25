// Vitest stand-in for `virtual:pwa-register/react` (aliased in vitest.config.ts): Vitest's module
// runner can't load the plugin's virtual module id. Same as the plugin's dev stub — no service
// worker, never an update.
import type { useRegisterSW as UseRegisterSW } from 'virtual:pwa-register/react'

const noop = () => {}

export const useRegisterSW: typeof UseRegisterSW = () => ({
  needRefresh: [false, noop],
  offlineReady: [false, noop],
  updateServiceWorker: async () => {},
})
