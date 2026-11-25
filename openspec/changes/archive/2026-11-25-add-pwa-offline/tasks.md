## 1. Setup

- [x] 1.1 Add `vite-plugin-pwa` (dev dependency; confirm Vite 5 support), then `npx -y npm@10 install` per the Lock File rule; check `grep vitest/node_modules/esbuild package-lock.json`
- [x] 1.2 Generate icons (192, 512, 512 maskable) from `public/tv.svg` into `public/`; add `<meta name="theme-color">` to `index.html`
- [x] 1.3 `.gitignore`: `dev-dist/`

## 2. Service worker + manifest

- [x] 2.1 `vite.config.ts`: `VitePWA({ registerType: 'prompt', injectRegister: false, manifest: {...}, workbox: { globPatterns, navigateFallback: '/index.html', runtimeCaching: [NetworkFirst for /tv_series.csv, 3s timeout, maxEntries 1] } })`; manifest colors from `themes.ts`
- [x] 2.2 `npm run build`: `dist/` contains `sw.js` and `manifest.webmanifest`; `tv_series.csv` not in the precache list

## 3. Shell UI

- [x] 3.1 `useOnlineStatus()` hook (`useSyncExternalStore`) + jsdom test
- [x] 3.2 `UpdatePrompt` component (`useRegisterSW`, antd `notification` with Reload) mounted in `AppLayout`
- [x] 3.3 Offline `Alert` in `AppLayout` above `CsvWarningBanner` while offline
- [x] 3.4 Theme document-sync effect sets `meta[name=theme-color]` `content` to `headerBg`

## 4. E2E (production build)

- [x] 4.1 `playwright.config.ts`: `pwa` project with its own `webServer` (`vite build && vite preview --port 4199`), `serviceWorkers: 'allow'`; decide CSV seeding (context-level route vs temp public CSV) and document it in the spec file header
- [x] 4.2 `e2e/pwa.spec.ts`: manifest link + fields; SW registered
- [x] 4.3 Visit online → `context.setOffline(true)` → reload → Dashboard loads with cached data; navigate to Shows, Statistics, a Show Detail deep link; offline notice visible; back online → notice gone
- [x] 4.4 Theme switch updates `meta[name=theme-color]`
- [x] 4.5 CI: run the `pwa` project in the `e2e` job (after the default project)

## 5. Docs

- [x] 5.1 `README.md`: install / offline section, troubleshooting (clear site data), CSV cached locally note
- [x] 5.2 `CLAUDE.md`: PWA section (prompt updates, CSV network-first, no poster caching, prod-only SW, `pwa` e2e project), Tests list
- [x] 5.3 `features.txt`, `IDEAS.md` (move "Installable PWA / offline" to Completed), `CHANGELOG.md`
- [x] 5.4 Run `npm run lint`, `npm test`, `npm run build`, `npm run e2e`
