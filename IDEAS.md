# IDEAS

Review tracker — status per module. ✅ done · 🟡 in progress · ⬜ not started. Bugs live in [BUG_BACKLOG.md](BUG_BACKLOG.md).

_Last updated 2026-11-24 (v0.4.13)._ All modules reviewed (simplify + code-review + security-review), plus whole-project simplify + code-review passes in v0.4.11 and v0.4.13. Test coverage: 80 unit, 17 e2e (Playwright, CI), 37 generator checks (`npm run test:gen`, local).

## Next Up

1. ~~Manual run of `series-search.py`~~ — ✅ 2026-11-24: driven through its real Tk widgets (Enter key, buttons, season checkboxes, Confirm) from a scratch copy with TMDB faked — 25/25: search + details fill, Enter / Next / Prev / Search mid-load keep the page counter in sync, new show appended (Seasons / Runtime from details, not `—`), saved seasons shown checked + disabled, existing row updated in place, failed season skipped + reported + still addable, all-failed saves nothing, API key never in the CSV. Harness confirmed to catch the old paging bug. Not covered: real TMDB responses (needs a live key).
2. ~~Browser check~~ — ✅ 2026-11-24 (Playwright, synthetic CSV via route interception, 37/37 twice): `CsvWarningBanner` (count, record numbers, duplicate / invalid ID, dismiss), Highlights via `ShowRowCard` (right shows, aria-labels, click / Enter / Space navigate, broken-poster fallback), `'–'` for blank / 0 / N/A / fractional / huge / negative values on Dashboard, Show Detail and Shows (no `N/A`, `0.0`, `2.5`, `-5 min`; `1e7` seasons renders instantly), URL-keyed poster fallback across SPA navigation, search, `#theme-select`; real CSV: no banner, no console errors, all posters load.
3. ~~Quick fix: `ThemeToggle` `Select` `id`~~ (done in v0.4.11)
4. ~~Make the Playwright check permanent~~ — ✅ v0.4.12: `e2e/` + `npm run e2e` + CI `e2e` job; generator check is `npm run test:gen` (local only).
5. ~~`series-search.py` off the main thread + `App` class~~ — ✅ v0.4.13: `TmdbClient` / `CsvStore` / `App`, workers + polled result queue, API key redacted from errors, importable (`npm run test:gen` imports it).
6. ~~v0.4.11 simplify skips~~ — ✅ v0.4.13: `ratingColor(null)` + `formatRating`, exported `STATUSES` (derived maps removed), `StatCard` `formatter` on Show Detail, `BottomNav` component, `STAR_COLOR` (kept gold, by choice).
7. ~~Optional cleanups~~ — ✅ v0.4.13: CSV `N/A` → `''` (114 cells, backup `public/tv_series.csv.bak`), `status: KnownStatus | (string & {})`, `tsc -b` build.

## Project Modules

### Entry / root (`src/`) — ✅ Review complete (2026-11-23: code-review, simplify, security-review)
- `main.tsx` — entry point, React.StrictMode
- `App.tsx` — provider stack + routes
- `ThemeContext.tsx` — `ThemeProvider` + `useTheme()`
- `themes.ts` — `Theme` type, 3 themes (Default Dark, Default Light, Dracula)
- `setupTests.ts` — test setup

### Pages (`src/pages/`) — ✅ Review complete (2026-11-23: simplify, code-review, security-review)
- `DashboardPage.tsx`
- `ShowsPage.tsx`
- `ShowDetailPage.tsx`
- `StatisticsPage.tsx`
- `NotFoundPage.tsx` — catch-all `*` route (added 2026-11-23)

#### Code-review findings — ✅ all 10 fixed in v0.4.1 (2026-11-23)
Full list + remaining open items in [BUG_BACKLOG.md](BUG_BACKLOG.md). Fix notes in CHANGELOG `[0.4.1]`.

#### Security-review — ✅ no findings (2026-11-23)
No unsafe sinks in `src/` (`dangerouslySetInnerHTML`/`innerHTML`/`eval`/`href`/`window.open`/`location.*`); CSV text rendered via React escaping; `:id` only used in `Number(id)` lookup; `navigate()` targets are static or numeric; localStorage reads type-checked.

