## 1. Loader module

- [x] 1.1 New `src/routes/pageLoaders.ts`: `PageKey`, `PAGE_LOADERS`, `lazy()` page components, memoized `prefetchPage(key)` (cache cleared on rejection), `prefetchAllWhenIdle()` (idle callback + cancel)
- [x] 1.2 Pure `shouldIdlePrefetch(conn)` with a local `NetworkInformation`-like type; `prefetchAllWhenIdle` checks it
- [x] 1.3 `App.tsx` imports lazy pages + `prefetchAllWhenIdle` from the module (effect body becomes one call + cleanup)
- [x] 1.4 Unit tests: `shouldIdlePrefetch` (undefined, saveData, 2g, slow-2g, 4g); `prefetchPage` calls a loader once for repeated calls, retries after a rejection, never throws

## 2. Intent triggers

- [x] 2.1 `AppLayout`: `NAV_KEY_TO_PAGE`; menu item labels prefetch on hover/focus
- [x] 2.2 `BottomNav`: prefetch on `pointerdown` / focus
- [x] 2.3 `ShowCard`, Dashboard `ShowRowCard` and Not Started rows: prefetch Show Detail on hover/focus (module-level handlers; `memo` intact)

## 3. E2E

- [x] 3.1 New `e2e/prefetch.spec.ts`: `addInitScript` defining `navigator.connection = { saveData: true }` → on Dashboard, no request for `ShowsPage` / `StatisticsPage` / `ShowDetailPage` modules after idle; hover "Statistics" menu item → `StatisticsPage` module requested
- [x] 3.2 Shows page with data saver: hover a card → one `ShowDetailPage` request; hover more cards → still one
- [x] 3.3 Without data saver: idle prefetch still requests all page modules (existing behavior)

## 4. Docs

- [x] 4.1 `CLAUDE.md`: prefetch policy + `pageLoaders.ts` location, Tests list
- [x] 4.2 `features.txt` (replace "idle-prefetched after mount" line), `IDEAS.md` (move "Smarter prefetch" to Completed), `CHANGELOG.md`
- [x] 4.3 Run `npm run lint`, `npm test`, `npm run build`, `npm run e2e`
