# Bug Backlog

## Open

Found during the 0.4.14 ideas pass and the Entry / root OpenSpec proposals (not fixed yet — each points to its `IDEAS.md` entry or planned OpenSpec change). Contrast ratios are WCAG relative-luminance values against the theme's `contentBg` unless stated.

- [ ] `ShowDetailPage` / `completionRate` — completion above 100% when `Episodes Watched` > `Total Episodes` (TMDB count changed after saving). **Confirmed in the real CSV:** Farming Life in Another World 24 / 13 → "185%", Spartacus: Gods of the Arena 6 / 1 → "600%". Decide the rule once (IDEAS → Utils `progressState`, soft data-quality warnings) and clamp the display
- [ ] `StatCard` — tint built as `${color}40` / `${color}22` breaks on non-6-digit colors. **Real path:** Avg Rating falls back to `theme.chartText` (`#ccc` in Default Dark) when no show is rated → `#ccc40` is invalid, border/badge background dropped (IDEAS → Components "Robust tint colors")
- [ ] `constants/ui.ts` `GENRE_COLORS` — Crime (26 shows) and Documentary / Family / Kids / War & Politics / Reality render as grey `default`; 6 entries are TMDB movie genres that never occur (IDEAS → Constants P1)
- [ ] `series-search.py` `CsvStore.update` — updating an existing show rewrites the row in place, so a re-watched show never reaches "Recently Watched" / `recentFirst` (row order is the watch history) (IDEAS → Outside `src/` P1)
- [ ] `ChartsSection` / Dashboard Ratings chart — Recharts tooltips use the default white box + grey cursor in Default Dark / Dracula (no `contentStyle`) (IDEAS → Components P1)
- [ ] `utils/a11y.ts` `activateOnKey` — holding Enter on a focused card fires `navigate` repeatedly (no `e.repeat` check) (IDEAS → Utils P2)
- [ ] `ShortcutsHelp` — Escape pressed within ~300ms of opening the `?` cheat sheet doesn't close it: antd moves focus into the Modal only after its open animation, and Escape is handled there (immediate under reduced motion). Fix: `Modal` `autoFocus` / focus the dialog on open, or close on Escape from `GlobalShortcuts` while open. Found 2026-11-25 writing `e2e/shortcuts.spec.ts` (which waits for focus to move in)
- [ ] `useTvData` — `HTTP 404: ` with a trailing colon when `statusText` is empty (HTTP/2); timeout message blames a missing file, which actually fails fast (IDEAS → Hooks P2)
- [ ] `useTvData` — **verify:** on SPA hosts (and possibly Vite dev) a missing `/tv_series.csv` returns `200` + `index.html`, reported as a confusing "missing columns" error (IDEAS → Hooks P1)
- [ ] CI — `node-version: 20` is past end-of-life (April 2026); the CLAUDE.md lock-file rule assumes it (IDEAS → Outside `src/` P1)
- [ ] Build copies everything in `public/` into `dist/` — including the personal `tv_series.csv.bak` (and `tv_series.csv` itself), so deploying `dist/` as-is publishes them. Not in the service-worker precache, but downloadable. Exclude backups from the copy (or move them out of `public/`), and decide how the real CSV gets deployed. Found 2026-11-25 while checking the PWA build output

## Fixed in 0.4.30 (2026-11-25)

Code review of 0.4.24–0.4.29:

- [x] Custom theme — a pale / white accent on Light (or black on Dark) was used raw as `colorPrimary`: progress bars, highlights, the nav progress bar, area / rating charts and the active bottom-nav item became invisible. `colorPrimary` is now the readable chart color 0
- [x] Primary-button text — antd always uses white (`colorTextLightSolid`); on High Contrast's yellow that was ~1.9:1, and Dracula / Nord / Solarized Light / pale Custom accents also failed 4.5:1. Now white or black by contrast with the primary antd actually renders (`antdThemeConfig`), checked by the theme contract
- [x] Cross-tab sync — another tab's unrelated save within 300ms of a Custom accent change reverted this tab's picker / theme, then the pending save wrote the new accent anyway (tabs disagreeing)
- [x] Router — `createBrowserRouter` in a `useState` initializer: StrictMode made a second router that stayed subscribed to `popstate` and was never disposed (also one per `App` mount in tests)
- [x] `/` shortcut — pressed on Shows while its data / code was loading did nothing; a request for a Shows visit that never happened (replaced or failed navigation) focused the search on a later, unrelated visit
- [x] Relative build base (`--base=./`) — router basename `.` and a CSV URL that followed the current route
- [x] Header — Custom's picker + base switch + select overflowed the header on 320–360px phones (now a "Customize" popover below `md`)
- [x] Accent presets — `#6366f1` listed twice