### Components (`src/components/`) — ✅ Review complete (2026-11-23/24: simplify, code-review, security-review, Playwright browser check)
- `AppLayout.tsx` — Sider + Header + Content shell; hosts `RouteErrorBoundary` + `Suspense` around `Outlet`
- `BottomNav.tsx` — mobile bottom nav with its own scroll-driven visibility state (extracted from AppLayout in v0.4.13)
- `ChartsSection.tsx` — 14 Recharts charts in 4 tabs; `AnimatedPie` child owns pie legend fade (added 2026-11-24)
- `ShowCard.tsx`
- `ShowGrid.tsx`
- `StatsBar.tsx`
- `FilterBar.tsx`
- `ThemeToggle.tsx`
- `LoadingState.tsx`
- `ErrorState.tsx`
- `RouteErrorBoundary.tsx` — catches page render / lazy-chunk errors, resets on pathname change (added 2026-11-23)
- `PosterThumb.tsx` — poster + `VideoCameraOutlined` fallback for empty OR broken/404 URL; used by Dashboard + ShowCard (added 2026-11-23)
- `StatCard.tsx` — stat tile (icon badge, colored top border); `compact` variant for StatsBar (added 2026-11-23)

#### Simplify — ✅ 16 fixes applied (2026-11-23)
- **New shared helpers:** `PosterThumb`, `StatCard`, `utils/a11y.ts` (`activateOnKey`), `truncate()` in `derive.ts`, `avgRatingColor()` in `ui.ts` (removed in v0.4.8)
- **ChartsSection:** `formatRuntime` in watch-time tooltip (was 90m → "2h 30m"); truncation inside `useMemo`s (stable chart data, no animation replay); `countBarChart` helper for Languages/Networks/Actors/Creators; shared `axisTick`; dropped no-op `useCallback`; `destroyOnHidden` on both `Tabs`; Status pie uses `STATUS_COLORS`
- **AppLayout:** antd tokens instead of hardcoded `isDark ? '#fff' : '#000'`; title from `NAV_ITEMS` (`PAGE_TITLES` removed); removed wrapper div + dead `|| '/'`; removed `onCollapse`/`collapsible`; scroll handler only sets state on change
- **FilterBar:** status/sort options hoisted to module level, genre options memoized, `SECTION_GAP`
- **StatsBar:** one runtime sum → hours/years; Avg Rating no longer red when unrated
- **ShowGrid:** wrapper div removed, `SPACING.lg`
- **LoadingState callers:** default tip no longer passed
- Side effect: closes the `ShowCard` 404 poster bug

#### Code-review — ✅ all 10 findings fixed in v0.4.2 (2026-11-24)
Pie legend replay (important), mobile nav stuck hidden, scroll not reset on navigation, error-boundary double throw, trailing-slash nav, Hours double rounding, status fallback colors, hover-text precision, `formatRuntime` fractions, stale CLAUDE.md poster note. Details in CHANGELOG `[0.4.2]`.

#### Security-review — ✅ no findings (2026-11-24)
No `dangerouslySetInnerHTML`/`innerHTML`/`eval`/`new Function`/`window.open`; `error.message` rendered as escaped text; `posterUrl` only reaches `<img src>`; pathname only compared to static `NAV_ITEMS` keys; `tvdash-sidebar` read is a strict `=== 'true'`.

#### Browser check (Playwright) — ✅ 21/21, 3 consecutive runs (2026-11-24)
Ad-hoc script (not in repo): routes + titles, 404, trailing slash, scroll reset, pie legend fade on tab revisit, StatsBar hover text, Hours parity with Dashboard, mobile nav hide/show + desktop round-trip, no console errors. Surfaced 2 extra fixes: scroll-anchoring re-hiding the mobile nav, `Content` padding warning.
- [x] Status pie colors (fixed per status; In Production/Planned/Pilot added in v0.4.2)
- [x] Pie entry animation + legend fade on returning to Overview tab
- [ ] Sidebar collapse persists across desktop ↔ mobile resize (not covered by script)

#### Skipped / deferred
- Fully data-driven chart config (large rewrite; `countBarChart` covers most of it)
- ~~Single `STATUSES` source~~ (done in v0.4.8); ~~`SORT_OPTIONS` duplication~~ (done in v0.4.9)
- ~~`cardStyle(isDark)` helper~~ (done in v0.4.11)

#### Follow-ups
- ~~`ThemeToggle` `Select` has no `id`~~ (done in v0.4.11)
- ~~Permanent Playwright e2e suite~~ (done in v0.4.12)

