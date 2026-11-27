# Changelog

## [0.4.37] — 2026-11-27

Page structure refactor (OpenSpec `refactor-page-structure`). No behavior change.

### Changed

- **`<DataGate>`** (`src/components/DataGate.tsx`): the one loading → error → data prelude. Dashboard, Shows, Show Detail and Statistics render through it (same spinner tips, same "Failed to load data" + Retry); Dashboard and Shows compute their memos in an inner content component, so they no longer run while loading
- **`DashboardPage` split** (395 → 153 lines) into `src/pages/dashboard/`: `ShowRowCard`, `Highlights`, `ContinueWatching`, `RecentlyWatched`, `SidebarTabs`, `NotStartedList`, `ExploreCards` — data as props, page keeps memos + layout. Same DOM, ids, labels, prefetch, keyboard and reduced-motion handling

### Added (tests)

- `DataGate.test.tsx` (5: loading, error + Retry, data, loading over error); `showFilters.test.ts` `hasActiveFilters` / `clearFilters` / `continueWatching` (5) — 623 unit (after the review fixes), 124 e2e

### Fixed (code review of 0.4.31–0.4.37)

- Shows: saved filters seeded an empty URL again later in the same visit — after paging, clicking Shows in the nav brought the saved filters back instead of the unfiltered view. The seed is now used once per mount (cleared as soon as the URL carries filters)
- Shows: a failed CSV load rewrote a bookmarked `?page=N` to page 1 (the page clamp ran against the empty error state); Retry now lands on the bookmarked page
- Back / Forward scroll restore could be cancelled when Shows corrected its URL in the same frame (e.g. a genre dropped by a data refetch)
- A hand-edited negative Episodes Watched counted as "In progress" (and could divide by zero in Continue Watching's order); it's "Not started" now
- `?genre=Drama&genre=Drama` selected Drama twice (duplicate React keys in the genre select); genres are deduped
- e2e: option labels are regex-escaped (`exactText`), so a label with `(`, `+` or `?` matches literally

### Added (tests, review)

- `showFilters.test.ts` (genre dedupe, negative counts), `shows-url.spec.ts` (seed once per mount, failed load keeps the page — both fail without their fix)

### Simplify pass (0.4.31–0.4.37)

- One `hasActiveFilters` / `clearFilters` in `showFilters.ts` (FilterBar Reset and Shows "Clear filters" had their own copies); Continue Watching ordering is `continueWatching()` there, unit-tested (was inline in the page)
- Dashboard "View all" targets come from `showsLink({ progress })`, not hand-typed `/shows?progress=…`; Continue Watching % via `completionRate`
- `DataGateState` = `Pick` of the context type; `SidebarTabs` memoized (the order toggle no longer re-renders its chart); `renderBar`'s always-passed link made required; `PageKey` imported from `routes/pages` (re-export dropped), page-table helper types un-exported; Shows mount parses the URL once
- Tests: shared `makeSeries` (`src/utils/series.fixture.ts`); e2e `showCards` / `showCardNames` / `continueSection` / `selectById` / `pickOption` / exported `row()` in `fixtures.ts` instead of per-spec copies; `shows-url`'s 60-row CSV built with `row()` instead of string replaces

## [0.4.36] — 2026-11-27

Time left (OpenSpec `add-time-left`).

### Added

- **Time left on Show Detail:** the Watch History card shows "Time left · 3h 20m · 4 episodes" (unwatched episodes × episode runtime) and "Next · Season 3" (lowest unwatched season). Each is hidden when unknown (no runtime / season count) or nothing is left — never a fake zero
- **Continue Watching:** each row adds `· Xh Ym left` when the runtime is known, and a Most watched / Least time left toggle ("finish tonight") picks and orders the six shows; unknown runtime goes last. Per visit, not saved

### Added (tests)

- `derive.test.ts` (`episodesLeft`, `minutesLeft`, `nextSeason`, `compareAscNullsLast` — 8), e2e `time-left.spec.ts` (6: Show Detail lines shown / hidden, toggle order + not saved, row text stays inside the card at 375 / 768 / 1280px) — 612 unit, 122 e2e

## [0.4.35] — 2026-11-25

Cross-navigation links (OpenSpec `add-cross-navigation-links`).

### Added

- **Show Detail is no longer a dead end:** genre and status tags open Shows filtered to them; network, creator (now one link per name), actor and keyword tags open Shows searched for that name (the show you came from is always in the result)
- **Dashboard bars are links:** each Top Genres / Watch Status row opens Shows filtered to that genre / status — the listed count matches the bar
- Real links (`FilterLink`): Tab + Enter, Ctrl / middle-click opens a new tab, visible focus outline, underline on hover, Shows code prefetched on hover / focus

### Security

- Link targets come only from `showsLink()` — the fixed `/shows` path with the data value percent-encoded into the query string, so a value such as `javascript:alert(1)` or `a&genre=b#x` arrives as literal search / filter text. Documented as the one exception to "no `href` from CSV data"; pinned by unit tests and an e2e hostile-keyword test

### Added (tests)

- `showsLink.test.ts` (3), e2e `cross-navigation.spec.ts` (8) + a sub-path link case; `TEST_CSV` Alpha gains genre `Sci-Fi & Fantasy` and keyword `javascript:alert(1)` — 604 unit, 116 + 8 sub-path e2e

## [0.4.34] — 2026-11-25

Progress filter (OpenSpec `add-progress-filter`).

### Added

- **Progress filter on Shows:** Not started / In progress / Completed (select, chip, `?progress=`, saved with the other filters, cleared by Reset; older saved filters load as All). One definition, `progressOf`, shared with the Dashboard
- **Dashboard "View all":** Not Started opens Shows filtered to Not started (was the whole catalogue); Continue Watching gets a "View all" for every in-progress show (not just the top 6)
- **"Clear filters" on an empty Shows result** (keeps the sort order)

### Changed

- FilterBar columns rebalanced for five controls: one row from `xl` (1200px), 2 + 3 rows from `sm` to `lg` (one row at `md` / `lg` truncated every label)
- e2e `TEST_CSV` gains a completed show (Finished) — card counts 5 → 6

### Added (tests)

- `showFilters.test.ts` progress cases (4), e2e `progress-filter.spec.ts` (6) — 601 unit, 108 e2e

## [0.4.33] — 2026-11-25

Shows view state in the URL (OpenSpec `shows-url-state`).

### Added

- **Shareable Shows views:** search, genres, status, sort, page and page size are in the query string (`?q=`, repeated `?genre=`, `?status=`, `?sort=`, `?page=`, `?size=`; defaults omitted, so plain `/shows` is the unfiltered first page). A link's filters win over saved filters; an empty `/shows` is filled from the saved ones without an extra history entry
- **Back undoes Shows changes:** genre / status / sort / page / page-size changes and Reset add a history entry; typing a search updates the current one (one Back step, not one per letter)
- **Scroll restored on Back / Forward** on every page (`useScrollRestoration`, per history entry); other navigation still starts at the top
- Invalid or stale URL values (unknown sort, bad page / size, a genre or status no show has, a page past the end) are corrected in place

### Changed

- Saved Shows filters apply in another tab on its next visit to Shows *without* filter params (a filtered URL shows its own); page / page size are never saved
- e2e `spaNavigate` pushes a router-style history state (own `key`)

### Added (tests)

- `showFilters.test.ts` URL codec (7), `App.test` `/shows?q=` route, e2e `shows-url.spec.ts` (10), a settings-sync and a sub-path case — 597 unit, 102 + 4 PWA + 7 sub-path e2e

## [0.4.32] — 2026-11-25

Refactor, no behavior change (OpenSpec `extract-show-filtering`).

### Changed

- **Shows filtering is a pure module:** `src/utils/showFilters.ts` — saved-filter validation (`parseFilters`), search index, stale genre / status cleanup, filter + sort (`filterAndSortShows`). `ShowsPage` keeps state, the debounced save and memo wiring

### Added

- `showFilters.test.ts` — 19 tests (search fields, AND genres, status, stale values, every sort, no mutation) — 589 unit

## [0.4.31] — 2026-11-25

Refactor, no behavior change (OpenSpec `single-route-table`).

### Changed

- **One page table:** `src/routes/pages.ts` `PAGES` (key, path, code loader, optional nav label + icon) replaces three hand-synced lists — `App`'s page routes, `AppLayout`'s `NAV_ITEMS` and `PAGE_LOADERS` are derived from it. A new page is one row
- **`showLinkProps(tvId, navigate)`** (`src/utils/showLink.ts`): the shared click / Enter / Space / prefetch / `role` props of `ShowCard`, Dashboard's show cards and the Not Started rows

### Added

- `pages.test.ts` (table invariants), `showLink.test.ts` — 570 unit, 101 e2e (91 + 4 PWA + 6 sub-path)

## [0.4.30] — 2026-11-25

Fixes from a code review of 0.4.24–0.4.29.

### Fixed

- **Custom theme readability:** a too-pale / too-dark accent no longer becomes an invisible `colorPrimary` (progress bars, highlights, nav progress bar, area / rating charts, active bottom-nav item): the primary is chart color 0 — the accent when ≥ 3:1 on the base, else its corrected shade. The picker still shows the exact color
- **Primary-button text contrast in every theme:** antd draws it in fixed white — ~1.9:1 on High Contrast's yellow, also below 4.5:1 on Dracula, Nord, Solarized Light and pale Custom accents. New `src/antdTheme.ts` (`antdThemeConfig`) sets `colorTextLightSolid` to white or black against the primary antd actually renders (`getDesignToken`; the dark algorithm shifts it)
- **Cross-tab race:** another tab's unrelated save within the 300ms Custom save delay no longer reverts this tab's accent (and leaves the tabs disagreeing)
- **Router leak:** the data router is created in a mount effect and disposed on cleanup (StrictMode's extra router stayed subscribed to `popstate`)
- **`/` shortcut:** works on Shows while it's still loading; a request whose Shows visit never happened is dropped when the app lands elsewhere
- **Relative base (`--base=./`):** resolved once against the page URL (`resolveBase`), so the router basename and CSV URL are correct
- **Narrow phones:** with Custom selected, the accent picker + base switch move into a "Customize" popover below `md` (the header overflowed at 320–360px)
- Accent presets no longer list `#6366f1` twice

### Added

- Theme contract: `colorPrimary` ≥ 3:1 vs background and primary-button text ≥ 4.5:1 on the rendered primary, for every theme and 7 Custom samples; `ThemeContext.test.tsx` (Custom save / cross-tab race), `paths.test.ts` (`resolveBase`), `readableTextOn` tests; e2e for `/` while Shows loads, a stale `/` request, the narrow-phone Customize popover and deduped presets — 562 unit, 101 e2e (91 + 4 PWA + 6 sub-path)

## [0.4.29] — 2026-11-25

OpenSpec change `support-subpath-hosting` implemented and archived (`openspec/changes/archive/2026-11-25-support-subpath-hosting`). New main spec `subpath-hosting`. No changes open.

### Added

- **Sub-path hosting:** `vite build --base=/<path>/` is the only change needed to serve the app under a path (e.g. GitHub Pages at `/tv-dash/`). Router `basename` and the CSV URL come from `import.meta.env.BASE_URL` (`src/constants/paths.ts`); root deploys unchanged
- `npm run build:pages` (`--base=/tv-dash/` + `scripts/copy-404.mjs`: `dist/index.html` → `404.html`, GitHub Pages' deep-link fallback); README "Deploying under a sub-path"
- `npm run e2e:subpath` (`playwright.subpath.config.ts`, `e2e/subpath.spec.ts`, 6): `--base=/sub/` build + `vite preview` — data only from `/sub/`, navigation + highlight, deep link, not-found, manifest + icons, service worker scope. CI step added; `dist-sub/` gitignored
- 485 unit (484 after the simplify pass below), 97 e2e (87 + 4 PWA + 6 sub-path)

### Changed

- PWA config made base-relative: manifest `start_url` / `scope` from the plugin (= base), relative icon `src`s, `navigateFallback: 'index.html'`, CSV cache pattern `endsWith('/tv_series.csv')`
- e2e: `CSV_GLOB` (from `src/constants/csvFile.ts`) replaces three hand-typed `**/tv_series.csv` globs; `useTvData.test` checks the fetched URL

### Changed (simplify pass over 0.4.24–0.4.29)

- **Custom theme:** dragging the accent picker no longer re-themes the whole app on every pointer move — the Theme is rebuilt from `useDeferredValue(custom)`. Every Custom change (drag, hex input, preset, base) now saves through one debounced `setCustom` (flushed on unmount) instead of `saveCustom` + save-on-picker-close
- **`/` shortcut:** the "focus Shows search" handoff is a one-shot module request (`src/utils/searchFocus.ts`, with `SHOWS_SEARCH_ID` shared by FilterBar / GlobalShortcuts / ShowsPage) instead of router state that had to be cleared from history — `ShowsPage` no longer uses `useLocation` / `useNavigate`
- `resolveThemeName` no longer has an unused Custom branch / `customBase` parameter (type excludes Custom); `customChartColors` parses the accent once and reuses `hslToHex`; the boot script derives the System pair once; unused exports dropped (`paths.ts` re-export, `NAV_PROGRESS_DELAY_MS`, `withThemeParam`)
- e2e helpers shared in `fixtures.ts` instead of copied per spec: `header`, `sidebarItem`, `expectThemePainted`, `seedSettings` / `storedSettings`, `countStorageEvents` / `storageEvents`, `crashModule`, and `allowProvokedErrors` (crash-spec allowlists no longer list component names) — 484 unit (one obsolete `resolveThemeName` case removed), e2e unchanged

## [0.4.28] — 2026-11-25

OpenSpec change `add-url-theme-override` implemented and archived (`openspec/changes/archive/2026-11-25-add-url-theme-override`). New main spec `theme-url-override`. 1 change still open.

### Added

- **`?theme=<name>` URL override:** opens the visit in any selector option (case-insensitive, `%20` / `+` decoded, first param wins; unknown / empty ignored) **without saving it**. Kept through in-app navigation and not replaced by another tab's theme change; picking a theme (selector or `t`) ends it and saves as usual. The first paint already honors it
- e2e `theme` fixture option (`?theme=` on every `goto`, `withThemeParam`) and `e2e/theme-override.spec.ts` (6); `themeBootScript.test.ts` runs the generated boot script in jsdom (15); `readThemeOverride` tests; root smoke test cases — 485 unit, 91 e2e (87 + 4 PWA)

### Changed

- The boot script generator moved from `vite.config.ts` to `src/themeBootScript.ts` (import-free deps, in `tsconfig.node.json`) so its output is unit-tested

## [0.4.27] — 2026-11-25

OpenSpec change `add-more-builtin-themes` implemented and archived (`openspec/changes/archive/2026-11-25-add-more-builtin-themes`). New main spec `builtin-themes`. 2 changes still open.

### Added

- **Four themes** after Dracula in the selector: **High Contrast** (white on black, yellow accent; text ≥ 7:1, chart colors + border ≥ 4.5:1), **OLED Black** (Default Dark colors on `#000` content + header), **Nord** (Polar Night / Frost / Aurora), **Solarized Light** (base3, accents darkened to ≥ 3:1). Each with its own rating tiers + star; all pass the theme contract unchanged; the boot script, `ThemeName` and the `t` shortcut pick them up automatically. System still resolves only to Default Dark / Default Light
- Tests: contract over the new themes, table order, High Contrast AAA / 4.5:1 assertions, OLED `#000` surfaces, System → defaults only; e2e per new theme (pick on Statistics, document background, persisted) — 448 unit, 85 e2e (81 + 4 PWA)

## [0.4.26] — 2026-11-25

OpenSpec change `add-custom-accent-theme` implemented and archived (`openspec/changes/archive/2026-11-25-add-custom-accent-theme`). New main spec `custom-theme`. 3 changes still open.

### Added

- **Custom theme:** "Custom" in the theme selector (last). While selected, an accent color picker (hex input, built-in primaries as presets; the trigger is a focusable `#theme-accent` button) and a Dark / Light base switch (`#theme-base`) show next to it; changes apply live. Surfaces, text, rating tiers and the star come from Default Dark / Default Light; the accent becomes antd's `colorPrimary` and seeds a 10-color chart palette (hue + i·36°, saturation 0.45–0.85, lightness corrected until ≥ 3:1 on the background, checked on the rounded hex)
- `customTheme` setting `{ accent, base }` — kept while another theme is selected, field-by-field fallback (invalid base → dark, invalid accent → base primary), syncs across tabs; the boot script paints a saved Custom theme with its base
- `src/utils/color.ts` — hex / RGB / HSL + WCAG contrast; `contrast.fixture.ts` (theme contract, e2e badge check) now uses it
- `color.test.ts`, `customTheme.test.ts` (incl. a 1560-combination readability sweep), theme contract over 5 sample Custom themes, `e2e/custom-theme.spec.ts` (6) — 361 unit, 81 e2e (77 + 4 PWA)

### Changed

- The `t` shortcut's cycle includes Custom

## [0.4.25] — 2026-11-25

OpenSpec change `add-global-keyboard-shortcuts` implemented and archived (`openspec/changes/archive/2026-11-25-add-global-keyboard-shortcuts`). New main spec `keyboard-shortcuts`. 4 changes still open.

### Added

- **Keyboard shortcuts** on every page: `g d` / `g s` / `g t` → Dashboard / Shows / Statistics, `/` → Shows search (navigates there first; the `/` isn't typed), `t` → next theme (saved like the selector), `?` → cheat sheet (`ShortcutsHelp`, Escape closes and returns focus; other shortcuts off while open). Ignored while typing in a field / select and with Ctrl / ⌘ / Alt
- `useHotkeys(map, { enabled })` — the one app-wide `keydown` listener: `e.key` matching, `g x` sequences (1s), typing-target / modifier / IME / auto-repeat suppression, map in a ref. `SHORTCUTS` (`constants/shortcuts.ts`) feeds both the handlers (`Record<ShortcutKey, …>`, compile-checked) and the cheat sheet
- `useHotkeys.test.ts` (21), `e2e/shortcuts.spec.ts` (7) — 231 unit, 75 e2e (71 + 4 PWA)

### Changed

- `ShowsPage` focuses the search field when opened via `/` (focused once data has loaded)

## [0.4.24] — 2026-11-25

OpenSpec change `spike-data-router` implemented and archived (`openspec/changes/archive/2026-11-25-spike-data-router`) — the spike passed all 5 go/no-go criteria (`spike-notes.md` there). New main spec `navigation-feedback`. 5 changes still open.

### Changed

- **Data router:** `BrowserRouter` / `<Routes>` → `createBrowserRouter` + `RouterProvider`; pages load through route `lazy` (`lazyPage(key)` over `PAGE_LOADERS` — the same `import()` as prefetch, still one request per page module). No `React.lazy` / `Suspense` left
- **Navigation feedback:** moving to a page whose code isn't loaded yet keeps the current page on screen with a thin progress bar at the top of the content area (`NavProgress`, `useNavigation()`, 150ms delay so fast navigations don't flash it, static under reduced motion) instead of swapping it for a centered spinner. The first load still shows the spinner (route `HydrateFallback`), now inside the layout
- **Page errors:** `RouteErrorBoundary` (manual pathname reset) replaced by one pathless route's `errorElement` (`PageError`) — React Router clears it on the next navigation; `UndefinedThrowGuard` keeps `throw undefined` in the layout (React Router's boundary ignores it). The layout route's `errorElement` (`RootRouteError`) rethrows, so shell crashes still reach `RootErrorBoundary`'s recovery screen
- `/shows/1 → /shows/2` still reuses the Show Detail instance; scroll reset, BottomNav re-show and page titles unchanged

### Added

- `e2e/navigation.spec.ts` (8): kept page + progress bar while a page module is held back (appear / disappear traced — no StrictMode flicker), no bar for a loaded page, one module request for hover + click, in-layout error on navigation + recovery on the next page, `throw undefined`, show-to-show without remount, first-load spinner inside the layout, reduced motion
- 210 unit, 68 e2e (64 + 4 PWA)

## [0.4.23] — 2026-11-25

OpenSpec change `add-pwa-offline` implemented and archived (`openspec/changes/archive/2026-11-25-add-pwa-offline`; new main spec `offline-support`). 6 changes still open.

### Added

- **Installable PWA** (production build, `vite-plugin-pwa` 2 / Workbox): web app manifest (name, start URL `/`, standalone, theme / background from Default Dark), 192 / 512 / maskable 512 icons + Apple touch icon generated from the new `public/tv.svg`
- **Offline:** the built app shell is precached and deep links (`/shows/12`) open offline (`navigateFallback`); `tv_series.csv` is fetched network-first with a 8s timeout and falls back to the last copy; "Offline — showing saved data" notice while the browser is offline (`useOnlineStatus`, `OfflineNotice`). Posters aren't cached
- **Update prompt:** a new deploy shows "New version available — Reload" (`UpdatePrompt`, `registerType: 'prompt'`) instead of swapping code mid-session
- **`<meta name="theme-color">`** follows the active theme's header color — set by the boot script before first paint and by `AppThemeProvider` on theme changes
- Playwright `pwa` project (`vite build && vite preview` on :4199, service workers on): manifest + icons, SW registration, offline reload of every page incl. a Show Detail deep link, offline notice, `theme-color`; first-paint `theme-color` check in `theme.spec`; `useOnlineStatus` unit tests
- 210 unit, 60 e2e (56 + 4 PWA)

### Fixed

- Missing favicon: `index.html` pointed at `/tv.svg`, which was never committed

### Fixed (code review of 0.4.20–0.4.23)

- **Crash screen Reload kept serving a broken build:** with the shell crashed, `UpdatePrompt` (inside it) can't apply an update, and a plain reload keeps a waiting service worker waiting — Reload now activates the waiting worker first (`activateWaitingServiceWorker`)
- Long-open tabs / installed windows never saw a new version (no navigations) and a dismissed prompt never came back — update check hourly + on becoming visible; the prompt re-appears on the next visibility
- Reload in one tab silently reloaded every other prompted tab (a pending debounced filter save could be lost) — other tabs now show "updated in another tab — Reload"
- `/tv_series.csv` opened in a tab showed the app's "Page not found" (shell navigation fallback) — URLs with a file extension bypass it
- Slow-but-online CSV fetches (> 3s) silently showed the cached copy with no notice — network timeout raised to 8s
- Offline notice claimed "showing saved data" with nothing loaded — "You're offline" then
- Stale comments (theme-color source, boot-script property count, PWA config location)

### Changed (simplify pass over 0.4.20–0.4.23)

- PWA e2e moved to its own config / script (`npm run e2e:pwa`, separate CI step) — Playwright starts every web server of a config, so `npm run e2e` was paying ~60s for a production build it didn't need
- Install-only `pwa-*.png` icons are no longer precached; the `theme-color` meta is emitted by the theme boot plugin from `THEMES` (no hand-typed color in `index.html`)
- `ratingTierColors(v, theme)` replaces `ratingOnColor` — a badge reads `fill` / `onFill` from one call; `isThemePreference()` guard shared by `parseThemePreference` and the cross-tab sync; `createPrefetcher(loaders)` replaces the test-only loader parameter + cache-reset hook
- Shared e2e helpers in `fixtures.ts` (`pickTheme`, `saveTheme`, `rgb` / `expectDocTheme`, `markNoReload` / `stillNoReload`; `watchConsole` fixture) and one WCAG `contrast()` (`src/utils/contrast.fixture.ts`) for the theme contract and the badge e2e

### Notes

- The service worker is production-only — the dev server is unchanged. In Vitest, `virtual:pwa-register/react` is aliased to a no-op fixture
- `?reset` doesn't clear the service worker or the cached CSV — README troubleshooting: clear site data

## [0.4.22] — 2026-11-25

OpenSpec change `smarter-route-prefetch` implemented and archived (`openspec/changes/archive/2026-11-25-smarter-route-prefetch`; new main spec `route-prefetch`). 7 changes still open.

### Changed

- **Smarter route prefetch:** idle prefetch of every page is skipped under Data Saver or a 2G / slow-2G connection (unknown connection → prefetch as before)
- Page loaders moved from `App` to `src/routes/pageLoaders.ts` (`PAGE_LOADERS`, lazy pages, `prefetchPage()`, `prefetchAllWhenIdle()`); `App` keeps one effect

### Added

- **Intent prefetch:** hovering / focusing a sidebar item (touch-start / focus on the mobile bottom nav) loads that page's code; hovering / focusing a show card or Dashboard show row loads Show Detail — so the first open has no loading flash. Each chunk is fetched at most once; a failed prefetch stays silent and retries later
- E2E `prefetch` (page-module request counts with / without emulated Data Saver) and `pageLoaders` unit tests
- 202 unit, 56 e2e

## [0.4.21] — 2026-11-25

OpenSpec change `sync-settings-across-tabs` implemented and archived (`openspec/changes/archive/2026-11-25-sync-settings-across-tabs`; new main spec `settings-sync`). 8 changes still open.

### Added

- **Cross-tab theme sync:** changing the theme (incl. System) in one tab applies to every other open dashboard tab without reload; a reset in one tab propagates, a corrupt or unknown value written elsewhere is ignored. Saved Shows filters deliberately don't change an already-open Shows page — they apply on its next visit. New `subscribeSettings()` in `settings.ts` (the `storage` event)
- E2E `settings-sync` (two tabs, new `newTab()` fixture) and `subscribeSettings` / `saveSetting` unit tests
- 196 unit, 53 e2e

## [0.4.20] — 2026-11-25

OpenSpec change `add-semantic-theme-colors` implemented and archived (`openspec/changes/archive/2026-11-25-add-semantic-theme-colors`; new main spec `semantic-colors`). 9 changes still open.

### Changed

- **Rating / completion colors come from the theme:** each theme defines `tiers` (`success` / `warning` / `danger`, each a `fill` + an `onFill` text color) and a `star` color. Default Light uses darker shades (`#237804` / `#a05e00` / `#cf1322`, were 1.75–2.08:1 on its background); Dracula uses its own `#50fa7b` / `#f1fa8c` / `#ff5555`; Default Dark keeps the antd colors
- **Rating badges readable** (Show Cards, Show Detail): text uses the tier's `onFill` instead of white (white on amber was 1.9:1) — dark text on the bright fills of dark themes
- **Compact-list rating star** (Dashboard Recently Watched / Not Started) uses `theme.star` instead of a fixed gold
- `ratingColor(v, theme)` / `completionColor(v, theme)` take the theme; new `ratingOnColor(v, theme)` and pure `tier(v, high, mid)`; `STAR_COLOR` removed
- `Theme.areaFill` removed — the Watch Time area chart uses `token.colorPrimary` (equal in every theme)

### Added

- Theme contract test: each tier fill ≥ 3:1 vs `contentBg`, its `onFill` ≥ 4.5:1 vs the fill, `star` ≥ 3:1
- E2E `semantic-colors`: rating badge text vs fill ≥ 4.5:1 (computed styles) in Default Light and Default Dark
- 190 unit, 50 e2e

## [0.4.19] — 2026-11-25

OpenSpec change `refactor-typed-theme-provider` implemented and archived (`openspec/changes/archive/2026-11-25-refactor-typed-theme-provider`; no spec delta — refactor + tests). 10 changes still open.

### Changed

- **Default Light chart colors** (only visible change): two of the 10 failed WCAG 3:1 against the `#f5f5f7` background — amber `#d97706` (2.93:1) → `#b45309` (4.61:1), lime `#65a30d` (2.84:1) → `#4d7c0f` (4.59:1). Same hue families, same palette slots, so no chart changes which color it uses
- **Typed theme names:** `ThemeName` union from the theme table (`THEME_DEFS as const satisfies …`), `THEMES: Record<ThemeName, Theme>` with `name` taken from the key, `isThemeName()` type guard, `ThemePreference = ThemeName | 'System'`
- **`AppThemeProvider`** (`ThemeContext.tsx`) owns the theme preference, persistence, System resolution, document color-scheme sync and antd `ConfigProvider`; `App` is now just providers + routes. `ThemeToggle` reads/sets the theme via `useThemeSetting()` — `AppLayout` no longer drills `themePreference` / `onThemeChange`

### Added

- **Theme contract test** (`themes.test.ts`): every theme has all fields as valid colors, exactly 10 distinct chart colors, `chartText` ≥ 4.5:1 and each chart color ≥ 3:1 vs `contentBg`; `isThemeName` tests
- Root smoke test: switching theme in `#theme-select` updates the select, `color-scheme` and `tvdash-settings`
- Tests for every fix below: 174 unit, 46 e2e (`?reset` first paint, `/Stats` title)

### Fixed (code review of 0.4.15–0.4.19)

- **Mixed-case URLs** (`/Stats`, `/SHOWS`) rendered the right page but were titled "Page not found" with no nav item highlighted — `normalizePath()` now lowercases too (react-router matches case-insensitively)
- **Root / route error boundaries** showed a blank page on a falsy throw (`throw undefined`): they now track `hasError`, and `errorMessage()` formats any thrown value without throwing itself
- **`?reset` flashed the old theme**: the boot script now ignores the saved theme when the URL has `reset`, so first paint already matches the post-reset System theme
- **`?reset` rewrote other params** (`?debug` → `?debug=`, `%20` → `+`): removal now works on raw query segments
- **Pie legends vanished** for the replayed animation when reduced motion was switched off on Statistics — latched visible
- **Blank show name** gave an empty header and a ` · TV Dashboard` tab — now `Untitled show`
- **Boot script before `<meta charset>`** (`head-prepend`) — now injected after it (`head`), so more themes can't push the charset past the first 1024 bytes
- **Non-canonical show URLs** (`/shows/0x1`, `/shows/1e0`, `/shows/01`) opened show 1 — `findShow` accepts canonical ids only (pre-existing)

## [0.4.18] — 2026-11-25

Tests only — no app code changed. OpenSpec change `add-root-smoke-test` implemented and archived (`openspec/changes/archive/2026-11-25-add-root-smoke-test`; no spec delta). 11 changes still open.

### Added

- **Root smoke test** (OpenSpec `add-root-smoke-test`, tests only): `src/App.test.tsx` renders the real `<App />` in jsdom and checks every route mounts its page, plus the saved-theme fallback (valid / unknown / non-string / non-JSON). 11 cases → 123 unit tests. Adds ~20–40s to `npm test` depending on machine load (antd + Recharts import in jsdom; the other unit tests take ~11s); page modules preloaded in `beforeAll` so the first test can't time out on a cold transform; accepted as the safety net before the root refactors (typed themes, semantic colors, cross-tab sync, data router)

## [0.4.17] — 2026-11-25

OpenSpec change `respect-reduced-motion` implemented and archived (`openspec/changes/archive/2026-11-25-respect-reduced-motion`); new main spec `openspec/specs/motion-preferences`. 12 changes still open.

### Added

- **Reduced motion** (OpenSpec `respect-reduced-motion`): with the OS "reduce motion" setting on (followed live), no chart entry animations (all 13 Recharts series on Statistics + the Dashboard ratings chart), no pie-legend fade (legend shown at once — it used to wait for `onAnimationEnd`, which never fires without animation), no Ant Design motion (`token.motion`), and the mobile bottom nav hides/shows without sliding. Unchanged without the preference
- `usePrefersReducedMotion()` hook (on `useMediaQuery`)
- Tests: `usePrefersReducedMotion.test.ts` (112 unit tests), `e2e/reduced-motion.spec.ts` (4 cases; legend opacity sampled every frame)

## [0.4.16] — 2026-11-25

OpenSpec change `add-root-error-safety-net` implemented and archived (`openspec/changes/archive/2026-11-25-add-root-error-safety-net`); new main spec `openspec/specs/app-recovery`. 13 changes still open.

### Added

- **Root safety net** (OpenSpec `add-root-error-safety-net`): `RootErrorBoundary` wraps `<App />` in `main.tsx`. A render error in the shell (providers, router, `AppLayout`) now shows a plain recovery screen — error message as text, **Reload**, **Reset saved settings** — instead of a blank page. No antd / theme dependency (CSS system colors, `color-scheme: light dark`). Page errors still use the in-layout `RouteErrorBoundary`
- **`?reset` escape hatch:** `consumeResetParam()` runs before `createRoot`, clears saved settings and removes only `reset` from the URL (`replaceState`)
- `settings.ts`: `resetSettings()` (removes `tvdash-settings` + `tvdash-sidebar`, never `localStorage.clear()`) and `SIDEBAR_KEY` (`AppLayout` imports it instead of the literal)
- e2e fixture option `allowConsoleErrors` (one `RegExp`) for errors a spec provokes on purpose
- Tests: `src/utils/settings.test.ts`, `src/components/RootErrorBoundary.test.tsx` (111 unit tests), `e2e/recovery.spec.ts` (5 cases, crashes forced by serving a throwing module)

## [0.4.15] — 2026-11-25

First OpenSpec changes implemented and archived (`add-system-theme-and-color-scheme`, `add-route-document-titles`, `tidy-root-entry`). Main specs now exist under `openspec/specs/` (`theming`, `page-titles`).

### Added

- **System theme** (OpenSpec `add-system-theme-and-color-scheme`): new first option in the theme selector that follows the OS `prefers-color-scheme` (Default Dark ↔ Default Light) and switches live. It's the default when no theme is saved or the saved value is invalid; an explicitly saved theme is still honored
- **Native color scheme:** `<html>` gets the active theme's `color-scheme` and `contentBg` background, so the `Content` scrollbar, autofill and native controls are dark in dark themes
- **No flash on load:** `vite.config.ts` injects an inline `<head>` boot script generated from `THEMES` that applies the saved / OS-resolved color scheme + background before the bundle runs (storage errors fall back to the OS setting)
- **Route titles** (OpenSpec `add-route-document-titles`): browser tab title follows the route — `Dashboard · TV Dashboard`, `Shows · …`, `Statistics · …`, `<show name> · …` on Show Detail, `Page not found · …` for unknown URLs. The header shows the series name on Show Detail (`Show Detail` while loading, `Show not found` for an unknown ID). One `pageTitleFor()` feeds header and tab, so they can't disagree. Tests: `src/utils/pageTitle.test.ts`, `src/hooks/useDocumentTitle.test.ts` (100 unit tests), `e2e/titles.spec.ts` (10 cases)
- Tests: `src/themes.test.ts`, `src/hooks/useMediaQuery.test.ts` (91 unit tests), `e2e/theme.spec.ts` (8 cases)

### Changed

- **Test setup:** removed the global `src/setupTests.ts` (it loaded `@testing-library/jest-dom` into every Vitest run while the default environment is `node`, and no test used a jest-dom matcher). Dropped the `@testing-library/jest-dom` devDependency; a jsdom test that needs DOM matchers imports `@testing-library/jest-dom/vitest` itself (OpenSpec `tidy-root-entry`)
- **e2e:** `dashboard.spec.ts` Highlights navigation waits for the destination page title, not just the URL — the URL changes before the lazy Show Detail page commits, so `goBack()` could race the pending render, which then took focus from the next card (flaky ~1 in 3 once tab titles changed the timing)
- **Mount error:** `main.tsx` throws `#root element missing in index.html` instead of React's opaque "Target container is not a DOM element" when `#root` is missing

### OpenSpec proposals

- 6 more changes proposed for Entry / root P3: `add-global-keyboard-shortcuts`, `add-custom-accent-theme`, `add-more-builtin-themes`, `add-url-theme-override`, `support-subpath-hosting`, `tidy-root-entry`
- Archived (`openspec/changes/archive/2026-11-25-*`): `tidy-root-entry`, `add-system-theme-and-color-scheme`, `add-route-document-titles` — all three applied above. 14 changes still open
- `.gitignore`: `vite.config.*.timestamp-*` (Vite's temporary config bundle — `vite.config.ts` now imports `src/themes.ts`)

## [0.4.14] — 2026-11-24

Docs only — no app or generator code changed.

### Improvement ideas (`IDEAS.md`)

- **New "Improvement Ideas" for every module** (Entry / root, Pages, Components, Context, Hooks, Utils, Constants, Types, Outside `src/`), ranked P1 (high value, low cost) / P2 / P3, each grounded in the current code and the real CSV (e.g. genre counts, rating tiers)
- **Restructured:** ideas first, then `## Completed` (the finished Next Up list + module review tracker, unchanged, headings demoted one level). The one open checkbox (sidebar collapse across desktop ↔ mobile resize) moved to a new `## Open follow-ups`
- **Deduplicated:** 13 cross-module duplicates merged so each idea lives once, in the module that owns it (e.g. perf marks → Hooks "Load timing", `useHotkeys` → Entry / root shortcuts, similarity / insights / export → Pages, `KNOWN_GENRES` → Constants genre fix); 202 → 189 ideas

### Bug backlog (`BUG_BACKLOG.md`)

- 12 open items found while exploring, each cross-referenced to its IDEAS entry — 2 confirmed against the real CSV (completion above 100% on Show Detail, Crime shows with grey genre tags), 1 against the themes (`StatCard` tint on a 3-digit hex), 3 measured contrast failures (white text on rating badges 1.9–2.27:1 in every theme, Default Light tier colors 1.75–2.08:1, Default Light chart color `#65a30d` 2.84:1), 1 to verify (missing CSV served as `index.html`)

### OpenSpec proposals

- 11 changes proposed for Entry / root (`openspec/changes/`): P1 — `add-system-theme-and-color-scheme`, `add-route-document-titles`, `add-root-error-safety-net`, `respect-reduced-motion`; P2 — `add-root-smoke-test`, `refactor-typed-theme-provider`, `add-semantic-theme-colors`, `sync-settings-across-tabs`, `smarter-route-prefetch`, `add-pwa-offline`, `spike-data-router`. Not implemented yet

### Docs

- `CLAUDE.md`: new "Project docs" section (what `IDEAS.md` / `BUG_BACKLOG.md` / `CHANGELOG.md` / `features.txt` hold and how to keep them in sync on a release)
- `README.md`: "Future Improvements" points to `IDEAS.md`; `StatCard` structure comment includes Show Detail
- `features.txt`: version header

## [0.4.13] — 2026-11-24

Clears the IDEAS "Next Up" backlog (items 5–7) and both open BUG_BACKLOG entries.

### CSV Generator (`series-search.py`)

- **No more frozen window:** every TMDB call (search, details, save-time detail fetch, season fetches) runs in a worker thread; results return through a queue the Tk loop polls, so widgets and dialogs stay on the main thread. Status shows Loading... / Saving...; Save is disabled while a save is in flight
- **API key never shown:** request errors are raised as `TmdbError` with `api_key=***` (requests' messages include the full URL)
- **Structure:** `TmdbClient` / `CsvStore` / `App` classes, `main()` behind `if __name__ == "__main__"` — importable without opening a window. Missing key exits with a message instead of a traceback
- Page counter only changes after a fetch succeeds (a failed Next left it on the new page while the table showed the old one); Next / Prev page through the last successful search, not whatever is in the entry box
- Save re-reads the row right before writing; one dialog per save, with the failure reason when a season couldn't be fetched
- `npm run test:gen` rewritten against the importable `App` (37 checks after the fixes below), incl. UI responsiveness while a request blocks, every request off the main thread, key redaction, failed-page handling

### Dashboard / UI

- `ratingColor` accepts `null` (→ `undefined`); new `formatRating` (`derive.ts`) replaces 7 inline `toFixed(1)` / `'–'` call sites
- `STATUSES` exported for literal access (`STATUSES['Returning Series'].hex`) — `STATUS_COLORS` / `STATUS_TAG_COLORS` removed; `TvSeries.status` typed `KnownStatus | (string & {})`
- `STAR_COLOR` constant for the gold star in Dashboard lists (was a hardcoded `#faad14` twice)
- Show Detail stat tiles use `StatCard` (now with an optional `formatter`) — same look as Dashboard / Statistics
- Mobile bottom nav extracted to `BottomNav` with its own visibility state: scroll-direction flips no longer re-render the whole shell, and the `[broken]` re-show effect is gone (mounting resets it)

### Code-review fixes (0.4.13)

- **`series-search.py` could truncate the CSV:** `CsvStore.update` opened the file with `"w"` and then wrote rows — a hand-edited row with an extra field (or any error mid-write) left it cut off. Now a temp file + `os.replace`, extra fields ignored
- **Excel BOM hid every existing row** (`\ufeffTV ID` header) → every save appended a duplicate. Reads use `utf-8-sig`
- **Seasons could be counted twice** (two panels for the same show, or a hand edit while fetching): only seasons the re-read row lacks are added; otherwise `Already Saved`
- **Save errors were silent** (only a console traceback — e.g. CSV open in Excel): now an error dialog, UI re-enabled
- **Show Detail stat values clipped / overflowed** at ~600–1250px after the `StatCard` switch: 2×2 below `xl`, value wrapper `minWidth: 0`; `StatCard` compact tiles carry their own hover text (StatsBar's wrapper `div` removed)
- `npm run test:gen` works where Python is `python3` (`scripts/run-python.mjs`)
- e2e `expect` timeout 15s — a cold dev server compiling routes on first hit made the Dashboard specs flaky under parallel workers
- Tests: generator 37 checks (+ concurrent double-save, extra-field rewrite, BOM, write failure, idle polling); e2e 17 (+ stat-tile overflow at 4 widths)

### Simplify pass (0.4.13)

- `series-search.py`: `TmdbClient(session=)` / `App(dialogs=)` injection (the test harness passes fakes — no global monkeypatching); redaction only in `TmdbClient.get`; season fetches in parallel; result queue polled only while work is pending (no 30ms timer while idle); `first_runtime` / `air_year` shared by the table and the CSV row
- `KNOWN_STATUSES` / `KnownStatus` moved to `src/types/series.ts` (the data type no longer imports UI constants); `STATUSES` keyed off it; `ratingColor` single signature
- `BottomNav` reads the real `scrollTop` on navigation instead of assuming `AppLayout` already reset it
- e2e: `csv` fixture option (real-CSV smoke test reuses the console-error guard), `TEST_CSV` built with the unit tests' `csv()` header, deterministic broken poster (string filter removed), `toBeInViewport` for nav visibility, `goBack()` instead of reloads, shared helpers
- CI caches Playwright's Chromium per version

### Build / Data

- `npm run build` uses `tsc -b` — also type-checks `vite.config.ts` (plain `tsc` skipped it)
- `public/tv_series.csv`: 114 legacy `N/A` cells (Episode Runtime, Age Rating, Poster URL) rewritten to blank; backup at `public/tv_series.csv.bak` (gitignored)

### Tests

- Unit: `ratingColor(null)`, `formatRating`, `STATUSES` — 80 total. E2E: new `mobile-nav` spec (hide/show on scroll, re-show on navigation, desktop → mobile while scrolled) + stat-tile overflow — 17 total

## [0.4.12] — 2026-11-24

Test tooling — the ad hoc browser and generator checks from 0.4.11 are now part of the repo.

### Added

- **Browser e2e suite** (`e2e/`, `@playwright/test`, `npm run e2e`): CSV warning banner, Dashboard Highlights (click / Enter / Space, poster fallback), Not Started, Show Detail unknown values (blank / `N/A` / negative / fractional / `1e7`), URL-keyed poster fallback across SPA navigation, Shows search + card unknowns, form-field ids. Serves a synthetic CSV via route interception; fails any test with a console error. Real-CSV smoke test skips when `public/tv_series.csv` is absent
- **CI `e2e` job** (Chromium, HTML report uploaded on failure)
- **`npm run test:gen`** (`scripts/test_series_search.py`): drives `series-search.py` through its real Tk widgets with TMDB faked, on a temp copy — paging while loading, new / existing show saves, failed season fetches. Local only (needs a display)

### Changed

- `vitest.config.ts` limits `include` to `src/**/*.test.{ts,tsx}` (Vitest would otherwise collect `e2e/*.spec.ts`)
- Lock regenerated with npm 10 (CI's)

## [0.4.11] — 2026-11-24

Whole-project pass over the uncommitted v0.4.x work (simplify, then code-review).

### Simplify

- **New helpers:** `src/utils/lookup.ts` (own-key `lookup`, was private in `ui.ts` and hand-inlined in `derive.ts` / `App.tsx`); `cardStyle(isDark)` in `ui.ts` (radius + shadow pair, was copied 8×); `maxBy(data, pick)` in `derive.ts` (Dashboard Top Rated / Newest — was filter + full sort for one row)
- **ShowsPage:** search text lowercased once per show (memoized on `data`), not per keystroke; genre/status sets memoized on `data` (genres via `uniqueGenres`)
- **DashboardPage:** Highlights cards reuse `ShowRowCard` (new `thumb` / `header` / `ariaLabel` / `style` / `padding` props — one copy of the clickable-card a11y wiring); stat values in one `useMemo`
- **ShowDetailPage:** poster error is URL-keyed like `PosterThumb` (no reset needed); completion via `completionRate([series])`
- **useTvData** memoizes its return value; `TvDataProvider` passes it straight through (field list no longer duplicated)
- `StatsBar` calls `totalYearsWatched` again (was inlined, leaving the helper dead); `firstAirYear` checks use `!= null`

### Fixed

- **`series-search.py`:** Enter / Next / Prev during a load changed the page counter while the request was dropped — counter and table went out of sync (regression from 0.4.10's `loading` guard)
- **`series-search.py`:** a failed season fetch saved the season as watched with 0 episodes / 0 min, and it could never be re-added. Failed seasons are now skipped and reported; nothing is saved if all fail
- **`derive.ts` `completionByGenre`:** plain `{}` map indexed by CSV genre — `__proto__` wrote `NaN` onto `Object.prototype`, `constructor` vanished. Now `Object.create(null)`
- **Parser:** `Seasons` must be an integer ≤ 1000 (`seasonCount`) — `1e7` froze Show Detail, `2.5` showed "2 / 2.5"; `Episode Runtime` ≤ 0 → `null` (`-5 min` was shown)
- `languageDistribution` / `ageRatingDistribution` / Show Detail runtime use `!= null`, not truthiness
- `ThemeToggle` `Select` gets `id="theme-select"` + `aria-label` (form-field convention; it has no visible label)
- `antd` range raised to `^5.25.0` (`Tabs` `destroyOnHidden` needs 5.25; worked only via the lock)
- `package-lock.json` regenerated with npm 10 (CI's): local npm 12 had dropped vitest's nested `esbuild@0.28` (optional peer of `vite@8`), failing `npm ci`

### Tests

- Season count / runtime normalization, `completionByGenre` inherited-key genres — 77 total

## [0.4.10] — 2026-11-24

Review pass over everything outside `src/` — `series-search.py` and config (simplify, code-review, security-review). Completes the module-by-module review.

### CSV Generator (`series-search.py`)

- **Writes `public/tv_series.csv` directly** — path resolved from the script's location, not the working directory (no manual copy step)
- **Unknown values written as `''`**, not `'N/A'` (a `N/A` poster URL caused a broken image request). Existing rows untouched; the dashboard handles both
- **Appends follow the existing file's header** (warns about missing columns) — an older or hand-edited file got values under the wrong columns
- **Fixed:** already-saved seasons showed unchecked in the season picker (regression from this pass's simplify step: their `BooleanVar`s were garbage-collected)
- **Fixed:** worker threads opened Tk error dialogs (unsupported — could freeze/crash or stack 20 dialogs); now one summary dialog on the main thread
- **Fixed:** Enter during a load started an overlapping search (stale thread re-enabled buttons) — `loading` flag
- **Fixed:** saving before the background fetch finished wrote `—` as Seasons / Episode Runtime — new rows built from TMDB details (`new_row()`), not table cells
- **Fixed:** an unexpected error in the details thread left the buttons disabled for the session (`try/finally`)
- **Fixed:** a failed details request showed "All seasons already saved"
- One request per series: details + credits + keywords + US rating via `append_to_response`, cached from the search table's background fetch (was 4 extra calls on save)
- Search term passed via `params=` (URL-encoded — a `&` broke the query); API key / User-Agent set once on the session
- Cleanup: single `_tmdb_get` helper (was 6 copies), `FIELDNAMES` column contract, `load_rows()`, `names()`, dead `import time` / wrapper frame removed

### Config

- `tsconfig.node.json` emits to `node_modules/.tmp` (`outDir`) — `tsc -b` no longer drops `vite.config.js` / `.d.ts` into the root (`noEmit` is rejected for a referenced project, TS6310); dropped redundant `allowSyntheticDefaultImports`
- `vitest.config.ts` merges `vite.config.ts`; default test environment is `node` — DOM tests opt in with `// @vitest-environment jsdom`
- Removed unused `@testing-library/user-event` and `resolveJsonModule`; ESLint `ignores` reduced to `dist/`

### Security Review

- No findings — API key never written to the CSV or logged (it can appear in a local error dialog, as before); fixed CSV path; `csv.DictWriter` quoting; no subprocess / eval / pickle

## [0.4.9] — 2026-11-24

Review pass over `src/types/` (simplify, code-review, security-review).

### Unknown Values (`TvSeries`)

- `firstAirYear`, `voteAverage`, `seasons`, `language`, `ageRating` are now nullable. `parseSeriesCsv` normalizes "unknown" once: `posNum` (blank / non-numeric / ≤ 0 → `null`; TMDB's `0.0` = no votes) and `optStr` (blank / `N/A` → `null`). Consumers check `!= null` instead of scattered `> 0` / truthy / `=== 'N/A'` guards
- Fixed displays: year **"0"** (ShowCard, Dashboard, Show Detail), **"★ 0.0"** for an unrated show (Dashboard Not Started list), **"Seasons Watched 2 / 0"**, and an **"N/A"** age-rating / language tag on Show Detail (charts already excluded it) — now `'–'` or hidden
- New `compareDescNullsLast`: unrated / unknown-year shows sort last in Rating ↓ / Year ↓ and the Dashboard lists
- `Seasons Watched` deduped, only positive integers kept — `"1,1,2"` showed "3 / 2" and landed in the wrong depth bucket
- `languageDistribution` uses an own-key lookup on `LANGUAGE_NAMES`

### Types

- New `NameValue` / `NameCount` row types replace 7 inline `{ name, value|count }[]` shapes (derive distributions, `AnimatedPie`)
- `Filters` / `SortKey` moved from `FilterBar.tsx` to new `src/types/filters.ts`; `NumericSortKey` restricted to number-typed `TvSeries` fields (removes the `as number` cast in ShowsPage's sort); `Filters.status` is `string` with `''` documented as "no filter"
- Sort labels are a `Record<SortKey, string>` in `ui.ts` — the single source for FilterBar's options and ShowsPage's saved-value check (was 3 copies); a new `SortKey` without a label fails to compile

### Tests

- Parser: blank/0 → null, N/A → null, Seasons Watched dedupe; derive: `compareDescNullsLast`, `constructor` language code; fixtures moved from `0`/`'N/A'` to `null` — 74 total

### Security Review

- No findings — saved `sortBy` validated against the fixed sort keys before use as a property key; parser helpers only produce numbers / strings / null; own-key lookups; no unsafe sinks

## [0.4.8] — 2026-11-24

Review pass over `src/constants/` (simplify, code-review, security-review).

### Constants (`ui.ts`)

- **One status table:** private `STATUSES` (`{ hex, tag }` per status, `as const satisfies`) replaces two hand-synced maps; `STATUS_COLORS` / `STATUS_TAG_COLORS` derive from it and are typed `Record<KnownStatus, string>`, so a mistyped literal key fails to compile
- New helpers for CSV-derived keys: `statusHex(name, fallback)`, `statusTagColor(name)`, `genreTagColor(g)` (`GENRE_COLORS` now private), `sortStatuses(names)`. Lookups are own-key only — a status/genre like `constructor` or `toString` no longer returns a built-in function instead of the fallback
- `ratingColor` / `completionColor` built from one `tierColor(high, mid)` helper
- `avgRatingColor` removed: `avgRating()` now returns `number | null` (was a formatted string with a `'–'` sentinel that the color helper parsed back); StatsBar and Dashboard format (`toFixed(1)` / `'–'`) and color it at the display point. Display unchanged
- **Canceled red unified:** hex `#ff4d4f` → `#f5222d`, matching its `red` Tag preset (and the red in rating/completion colors)

### Status Display

- **Unknown statuses** get a theme chart color on both Dashboard and Statistics (`statusHex`) — Dashboard drew them in Ended grey
- **Status filter** options built from the statuses in the loaded data (like genres), known statuses first in table order, unknown ones alphabetically — no longer offers statuses that always give 0 results, and an unexpected status (e.g. `Cancelled`) is selectable

### Derive

- The 8 count maps use `Object.create(null)`, so a `constructor` / `__proto__` value is counted like any other string

### Tests

- New `src/constants/ui.test.ts` (tier colors, Canceled red, unknown-status fallback, inherited-key lookups, status ordering); `avgRating` tests updated for `number | null`; `statusDistribution` with a `constructor` status — 69 total

### Security Review

- No findings — color helpers only ever return values from the static tables or a theme fallback (never the CSV string); own-key lookups; CSV status text rendered as React text in Select options; no unsafe sinks in `src/`

## [0.4.7] — 2026-11-24

Security review of `src/utils/` — no findings, no code changes. Completes the Utils review (simplify 0.4.5, code-review 0.4.6).

### Security Review

- CSV fields become only strings, numbers or lists — no `eval`/`Function`/`dynamicTyping`; a `__proto__` header only touches that one Papa row object, and `toSeries` copies fixed keys into a new object
- `CsvWarningBanner` renders CSV-derived text (show names, Papa messages) as React text — no `dangerouslySetInnerHTML` anywhere in `src/`
- `posterUrl` only reaches `<img src>` (no `javascript:` execution); no `href` built from CSV data
- `settings.ts`: `__proto__` in stored JSON stays an own property; non-object/array values rejected; callers type-check each field
- Warnings logged to the console hold show names and parse errors only — no secrets or PII

## [0.4.6] — 2026-11-24

Code-review pass over `src/utils/`. All 5 findings fixed.

### CSV Loading

- **Skipped rows are visible:** new `CsvWarningBanner` (dismissible antd warning `Alert`) above every page lists the first 3 skipped-row warnings, the rest go to the console. Before, they were console-only, so shows could silently vanish (e.g. `series-search.py` appending rows with a different column count). `useTvData` now returns `warnings` (cleared on error); `AppLayout` reads them from context. Dismissal is tied to the warnings array, so a reload that still skips rows shows the banner again
- **Every row skipped is fatal:** `CSV has no valid rows — all N skipped. First: …` shows the error screen instead of the "no data" empty state
- **Empty file:** `delimiter: ','` passed to Papa — an empty `tv_series.csv` showed `CSV parse error: Unable to auto-detect delimiting character` instead of the Dashboard empty state
- **Duplicate TV IDs** skipped with a warning (first one kept) — they gave duplicate React keys, an unreachable second `/shows/:id`, and double-counted stats
- Warnings say `record N` (Nth data row) instead of a file line number, which was wrong once an earlier Overview held a quoted newline

### Charts

- `truncate()` counts code points, so an emoji in a chart label is never cut in half; `max` clamped to 2 so the result is never longer than the input

### Tests

- 6 new tests (record numbering across a multi-line field, duplicate IDs, all-rows-skipped fatal, empty/header-only file, emoji truncation, `max < 2`), `useTvData` checks the exposed `warnings` — 63 total

## [0.4.5] — 2026-11-24

Simplify pass over `src/utils/` (reuse, simplification, efficiency, altitude). No behavior change. Code-review and security-review of `src/utils/` still to do.

### Findings

- Reuse, efficiency, altitude: nothing to fix. `truncate`, `activateOnKey`, `formatRuntime`, `parseSeriesCsv` and `settings.ts` are each the single implementation and used at every call site. `formatRuntime` rounding (display time, not parse time) and the `getSettings` plain-object check (at the storage boundary) are at the right layer
- `REQUIRED_COLUMNS` (`parseSeriesCsv.ts`) and the fixture's `HEADER` no longer exported — nothing imported them

### Tests

- `parseSeriesCsv.fixture.ts`: `VALID_CSV` built with `csv(VALID_ROW)` instead of repeating its body; new `withId(id, row?)` helper replaces the `VALID_ROW.replace(/^1,/, …)` regex copied 5× across `parseSeriesCsv.test.ts` and `useTvData.test.ts`
- Still 57 tests

### Tooling

- `.gitignore`: `vite.config.js` / `vite.config.d.ts` — `tsc -b` emits them from `tsconfig.node.json` (no `noEmit`)

### Skipped (intentional)

- Sidebar's own `tvdash-sidebar` key not folded into `settings.ts` (intentional isolation; would lose saved state)
- `Math.round(mins / 60)` repeated 4× — too small for a helper
- Moving `truncate` / `formatRuntime` to a `format.ts` — outside this pass

## [0.4.4] — 2026-11-24

Review pass over `src/hooks/` (simplify, code-review, security-review). Includes a fix for a regression introduced in 0.4.3.

### CSV Loading

- **Regression fix (from 0.4.3):** a broken quote in `tv_series.csv` is fatal again. 0.4.3 skipped *any* row-level parse error, but a bad quote makes PapaParse swallow every later line into one field and reports its `row` off by one (counting the header) — so the corrupted row was kept and the rest of the file silently vanished. Now only `FieldMismatch` (wrong field count) skips a row; `Quotes`/`Delimiter` errors fail the load with `CSV parse error`
- Parsing moved out of the hook into pure `src/utils/parseSeriesCsv.ts` (`parseSeriesCsv(text) → { rows, warnings }`); `useTvData` only fetches, logs warnings, and owns loading/error state (138 → ~65 lines)
- Row mapping returns `null` for an invalid `TV ID` (the rule lived half in `mapRow`, half in the caller); numeric fields go through one `num(val, fallback)` helper — a garbage `Episode Runtime` now becomes `null` instead of `NaN`
- Rows typed as `Record<string, string | undefined>` (Papa header mode yields strings) — dropped the `any` + eslint-disable; parse errors read in one pass

### Fetch Lifecycle (`useTvData`)

- Stale-response detection is a single `AbortController` identity check (superseded by refetch, or nulled on unmount) instead of a request-id counter + mounted flag; `mountedRef` kept only so a retained `refetch` called after unmount is a no-op
- "Request timed out" message driven by a `timedOut` flag set by the timeout, not by `err.name === 'AbortError'` (only correct before by coupling to the staleness check)
- Superseded check runs before parsing, not after

### Tests

- New `src/utils/parseSeriesCsv.test.ts` (row mapping, missing columns, malformed row, invalid IDs, broken quote fatal, numeric fallbacks) with shared fixtures in `parseSeriesCsv.fixture.ts`
- `useTvData.test.ts` now covers lifecycle only: `fakeResponse`/`stubFetch`/`renderLoaded` helpers, a real 10s timeout via fake timers, superseded slow response ignored, refetch after unmount is a no-op; `refetch()` / timer advances wrapped in `act()`; `vi.unstubAllGlobals()` in `afterEach`
- 57 tests total (was 50)

### Security Review

- No findings — fixed same-origin fetch URL, no `dynamicTyping`, no unsafe sinks; `__proto__` CSV header has no effect (string write to `__proto__` is a no-op, mapper reads fixed keys)

## [0.4.3] — 2026-11-24

Review pass over `src/context/` (simplify, code-review, security-review). The code-review also surfaced 3 older bugs in `useTvData`, fixed here. Checked in a real browser with Playwright.

### Context

- Context object + `useTvDataContext()` moved to new component-free `src/context/useTvDataContext.ts`; `TvDataContext.tsx` keeps only `TvDataProvider`. Fast Refresh no longer recreates the context when the provider file is edited (an already-loaded page would read the stale context). Pages import the hook from the new file
- Context default is `null` and `useTvDataContext()` throws outside `TvDataProvider` — previously a fake `loading: true` default meant a mis-wired page spun forever
- Context type derived from the hook (`ReturnType<typeof useTvData>`) instead of a hand-copied interface
- Provider value memoized (stable identity for memoized consumers)

### CSV Loading (`useTvData`)

- One malformed CSV row no longer fails the whole load — only file-level PapaParse errors (no row number) are fatal; row-level errors (`TooFewFields`, bad quotes, …) skip that row with a `console.warn` naming the CSV line
- `TV ID` is now a required column; rows with a blank or non-positive-integer ID are skipped (blank became `0` → duplicate React keys and an arbitrary `/shows/0`; garbage became `NaN` → `/shows/NaN`)
- A failed fetch/refetch clears `data` — no stale rows alongside an error
- 3 new tests (malformed row, invalid IDs, failed refetch) — 50 total

### Security Review

- No findings in `src/context/` / `useTvData` changes — fixed fetch URL, no unsafe sinks or deserialization, warnings log only CSV line numbers and show names

## [0.4.2] — 2026-11-24

Review pass over `src/components/` (simplify, code-review, security-review), then checked in a real browser with Playwright (desktop + mobile).

### Statistics Charts (`ChartsSection`)

- Pie legends no longer show at full opacity while the pies replay their entry animation after returning to the Overview tab. The anim-done flag moved into a new `AnimatedPie` child component, so it resets whenever `destroyOnHidden` remounts the pane (regression introduced by `destroyOnHidden`)
- Top 10 by Watch Time tooltip uses `formatRuntime` (was raw minutes); `formatRuntime` now rounds fractional minutes (`125.5` → "2h 6m", was "2h 5.5m")
- Status Breakdown donut uses `STATUS_COLORS`; added `In Production` (blue), `Planned` (purple), `Pilot` (orange) to `STATUS_COLORS` / `STATUS_TAG_COLORS` so the `chartColors[]` fallback can't land on a near-identical green/red next to Returning Series / Canceled
- Simplified: label truncation inside the `useMemo`s (stable chart data, no animation replay on re-render), `countBarChart` helper for Languages/Networks/Actors/Creators, shared `axisTick`, `destroyOnHidden` on both `Tabs`

### Layout / Navigation (`AppLayout`)

- Navigating to a new page starts at the top. `Content` is the scroll container, and the router only resets window scroll, so e.g. clicking a ShowCard deep in the grid opened Show Detail scrolled partway down
- Mobile bottom nav is re-shown on entering the mobile breakpoint — it could stay hidden after a desktop round-trip with nothing to scroll to bring it back. Scroll events fired by browser scroll anchoring during that reflow are ignored for 800ms (only when already scrolled), so they aren't mistaken for a user scroll-down
- Trailing-slash URLs (`/shows/`, `/stats/`) now highlight the right nav item (sidebar + bottom nav `aria-current`) and show the right header title
- Fixed React "shorthand and non-shorthand properties" warning on `Content` (`padding` + `paddingBottom` → longhands)
- Simplified: antd tokens instead of hardcoded `isDark ? '#fff' : '#000'`, title derived from `NAV_ITEMS` (`PAGE_TITLES` removed), `onCollapse`/`collapsible` removed, scroll handler only sets state on an actual change

### Error Handling

- `RouteErrorBoundary` no longer clears an error in the same commit that caught it when a page crashes on the render that navigated to it (page threw twice, logged twice)

### Stats (`StatsBar` / `StatCard`)

- Hours Watched uses `totalHoursWatched` and matches the Dashboard (double rounding could put it 1h off)
- Card hover text uses the formatted value + suffix (`0.22 y`, not `0.2197…`)
- New shared `StatCard` tile (icon badge, colored top border; `compact` variant); Avg Rating neutral when unrated

### Show Cards

- `ShowCard` renders the shared `PosterThumb`, so a broken/404 poster URL falls back to the placeholder (was the browser's broken-image icon)

### Other

- `FilterBar`: status/sort options hoisted to module level, genre options memoized, `SECTION_GAP`
- `ShowGrid`: wrapper div removed, `SPACING.lg`
- New helpers: `utils/a11y.ts` (`activateOnKey`), `truncate()` in `derive.ts`, `avgRatingColor()` in `ui.ts`
- `.gitignore`: Playwright output dirs

### Security Review

- No findings in `src/components/` — no unsafe sinks; error messages render as escaped text; poster URLs only reach `<img src>`; pathname only compared against static keys

## [0.4.1] — 2026-11-23

Review pass over `src/` entry/root and `src/pages/` (code-review, simplify, security-review). All bugs below were pre-existing.

### Routing

- Added a catch-all `*` route → new `NotFoundPage` (Empty + "Back to Dashboard") — unknown URLs previously rendered a blank content area
- Added `RouteErrorBoundary` around the route `Outlet` in `AppLayout` — a render error or a failed lazy-chunk load (stale hashed chunk after a deploy) now shows `ErrorState` with a reload button instead of white-screening the whole app. Resets on pathname change without remounting the page
- `Suspense` moved from `App` into `AppLayout` (inside the boundary), so the Sider/Header stay mounted while a route chunk loads
- Idle route-chunk prefetch now swallows rejections (`.catch(() => {})`) — a failed prefetch no longer surfaces as an unhandled promise rejection; real navigation failures are caught by the boundary
- Header title / nav highlight use `useMatch('/shows/:id')` instead of `startsWith('/shows/')` — `/shows/12/extra` (a 404) no longer shows "Show Detail" with Shows highlighted

### Dashboard Page

- Poster thumbnails fall back to the `VideoCameraOutlined` placeholder on a broken/404 URL (`onError` in `PosterThumb`), not just on an empty `posterUrl`
- Avg Rating stat card uses a neutral color when there are no ratings — `'–'` → `parseFloat` NaN → `ratingColor(NaN)` was rendering it red
- Highlights, Continue Watching, and Recently Watched cards are now keyboard accessible (`role="button"`, `tabIndex`, Enter/Space), matching the Not Started list
- Simplified: shared `PosterThumb` / `ShowRowCard` / `activateOnKey` helpers replace 4 duplicated poster blocks and inline key handlers; Highlights rendered from a data array

### Shows Page

- Pagination bar no longer disappears when the page size exceeds the result count — it renders whenever results exceed the smallest page size (12), so the size picker stays reachable
- Last filter change no longer lost when navigating away within the 300ms save debounce — pending save is flushed on unmount
- Saved genre/status values that no longer exist in the CSV are dropped once data loads, instead of silently filtering to 0 results
- `loadFilters` type-checks each stored field individually (corrupt values fall back to defaults)

### Show Detail Page

- Air dates no longer one day early west of UTC — `'YYYY-MM-DD'` parses as UTC midnight, now also formatted with `timeZone: 'UTC'`. Invalid dates show `–` instead of "Invalid Date"
- Overview expand state resets when navigating between shows (`/shows/1` → `/shows/2` doesn't remount the page)
- "Show more" button shown based on actual clamp overflow (`ResizeObserver`, `scrollHeight > clientHeight`) instead of `overview.length > 200` — short-but-wrapped overviews on narrow screens were clamped with no way to expand

### Security / Hardening

- `settings.ts`: `getSettings()` returns `{}` for non-object JSON (array/null/primitive); `saveSetting()` catches storage errors (blocked/quota) instead of throwing
- `loadThemeName` uses an own-property check against `THEMES` — a stored `"__proto__"`/`"toString"` can't resolve to a prototype member

## [0.4.0] — 2026-08-01

### Mobile

- Sidebar's mobile behavior reworked twice this release. First pass: hidden `Sider` became a proper full-height overlay drawer (backdrop, in-drawer close button) — the original mobile collapse was a dead end (`collapsed={collapsed || broken}` meant the header's fold button could never actually open it). Second pass: replaced the drawer entirely with a fixed bottom nav bar (`Dashboard`/`Shows`/`Statistics`, icon + label, active-route highlight) — no hamburger, no drawer, matches native app nav conventions better on phone
- Bottom nav auto-hides on scroll (slides down via `transform: translateY(100%)`, 0.25s), reappears on scroll-up or near top of page — was covering page content (and, transiently, the Shows page's `Pagination`) while scrolling
- Desktop sidebar-collapse trigger moved from the Header into the bottom of the `Sider` itself, above the nav rail's mobile bottom-nav swap — Header no longer carries any menu-toggle button on desktop
- `ChartsSection`'s 4 tab labels shortened below the `sm` breakpoint ("Watch Time" → "Time", "People & Networks" → "People") — the long label was clipping mid-word against antd's tab-overflow "…" trigger on narrow screens
- `vite.config.ts`: `server.host: true` — dev server now binds `0.0.0.0`, reachable from other devices on the LAN (prints a Network URL alongside Local)

### Dashboard Page

- "Most Watched" spotlight replaced with a 3-card **Highlights** row: Most Watched, Top Rated, Newest Release
- Added a **Ratings** tab (rating-distribution mini bar chart) alongside the existing Top Genres/Watch Status sidebar tabs
- Added **Explore More** CTA row at the page bottom (links to Shows / Statistics)
- Stat cards redesigned: icon badge + colored top border + shadow, using `theme.chartColors[]` for the 3 non-semantic stats (was reusing `STATUS_COLORS['Canceled']` red for the Episodes-Watched card — a semantic mismatch) and keeping `ratingColor()`/`completionColor()` for the 2 value-driven ones
- "Continue Watching" cards flag `status === 'Returning Series'` with a "New eps" tag
- "Not Started" section now shows an "All caught up" fallback card instead of silently disappearing when every show has been started — the right sidebar column was ending far short of the left column's height with nothing there before
- All poster-fallback spots (4 on this page, plus `ShowCard.tsx`) switched from the 📺 emoji to the same `VideoCameraOutlined` (`opacity: 0.4`) placeholder `ShowDetailPage` already used — one of the 4 emoji instances had survived an earlier pass unnoticed

### Shows Page

- `FilterBar` wrapped in a themed Card (shadow + radius, matches Dashboard); added a result-count row ("X of Y shows") with closable filter chips (search/genre/status) and a "Reset filters" link — previously no way to see the total match count below 24 results, or clear filters except one at a time
- `ShowCard` given `borderRadius: 10` for visual consistency — deliberately did **not** add the Dashboard's drop-shadow treatment here: a 24-card grid with a shadow on every tile reads as noise, not polish; kept the existing `hoverable` lift instead

### Statistics Page

- `ChartsSection`'s 14 charts regrouped from one flat `Row` into 4 tabs — **Overview** (genres/status/language/age-rating/year), **Watch Time** (top-10/decade/release-year/depth), **Ratings** (distribution/scatter/completion-by-genre), **People & Networks** (networks/actors-creators)
- `StatsBar`'s 10 KPI tiles redesigned to match the Dashboard stat-card language (icon badge, colored top border, shadow)

### Show Detail Page

- "Show not found" state replaced a bare `<Button>` with the app's `Empty`-based pattern (matches Dashboard's zero-data state)
- Poster `<img>` now has an `onError` handler falling back to the "No Poster" placeholder — previously only triggered when `posterUrl` was empty, not when a real URL 404s
- Back button now checks `location.key === 'default'` (react-router's marker for "no history entry before this one") and falls back to `navigate('/shows')` instead of `navigate(-1)` — direct-linking straight to a show and clicking Back no longer risks landing nowhere
- All 8 cards on the page (4 inline stats + Show Details/Watch History/Cast/Keywords) given the shared shadow/radius treatment

### Fixes

- `AppLayout`/`ShowDetailPage`: the two scroll/route-driven state resets (bottom-nav visibility on navigation, poster-error flag on show change) were calling `setState` directly inside a bare `useEffect` — flagged by `react-hooks/set-state-in-effect`. Tried React's documented "adjust state during render" alternative (compare against a `last*` state value, `setState` in the render body when it differs) instead of an effect; it genuinely broke both resets under `React.StrictMode` — confirmed with a debug trace showing the state oscillating and settling on the wrong value after every navigation. Reverted both to the original `useEffect`s with a targeted `eslint-disable-next-line` and a comment explaining why, rather than ship a lint-clean regression
- `FilterBar`: unescaped `"` characters around the search-term chip (`react/no-unescaped-entities`)
- None of the above had been caught before this pass — `npm run build` doesn't run ESLint, only `npm run lint` does, and it hadn't been run since these were introduced earlier in the same body of work

### Shared

- Added `cardShadow(isDark)` to `src/constants/ui.ts` — the shadow formula (`0 6px 20px rgba(0,0,0,0.35)` dark / `0 4px 16px rgba(30,30,63,0.08)` light) was duplicated inline across Dashboard, FilterBar, ChartsSection, StatsBar, and Show Detail; now one shared helper

## [0.3.1] — 2026-07-15

### Fixes

- Regenerated `package-lock.json` — top-level `version` field had been stale since `0.0.1` and never resynced across releases, masking a real conflict: `vitest@4.1.5`'s nested `vite@8` needs `esbuild ^0.27||^0.28`, incompatible with the top-level `vite@5.4.21`'s `esbuild ~0.21`. `npm ci` (CI's install command) correctly refused to dedupe them; local `npm install` silently tolerated it

### Docs

- README: expanded intro, added Live Demo line, Screenshots (6 real captures: Dashboard, Shows, Show Detail, Statistics, Mobile, Default Light theme), Highlights section, Mermaid architecture/data-flow diagram, Testing/Performance/CI sections, License section, Future Improvements, alphabetized Project Structure tree, accurate dependency versions
- Added `.env.example` documenting `TMDB_API_KEY` for `series-search.py`
- CLAUDE.md: documented the lock-file resync gotcha above

## [0.3.0] — 2026-07-15

### Dashboard Page

- Added "Most Watched" spotlight banner (top show by watch time; hidden if nothing watched)
- Added Completion Rate as a 5th stat card; Avg Rating and Completion Rate borders now color by value (`ratingColor`/`completionColor`) instead of a fixed color array
- Stat row switched from fixed `xs/sm` column spans to `Col flex="1 1 180px"` — wraps naturally regardless of card count
- Added empty state (`Empty` + Refresh button) for `data.length === 0`, matching `ShowGrid`'s existing convention
- Top Genres / Watch Status sidebar cards now have leading icons

### Sidebar / Layout

- Collapse trigger moved from the default Ant Design `Sider` footer button into the header (fold/unfold icon next to the page title)
- Manual collapse now shows an icon-rail (`collapsedWidth: 80`) instead of fully hiding the sidebar; nav icons stay clickable with hover tooltips (built-in antd behavior). Mobile breakpoint collapse still fully hides (tracked as a separate `broken` state)
- `Content` capped at `maxWidth: 1600` and centered — collapse now shifts margin instead of reflowing page content inconsistently between pages
- Fixed header page-title wrapping mid-word at narrow viewports (`ellipsis` + `minWidth: 0`)

### Performance

- Search filter persistence debounced 300ms (was a synchronous `localStorage` write per keystroke)
- `FilterBar`'s `uniqueGenres(data)` now memoized — was recomputing every keystroke
- Shows/Statistics/ShowDetail route chunks idle-prefetched after initial mount
- All 14 Recharts `ResponsiveContainer`s given `debounce={200}` — fixes visible lag during sidebar collapse (each was re-rendering on every animation frame)
- `DashboardPage` list thumbnails given `loading="lazy"` (hero image on Show Detail intentionally excluded — above the fold)

### Fixes

- `LoadingState`: fixed antd v5 `Spin` warning ("`tip` only work in nest or fullscreen pattern") by nesting a child
- `FilterBar`: added `id`/`name` to all 4 form fields (DevTools accessibility warning)

## [0.2.1] — 2026-07-15

### Security

- `series-search.py`: TMDB API key no longer hardcoded — read from `TMDB_API_KEY` env var, script raises if unset
- Git history rewritten to scrub the previously-committed key from all past commits (force-pushed)
- Repo made public

## [0.2.0] — 2026-06-29

### Statistics Page

- Removed `Collapse` wrapper — charts always visible on Statistics page
- `StatsBar` reordered: Hours/Minutes/Years Watched grouped at positions 7–9
- Added 3 new charts: Language Breakdown (horizontal bar), Age Rating Distribution (vertical bar), Seasons Watched Depth (vertical bar)
- Added 3 derive functions: `languageDistribution`, `ageRatingDistribution`, `seasonsWatchedDepth`
- Pie chart legends now fade in via `onAnimationEnd` + CSS opacity transition — no longer appear before slices animate

### Shows Page

- Default sort changed to **Recently Watched** (CSV row order, newest first); new `recentFirst` SortKey added to `FilterBar`
- Search extended to match genres, creators, and networks (previously only name, actors, keywords)
- Search placeholder updated: "Search by title, person, genre, keyword…"
- Fixed card resize bug: `ShowGrid` replaced `ResizeObserver` with `Grid.useBreakpoint()` — eliminates layout-shift-induced column count collapse
- Fixed scrollbar layout shift: `AppLayout` Content `overflow: auto` → `overflowY: scroll` (stable gutter width)

### Show Detail Page

- Overview: 4-line clamp with expand/collapse toggle (rendered when overview > 200 chars)
- Show Details card: added Vote Count and First Air Date (full formatted, e.g. "Sep 17, 2021")
- Last Air Date now formatted consistently (was raw ISO string)
- Poster fallback: replaced 📺 emoji with styled `VideoCameraOutlined` placeholder, `aspectRatio: 2/3`
- Seasons tracker tags: `CheckCircleOutlined` (watched) / `ClockCircleOutlined` (not watched)
- Spacing standardized with `SECTION_GAP` throughout the page

### Themes

- Removed AMOLED and Catppuccin — 3 themes remain: **Default Dark**, **Default Light**, **Dracula**
- Default Light: chart colors replaced with Tailwind-600 level palette for better contrast on white
- Default Light: added `colorTextBase: '#000000'` for darker text rendering
- Default Light: tighter `borderColor` (#d9d9d9), crisper `chartGrid` (#e0e0e0), fully black `chartText`
- `Theme.token` type extended with optional `colorTextBase`

### CSV Generator

- Added `series-search.py` — Tkinter desktop app that queries TMDB API to build/maintain `tv_series.csv`
- `README.md` updated with "Generating the CSV" section: setup, usage workflow, field documentation
- `features.txt` created with full feature inventory
- `.gitignore` updated: added `__pycache__/`, `*.pyc`, `*.pyo`, `.claude/memory/`

---

## [0.1.0] — 2026-06-27

### Architecture

- Added `src/constants/ui.ts` — centralized `GENRE_COLORS`, `ratingColor()`, `completionColor()`, `STATUS_COLORS`, `STATUS_TAG_COLORS`, `SPACING`, `SECTION_GAP`
- Added `src/utils/settings.ts` — `getSettings()` / `saveSetting()` replacing ad-hoc `localStorage` JSON-merge in `App.tsx` and `ShowsPage.tsx`
- Added `src/components/LoadingState.tsx` and `src/components/ErrorState.tsx` — shared components replacing 4× duplicated inline Spin/Alert patterns
- Added `CLAUDE.md` with architecture documentation

### Theme System

- Extended `Theme` type with `borderColor` and `posterFallbackBg` fields
- Updated all 5 themes (Default Dark, Default Light, AMOLED, Dracula, Catppuccin) with the new fields
- All poster fallback backgrounds now read from `theme.posterFallbackBg` — previously hardcoded `#1a1a2e` in 5 places, broken on light themes
- `Progress strokeColor` now uses `theme.token.colorPrimary` instead of hardcoded `#1677ff`
- `AppLayout` border color now reads from `theme.borderColor` instead of inline conditional

### Removed Duplicates

- `GENRE_COLORS` de-duplicated: was defined identically in `ShowCard.tsx` and `ShowDetailPage.tsx`; now imported from `src/constants/ui.ts`
- Rating color logic de-duplicated: was in `ShowCard.tsx` and `ShowDetailPage.tsx`; now `ratingColor()` from constants
- Completion color logic de-duplicated: was in `ShowDetailPage.tsx` (Ant Design palette) and `ChartsSection.tsx` (Tailwind palette, different values); now `completionColor()` with unified palette
- Status color maps de-duplicated: was `STATUS_COLORS` (hex) in `DashboardPage` and `STATUS_COLOR` (Ant Design strings) in `ShowDetailPage`; both now imported from constants

### Dead Code Removed

- `react-window` and `@types/react-window` removed from `package.json` (never imported)
- `retryCountRef` removed from `src/hooks/useTvData.ts` (declared but never read or incremented)
- `onFilter` and `activeFilter` props removed from `ChartsSection` (implemented but wired to no-ops in `StatisticsPage`)
- Click-to-filter handlers (`handlePieClick`, `handleBarClick`) and cell opacity conditionals removed from charts

### Bug Fixes

- `ShowDetailPage` now correctly handles data-load errors (previously ignored `error` from context, showed "Show not found" instead)
- Hero stat cards in `ShowDetailPage` now have responsive breakpoints (`xs={12} sm={6}`) — previously `span={6}` only, cramped on mobile

### UI Consistency

- Section `marginBottom` standardized to `SECTION_GAP` (24px) — previously mixed 20px and 24px
- Recharts axis tick `fontSize` standardized to `11` across all charts — previously 10, 11, or 12 per chart
- "Watch Time by Decade" AreaChart now uses responsive `chartHeight` — previously hardcoded `height={220}`
- `peopleBarChart` YAxis width changed from 120 to 110 for consistency with other horizontal bar charts

### Performance

- `StatsBar` wrapped in `React.memo`; all 8 derive calls wrapped in a single `useMemo`
- `ShowGrid` wrapped in `React.memo`

---

## [0.0.1] — 2026-05-08

Initial release.