## Fixed in 0.4.24 (2026-11-25)

- [x] Navigation — moving to a page whose code wasn't loaded yet swapped the current page for a full-content spinner (`Suspense` fallback); the current page now stays with a progress bar (`NavProgress`, data router)
- [x] Data router migration — React Router's error boundary only renders the `errorElement` for `error !== undefined`, so a page doing `throw undefined` escaped to the full-app recovery screen. Found by the spike's e2e before release; `UndefinedThrowGuard` keeps it in the layout

## Fixed in 0.4.23 (2026-11-25)

- [x] `index.html` — favicon `<link rel="icon" href="/tv.svg">` pointed at a file that didn't exist — `public/tv.svg` added (indigo TV, also the source of the PWA icons)
- [x] `RootErrorBoundary` — with the shell crashed, Reload kept serving the precached broken build: `UpdatePrompt` (inside the shell) couldn't apply the waiting fix and a plain reload doesn't activate it — Reload now calls `activateWaitingServiceWorker()` first (code review)
- [x] `UpdatePrompt` — long-open tabs / installed windows never checked for a new build, and a dismissed prompt never came back (hourly + on-visible update check, prompt re-shown on visibility); Reload in one tab reloaded every other prompted tab unannounced, dropping a pending debounced filter save (`onNeedReload` — others are told instead) (code review)
- [x] Service worker — `/tv_series.csv` opened in a tab got the app shell ("Page not found") via the navigation fallback (`navigateFallbackDenylist` for file extensions); a slow-but-online CSV fetch (> 3s) silently fell back to the cached copy (timeout 8s) (code review)
- [x] `OfflineNotice` — "showing saved data" with nothing loaded (offline first visit) — "You're offline" then (code review)

## Fixed in 0.4.21 (2026-11-25)

- [x] Second dashboard tab kept the old theme until reloaded after a theme change in another tab — now synced live via the `storage` event (`subscribeSettings`); corrupt values ignored (OpenSpec `sync-settings-across-tabs`)

## Fixed in 0.4.20 (2026-11-25)

- [x] Rating badges (`ShowCard`, Show Detail) — white text on tier fills: 2.27:1 on green `#52c41a`, 1.9:1 on amber `#faad14` — now the theme's `tiers.*.onFill` (≥ 4.5:1 vs the fill, contract test + e2e) (OpenSpec `add-semantic-theme-colors`)
- [x] Default Light — rating / completion tier colors on `#f5f5f7` were green 2.08:1, amber 1.75:1 — now `#237804` (5.13:1) / `#a05e00` (4.71:1) / `#cf1322` (5.12:1)

## Fixed in 0.4.19 (2026-11-25)

- [x] Mixed-case URL (`/Stats`) → right page, but "Page not found" title + no nav highlight (`normalizePath` lowercases)
- [x] `RootErrorBoundary` / `RouteErrorBoundary` — `throw undefined` / `throw null` re-rendered the crashing tree → blank page; `String(error)` could throw on a null-prototype object (`hasError` + `errorMessage()`)
- [x] `?reset` — boot script painted the saved theme first, then React switched to System (flash); boot script now skips the saved theme with `reset`
- [x] `consumeResetParam` — `URLSearchParams.delete` rewrote the other params (`debug` → `debug=`, `%20` → `+`); now raw segments
- [x] `AnimatedPie` — turning reduced motion off while Statistics was open hid both legends for the replayed animation (latched)
- [x] `pageTitleFor` — blank show Name → empty header / ` · TV Dashboard` tab (`Untitled show`)
- [x] Theme boot script injected before `<meta charset>` (`head-prepend` → `head`)
- [x] `findShow` — `/shows/0x1`, `/shows/1e0`, `/shows/01` resolved to show 1 (`Number()` quirks; pre-existing) — canonical ids only
- [x] Default Light — chart colors below the 3:1 for graphics on `#f5f5f7`: lime `#65a30d` 2.84:1 → `#4d7c0f` (4.59:1), and amber `#d97706` 2.93:1 → `#b45309` (4.61:1) — the second one was missed by the ideas pass and caught by the new theme contract test (`themes.test.ts`, OpenSpec `refactor-typed-theme-provider`)

## Fixed in 0.4.17 (2026-11-25)

- [x] Accessibility — the OS "reduce motion" setting was ignored: every chart replayed its entry animation on each tab switch, the pie legend faded in, antd components animated and the mobile bottom nav slid on every scroll-direction change. All off under reduced motion now; the pie legend no longer waits for `onAnimationEnd` (which never fires without animation) (`respect-reduced-motion`)

