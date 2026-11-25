## Context

Vite 5 SPA, `BrowserRouter`, data from `/tv_series.csv` (gitignored, personal), posters from `image.tmdb.org`. E2E runs against the Vite dev server (port 5199) with the CSV served by route interception. `useTvData` has a 10s timeout and treats any failure as an error state. Requirements: `specs/offline-support/spec.md`.

## Goals / Non-Goals

**Goals:** installable, offline-capable production build with predictable CSV freshness and user-controlled updates.

**Non-Goals:** offline posters (opaque cross-origin responses are padded to several MB each in Chrome's quota accounting; revisit with stored poster paths / sized URLs); background sync; push; caching in dev.

## Decisions

1. **`vite-plugin-pwa` with `generateSW`** (Workbox), `registerType: 'prompt'`, `injectRegister: false` + `virtual:pwa-register/react` (`useRegisterSW`) in the shell. Verify the plugin version supports Vite 5 (and the planned Vite upgrade) when applying.
   *Alternative:* hand-written service worker — more code to get precache manifests / update flow right; rejected.

2. **Precache** the build (`globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}']`), `navigateFallback: '/index.html'` so deep links (`/shows/12`) work offline. `tv_series.csv` excluded from precache (it's data, and gitignored).

3. **CSV runtime caching:** `NetworkFirst`, `networkTimeoutSeconds: 3`, cache `tvdash-data`, `maxEntries: 1`, statuses `[200]`. The app's own 10s timeout stays as the outer limit. No app-code change is needed for the fallback.

4. **Update prompt:** small shell component (`UpdatePrompt`) using antd `notification` (non-modal) with "Reload" → `updateServiceWorker(true)`. Placed in `AppLayout` next to `CsvWarningBanner`.

5. **Offline notice:** `useOnlineStatus()` (`useSyncExternalStore` on `online`/`offline` events, like `useMediaQuery`); shell shows a compact `Alert` (`type="info"`) "Offline — showing saved data". It's based on `navigator.onLine`, not on whether the CSV came from cache — simpler and good enough for a single data file.

6. **Manifest + icons:** `name: 'TV Dashboard'`, `short_name: 'TV Dash'`, `display: 'standalone'`, `start_url: '/'`, `theme_color` / `background_color` from Default Dark (`headerBg` / `contentBg`, imported from `themes.ts` in `vite.config.ts` like the boot script). Icons: 192, 512 and 512 maskable PNGs generated once from `public/tv.svg` and committed.

7. **`theme-color` meta:** `index.html` gets `<meta name="theme-color">`; the theme document-sync effect (from `add-system-theme-and-color-scheme`) sets its `content` to `headerBg`.

8. **E2E against a production build:** second Playwright project `pwa` with its own `webServer` (`vite build && vite preview --port 4199`) and `serviceWorkers: 'allow'`. `page.route` does not see requests made *by* the service worker, so the synthetic CSV is served with `context.route` (which Chromium applies to SW traffic). The offline test loads online once (SW caches the CSV), then `context.setOffline(true)`.

## Open Questions

- If `context.route` turns out not to intercept SW fetches in the installed Playwright version, serve `TEST_CSV` from a temp copy of `public/` for the preview server instead. Test plumbing only; specs and approach are unchanged.

## Risks / Trade-offs

- [A broken deploy cached by the SW] → `prompt` mode never activates a new SW without the user; `?reset` doesn't clear caches — document "clear site data" in README troubleshooting.
- [Stale CSV shown silently when the network is slow but online] → 3s network timeout falls back to cache; the next load refreshes. Acceptable for a personal dashboard; the offline notice covers the true-offline case.
- [E2E complexity / CI time (extra build)] → Separate project, runs only `pwa` specs; build is ~seconds.
- [Personal CSV persisted in Cache Storage] → Same device/profile scope as localStorage; README notes it.