### Context (`src/context/`) — ✅ Review complete (2026-11-24: simplify, code-review, security-review, Playwright check)
- `TvDataContext.tsx` — `TvDataProvider` only (passes `useTvData()`'s memoized value straight through, v0.4.11)
- `useTvDataContext.ts` — context object (`null` default) + `useTvDataContext()` that throws outside the provider; component-free for Fast Refresh (added 2026-11-24)

#### Simplify — ✅ 3 fixes (2026-11-24)
Context type from `ReturnType<typeof useTvData>`; `null` default + throwing hook; memoized provider value.

#### Code-review — ✅ all 5 findings fixed in v0.4.3 (2026-11-24)
Fast Refresh context recreation (file split), misleading memo comment, plus 3 older `useTvData` bugs: row-level parse errors fatal, unchecked `TV ID`, stale data on failed refetch. Details in CHANGELOG `[0.4.3]`.

#### Security-review — ✅ no findings (2026-11-24)
Fixed fetch URL; no `eval`/`Function`/unsafe deserialization/HTML sinks; `console.warn` only logs CSV line numbers + show names.

#### Browser check (Playwright) — ✅ (2026-11-24)
Real CSV loads all 159 shows with 0 skip warnings; editing `TvDataContext.tsx` with `/shows` open hot-reloads with no error; no console errors.

### Hooks (`src/hooks/`) — ✅ Review complete (2026-11-24: simplify, code-review, security-review)
- `useTvData.ts` — fetch lifecycle only (controller-identity staleness, `mountedRef`, `timedOut` flag); parsing delegated to `utils/parseSeriesCsv.ts`
- `useTvData.test.ts` — lifecycle tests (incl. superseded response, refetch after unmount, real timeout)

#### Simplify — ✅ applied (2026-11-24)
Parsing → pure `parseSeriesCsv.ts`; 3 staleness refs → controller identity; `timedOut` flag; `num()`/`str()` helpers; `toSeries` returns `null` for bad ID; dropped `any`; test helpers (`fakeResponse`, `stubFetch`, `renderLoaded`) + shared fixtures.

#### Code-review — ✅ all 5 findings fixed in v0.4.4 (2026-11-24)
Broken quote silently dropping later rows (important, regression from 0.4.3), refetch after unmount, no stale-response tests, missing `act()`, stubbed `fetch` not removed. Details in CHANGELOG `[0.4.4]`.

#### Security-review — ✅ no findings (2026-11-24)
Fixed same-origin fetch URL; no `dynamicTyping`; `__proto__` header inert; no unsafe sinks.

### Utils (`src/utils/`) — ✅ Review complete (2026-11-24: simplify, code-review, security-review. `settings.ts` hardened in v0.4.1 security pass; `parseSeriesCsv.ts` reviewed with Hooks in v0.4.4)
- `a11y.ts` — `activateOnKey` Enter/Space helper (added 2026-11-23)
- `derive.ts` — aggregation functions; `truncate()` added, `formatRuntime` now rounds (v0.4.2)
- `derive.test.ts`
- `parseSeriesCsv.ts` — pure CSV → `TvSeries[]` (added 2026-11-24) ✅
- `parseSeriesCsv.test.ts` + `parseSeriesCsv.fixture.ts` (`csv()`, `withId()` helpers)
- `lookup.ts` — own-key `lookup(map, key)` for CSV-derived keys (v0.4.11, moved out of `ui.ts`)
- 77 tests total across `derive`, `parseSeriesCsv`, `useTvData`, `ui`
- `settings.ts` — localStorage wrapper (`tvdash-settings`)

#### Simplify — ✅ done in v0.4.5 (2026-11-24)
Reuse / efficiency / altitude: clean. Un-exported `REQUIRED_COLUMNS` + fixture `HEADER`; `VALID_CSV = csv(VALID_ROW)`; `withId()` fixture helper replaces 5 copied regexes. Skipped: sidebar key into `settings.ts`, hours helper, `format.ts` split. Details in CHANGELOG `[0.4.5]`.

#### Code-review — ✅ all 5 findings fixed in v0.4.6 (2026-11-24)
Skipped rows console-only (important — now `CsvWarningBanner` + all-skipped fatal), empty CSV delimiter error, duplicate TV IDs, wrong line numbers in warnings, `truncate` splitting emoji / `max < 2`. Details in CHANGELOG `[0.4.6]`.

#### Security-review — ✅ no findings (2026-11-24)
CSV → plain strings/numbers only; banner text rendered by React (no `dangerouslySetInnerHTML` in `src/`); `posterUrl` only in `<img src>`, no CSV-built `href`; `settings.ts` `__proto__` inert.

### Constants (`src/constants/`) — ✅ Review complete (2026-11-24: simplify, code-review, security-review)
- `ui.ts` — colors, spacing, `cardShadow` / `cardStyle` (v0.4.11), `responsiveColumns`; single exported `STATUSES` table (literal access, v0.4.13); `statusHex`/`statusTagColor`/`genreTagColor` own-key lookups; `sortStatuses`; `tierColor`-based `ratingColor` (accepts `null`, v0.4.13) / `completionColor`; `STAR_COLOR`
- `ui.test.ts` (added v0.4.8)

#### Simplify — ✅ done in v0.4.8
One `STATUSES` table; `avgRating()` → `number | null` (dropped `avgRatingColor` + `'–'` round-trip); `tierColor`; FilterBar status options derived. Skipped: `presetPalettes`-derived hexes (would change Ended/Canceled), other `'–'` sentinels (`topGenreByWatchTime`, StatsBar top network), shared `<StatusTag>`.

#### Code-review — ✅ all 5 findings fixed in v0.4.8
Status filter options from data; typed literal keys; Canceled red unified (`#f5222d`); own-key lookups (+ `derive.ts` null-prototype counts); one unknown-status fallback (theme chart color). Details in CHANGELOG `[0.4.8]`.

#### Security-review — ✅ no findings
Color helpers never return CSV text; own-key lookups; no unsafe sinks.

### Types (`src/types/`) — ✅ Review complete (2026-11-24: simplify, code-review, security-review)
- `series.ts` — `TvSeries` (unknown = `null`, normalized in `parseSeriesCsv`), `NameValue`, `NameCount`
- `filters.ts` — `Filters`, `SortKey`, `NumericSortKey` (added v0.4.9)

#### Simplify — ✅ done in v0.4.9
`NameValue`/`NameCount`; `Filters`/`SortKey` → `types/filters.ts`; single sort-key source; dropped `as number` cast. Skipped: `episodeRuntime` → `0` (wrong direction), deriving `firstAirYear` from `firstAirDate` (CSV contract), `status: KnownStatus` (layering — later done as `KnownStatus | (string & {})` in v0.4.13).

#### Code-review — ✅ all 6 findings fixed in v0.4.9
Nullable unknowns (year "0", "★ 0.0", "N / 0", N/A tag), Seasons Watched dedupe, number-only `NumericSortKey`, exhaustive sort labels, `Filters.status` sentinel, `NameValue` comment. Details in CHANGELOG `[0.4.9]`.

#### Security-review — ✅ no findings
Saved `sortBy` validated before use as a key; parser helpers produce only numbers / strings / null; no unsafe sinks.

### Outside `src/` — ✅ Review complete (2026-11-24: simplify, code-review, security-review)
- `series-search.py` — Tkinter TMDB CSV generator; writes `public/tv_series.csv`, blank for unknown, follows existing header. Since v0.4.13: `TmdbClient` / `CsvStore` / `App`, all network calls in workers (polled result queue), API key redacted, atomic CSV rewrite, `utf-8-sig` reads, importable for `scripts/test_series_search.py`
- `public/tv_series.csv` — data source
- Config: `tsconfig.node.json` (`outDir` → `node_modules/.tmp`), `vitest.config.ts` (merges vite config, node env default), `eslint.config.js`

#### Simplify — ✅ done in v0.4.10
`_tmdb_get` helper, session params/headers, `append_to_response` + details cache, `FIELDNAMES`, `load_rows`, config cleanup. Skipped: ESLint flat presets; ~~worker threads, `App` class, `tsc -b` build~~ (done in v0.4.13).

#### Code-review — ✅ all 10 findings fixed in v0.4.10
Incl. 2 regressions from the simplify step (saved-season checkboxes, ESLint `dist/`). Plus generator output: `public/` path, blank for unknown. Details in CHANGELOG `[0.4.10]`.

#### Simplify — ✅ v0.4.13 (whole uncommitted 0.4.12–0.4.13 diff)
Injectable `session` / `dialogs` (harness passes fakes, no global monkeypatching), redaction only in `TmdbClient.get`, parallel season fetches, polling only while work is pending, `first_runtime` / `air_year`; `KnownStatus` moved to `types/series.ts`; e2e `csv` fixture option + shared `csv()` header + deterministic broken poster; CI Playwright cache. Skipped: triple CSV read per save (negligible, re-read is deliberate), locked details cache (rare duplicate request), fixed 1s wait in the desktop→mobile e2e test (deliberate).

#### Code-review — ✅ all 6 findings fixed in v0.4.13
CSV truncation on rewrite (atomic temp + `os.replace`), Excel BOM hiding rows (`utf-8-sig`), season double-count, silent save errors (dialog), Show Detail tile overflow (2×2 below `xl`, `minWidth: 0`), `test:gen` on `python3` systems. Details in CHANGELOG `[0.4.13]`.

#### Security-review — ✅ no findings
Key never in CSV/logs; ~~may appear in a local error dialog~~ (redacted in v0.4.13); fixed path; DictWriter quoting.