## Fixed in 0.4.16 (2026-11-25)

- [x] App shell — a render error outside a page (`ThemeProvider` / `ConfigProvider` / `TvDataProvider` / router / `AppLayout`) left a blank white page with no way out, and bad saved settings survived a reload. Now `RootErrorBoundary` shows a recovery screen (Reload / Reset saved settings) and `?reset` clears settings before the app starts (`add-root-error-safety-net`)

## Fixed in 0.4.15 (2026-11-25)

- [x] Theme — Light / Dracula users saw a dark or white flash before React mounted (`index.html` had no background); now an inline boot script generated from `themes.ts` paints the theme first (`add-system-theme-and-color-scheme`)
- [x] Theme — scrollbars (`Content` is the scroll container), autofill and native controls stayed light in the dark themes; `<html>` now gets the theme's `color-scheme` + background
- [x] Theme — first visit always landed on Default Dark regardless of the OS setting; new default is System (follows `prefers-color-scheme`)
- [x] Show Detail header said `Show Detail` instead of the show name, and every tab / history entry was just `TV Dashboard` (`add-route-document-titles`)
- [x] `e2e/dashboard.spec.ts` — Highlights navigation test flaky (~1 in 3): `toHaveURL` passed before the lazy Show Detail page committed, so `goBack()` raced the pending render, which then stole focus from the next card. Now waits for the page title too
- [x] `main.tsx` — missing `#root` gave React's opaque `Target container is not a DOM element` (`tidy-root-entry`)

## Fixed in 0.4.13 (2026-11-24)

- [x] `series-search.py` — `CsvStore.update` could truncate the CSV (open "w", then a bad extra-field row raised mid-write)
- [x] `series-search.py` — Excel UTF-8 BOM hid existing rows → duplicate TV IDs appended
- [x] `series-search.py` — same season counted twice (two panels / file changed while fetching)
- [x] `series-search.py` — save errors only printed to the console (no dialog)
- [x] `ShowDetailPage` — stat tile values clipped / overflowing at 600–1250px (regression within 0.4.13)
- [x] `package.json` — `test:gen` assumed a `python` command
- [x] `series-search.py` — network calls blocked the Tk main thread (window froze during search / save / season fetches)
- [x] `series-search.py` — API key could appear in an error dialog (request URL in the error text)
- [x] `series-search.py` — a failed Next / Prev left the page counter on the new page while the table showed the old one
- [x] `series-search.py` — Next / Prev paged whatever was typed in the entry, not the search on screen

## Fixed in 0.4.11 (2026-11-24)

- [x] `ThemeToggle.tsx` — `Select` had no `id` / accessible label (form-field convention)
- [x] `series-search.py` — Enter / Next / Prev mid-load desynced the page counter from the table (regression from 0.4.10)
- [x] `series-search.py` — failed season fetch saved the season with 0 episodes, blocking re-add
- [x] `derive.ts` `completionByGenre` — plain-object map indexed by CSV genres (`__proto__` / `constructor`)
- [x] `parseSeriesCsv` — fractional / huge `Seasons` (freeze or "2 / 2.5" on Show Detail)
- [x] `parseSeriesCsv` — zero / negative `Episode Runtime` shown as "-5 min"
- [x] `package.json` — `antd ^5.17.0` allowed versions without `Tabs` `destroyOnHidden`

## Fixed in 0.4.10 (2026-11-24)

- [x] `series-search.py` — saved seasons unchecked in the season picker (regression within this pass)
- [x] `series-search.py` — appends ignored the existing header (values under wrong columns)
- [x] `series-search.py` — Tk dialogs opened from worker threads
- [x] `series-search.py` — overlapping searches via Enter during a load
- [x] `series-search.py` — `—` saved as Seasons / Episode Runtime
- [x] `series-search.py` — buttons stuck disabled after a thread error
- [x] `series-search.py` — failed fetch reported as "All seasons already saved"
- [x] `series-search.py` — search terms not URL-encoded
- [x] `eslint.config.js` — `dist/` linted by `eslint .` / editors (regression within this pass)

## Fixed in 0.4.9 (2026-11-24)

- [x] Year "0" shown for a missing first-air year (ShowCard, Dashboard, Show Detail); Year ↓ sort treated 0 as a real year
- [x] Dashboard Not Started list showed "★ 0.0" for unrated shows
- [x] Show Detail "Seasons Watched N / 0" for a missing season count
- [x] Show Detail showed an "N/A" age-rating / language tag
- [x] `parseSeriesCsv` — duplicate / invalid Seasons Watched entries inflated the count ("1,1,2" → 3)
- [x] `SortKey` without a `SORT_OPTIONS` entry compiled but silently vanished (and reset saved sort)

## Fixed in 0.4.8 (2026-11-24)

- [x] `FilterBar` — status filter offered statuses absent from the data (always 0 results); unknown statuses not selectable
- [x] `ui.ts` — status/genre lookups returned inherited `Object.prototype` members for keys like `constructor`, skipping fallbacks (also in `derive.ts` count maps)
- [x] `ui.ts` — Canceled drawn in two different reds (bar vs Tag)
- [x] `DashboardPage` — unknown statuses drawn in Ended grey (Statistics used a theme color)
- [x] `ui.ts` — literal status keys not type-checked (typo → `undefined` color)

## Fixed in 0.4.6 (2026-11-24)

- [x] `parseSeriesCsv` — skipped rows were console-only; shows could silently vanish (now a warning banner; all rows skipped is fatal)
- [x] `parseSeriesCsv` — empty CSV showed "Unable to auto-detect delimiting character" instead of the empty state
- [x] `parseSeriesCsv` — duplicate TV IDs accepted (duplicate keys, unreachable `/shows/:id`, double-counted stats)
- [x] `parseSeriesCsv` — skip warnings named the wrong line after a multi-line Overview
- [x] `derive.ts` `truncate` — split emoji surrogate pairs; `max < 2` returned a longer string

## Fixed in 0.4.4 (2026-11-24)

- [x] `parseSeriesCsv` — broken quote silently dropped every later row (regression from 0.4.3's row-skipping)
- [x] `useTvData` — retained `refetch` called after unmount started a fetch and set state
- [x] `useTvData.test.ts` — no coverage for stale-response handling; calls outside `act()`; stubbed `fetch` never removed

## Fixed in 0.4.3 (2026-11-24)

- [x] `TvDataContext` — editing the provider file in dev could crash an open page (Fast Refresh recreated the context)
- [x] `TvDataContext` — consumer outside the provider got a fake endless loading state
- [x] `useTvData` — one malformed CSV row failed the whole load for every page
- [x] `useTvData` — blank/invalid `TV ID` → duplicate keys, `/shows/0` or `/shows/NaN`
- [x] `useTvData` — failed refetch left stale data next to the error

## Fixed in 0.4.2 (2026-11-24)

- [x] `ShowCard` — no 404 poster fallback (now renders `PosterThumb`)
- [x] `ChartsSection` — pie legends visible while pies replay after tab revisit
- [x] `ChartsSection` — Status donut fallback colors could match Returning Series / Canceled
- [x] `ChartsSection` / `derive.ts` — watch-time tooltip showed fractional minutes ("2h 5.5m")
- [x] `AppLayout` — new page opened at previous scroll offset
- [x] `AppLayout` — mobile bottom nav stuck hidden after desktop round-trip (incl. scroll-anchoring re-hide)
- [x] `AppLayout` — trailing-slash URLs: no nav highlight, generic title
- [x] `AppLayout` — React padding shorthand/longhand rerender warning
- [x] `RouteErrorBoundary` — error cleared in the same commit as a navigation crash
- [x] `StatsBar` — Hours Watched could differ by 1h from Dashboard
- [x] `StatsBar` — hover text showed unrounded value

## Fixed in 0.4.1 (2026-11-23)

- [x] `DashboardPage` `PosterThumb` — no 404 fallback
- [x] `DashboardPage` — Avg Rating card red when no ratings
- [x] `DashboardPage` — Highlights / Continue Watching / Recently Watched cards not keyboard accessible
- [x] `ShowsPage` — pagination bar (and size picker) vanishes when page size > result count
- [x] `ShowsPage` — last filter change lost on navigate (debounced save cancelled on unmount)
- [x] `ShowsPage` — saved genre/status absent from data filters to 0 results
- [x] `ShowDetailPage` — air dates one day early west of UTC; "Invalid Date" on bad input
- [x] `ShowDetailPage` — overview stays expanded across shows
- [x] `ShowDetailPage` — no "Show more" on narrow screens (length-based check)
- [x] `AppLayout` / `NotFoundPage` — `/shows/12/extra` showed "Show Detail" header + Shows nav highlighted
- [x] Unknown routes rendered blank (no 404 route)
- [x] Page crash / failed lazy chunk white-screened the app (no error boundary)
- [x] `settings.ts` threw on blocked/full storage; non-object JSON passed through
