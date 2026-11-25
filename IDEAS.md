# IDEAS

Improvement ideas per module (top), then the finished review tracker (bottom). Bugs live in [BUG_BACKLOG.md](BUG_BACKLOG.md) — the 9 bug-like findings from the ideas pass are listed there too, each pointing back to its idea here.

_Last updated 2026-11-25 (v0.4.23 — installable PWA / offline (network-first CSV, update prompt, theme-color), then a simplify + code-review pass over 0.4.20–0.4.23; v0.4.22 — smarter route prefetch (Data Saver / 2G aware, hover/focus intent); v0.4.21 — cross-tab theme sync; v0.4.20 — semantic theme colors (per-theme rating/completion tiers, readable badges); v0.4.19 — typed theme names, `AppThemeProvider`, theme contract test, simplify + code-review fixes; v0.4.18 — root smoke test; v0.4.17 — reduced motion; v0.4.16 — root safety net + `?reset`; v0.4.15 — System theme + no-flash boot script, per-route titles, root tidy-up; all via OpenSpec, see Completed → Shipped improvement ideas)._ All modules reviewed (simplify + code-review + security-review), plus whole-project simplify + code-review passes in v0.4.11 and v0.4.13. Test coverage: 210 unit, 56 + 4 PWA e2e (Playwright, CI — `npm run e2e` / `npm run e2e:pwa`), 37 generator checks (`npm run test:gen`, local).

## Open follow-ups

- [ ] Sidebar collapse persists across desktop ↔ mobile resize — not covered by the Playwright check (from the Components browser check).

## Improvement Ideas

New-feature / out-of-the-box ideas per module (not bugs). P1 = high value, low cost · P2 = worth doing · P3 = nice-to-have / experimental. Each idea is listed once, in the module that owns it; related ideas elsewhere point to it.

### Entry / root (`src/`)
Scope: `main.tsx`, `App.tsx`, `ThemeContext.tsx`, `themes.ts`, `setupTests.ts`.

#### P1

#### P2
- **Data router (`createBrowserRouter`)** — on react-router v7: route-level `lazy`, `errorElement` (could replace parts of `RouteErrorBoundary`'s manual pathname reset), `useNavigation()` for a top progress bar while a chunk loads. Spike first — `Content` (not window) is the scroll container, so built-in `ScrollRestoration` won't help directly.

- **Single route table** — `App`'s `<Route>`s, `NAV_ITEMS` (`key` + `page`) and `PAGE_LOADERS` are three hand-synced lists since v0.4.22. One table in `routes/` (`{ path, page, nav?: { label, icon } }`) that `App` maps to routes and `AppLayout` filters for nav would remove the `page` field / `MENU_ITEMS` stripping. Also a candidate: a `showLinkProps(id)` helper for the three clickable show elements (click / key / prefetch / role). From the v0.4.23 simplify pass.

#### P3
- **Global keyboard shortcuts** — `g d` / `g s` / `g t` navigate, `/` focuses Shows search, `t` cycles theme, `?` shows a cheat-sheet modal. One reusable `useHotkeys(map)` hook (ignored while typing in inputs), also used by the quick switcher and grid navigation (Components).
- **Custom accent theme** — "Custom" theme where the user picks one accent color; derive `chartColors` (hue rotation), `tiers`, `colorPrimary` and persist via `saveSetting`. Low code thanks to antd's algorithms.
- **More built-in themes** — high-contrast (a11y), Solarized, Nord, OLED black. Cheap once the theme contract test exists.
- **URL theme override** — `?theme=Dracula` (not persisted) for screenshots / README images and e2e theme coverage.
- **Base path from `import.meta.env.BASE_URL`** — `BrowserRouter basename` + CSV fetch via `new URL('tv_series.csv', import.meta.env.BASE_URL)` (path in one exported constant shared with e2e route interception) so the build can be hosted under a sub-path (GitHub Pages) without code edits; add a 404.html SPA fallback note.
- ~~**`setupTests.ts` cleanup** — it loads `@testing-library/jest-dom` for every test while the default environment is `node`; move it to the jsdom tests only (or drop it if no matcher uses it).~~ ✅ Unreleased (`tidy-root-entry`): file + dependency dropped; jsdom tests import `@testing-library/jest-dom/vitest` themselves.
- ~~**Clear mount error** — replace `document.getElementById('root')!` with an explicit check that throws `"#root element missing in index.html"`.~~ ✅ Unreleased (`tidy-root-entry`).

### Pages (`src/pages/`)
Scope: `DashboardPage.tsx`, `ShowsPage.tsx`, `ShowDetailPage.tsx`, `StatisticsPage.tsx`, `NotFoundPage.tsx`.

#### P1
- **Shows state in the URL** — filters + page live only in localStorage / component state, and `AppLayout` resets `scrollTop` on every navigation, so Shows → Show Detail → Back lands on page 1 at the top. Mirror `search` / `genres` / `status` / `sortBy` / `page` / `pageSize` into `useSearchParams` (URL wins over saved filters when present, saved filters seed an empty URL), and restore `Content` scroll on POP navigation back to `/shows`. Side benefits: shareable filtered views, browser back undoes a filter.
- **Everything is a link (cross-navigation)** — genre / network / actor / creator / keyword tags on Show Detail and the Top Genres / Watch Status bars on Dashboard are dead text. Make each one `navigate('/shows?genre=Drama')` / `?q=<actor>` (needs the URL state above). Safe w.r.t. the "no `href` from CSV" rule: `navigate()` to a fixed path + `URLSearchParams`-encoded value, never a CSV-built `href`.
- **Progress filter** — new `Filters.progress`: `all` / `notStarted` / `inProgress` / `completed` (from `episodesWatched` vs `totalEpisodes`). Dashboard's "Not Started → View all" and a new "Continue Watching → View all" then open the matching list instead of the unfiltered catalogue.
- **"Time left" on Show Detail + Continue Watching** — `(totalEpisodes − episodesWatched) × episodeRuntime` (hidden when `episodeRuntime == null`), plus the next unwatched season (`S3 next`). Continue Watching could sort by least time left ("finish tonight") instead of highest %, or offer both.
- **Empty Shows result with a way out** — `ShowGrid`'s `Empty` ("No shows match your filters") has no action. Pass a "Clear filters" button from `ShowsPage` (it owns `DEFAULT_FILTERS`), and show which filters are active.
- **Pure `filterAndSortShows()` + tests** — the filter / sort / search-index logic is ~40 lines inside `ShowsPage`'s `useMemo`s with zero unit coverage (only e2e search). Move it to `utils/` (`buildSearchIndex`, `applyFilters`) and unit-test AND-genre matching, unknown saved status, `recentFirst`, nulls-last sorts.

#### P2
- **"More like this" on Show Detail** — rank other shows by Jaccard overlap of `genres` + `keywords` (+ shared creators/networks bonus); show 6 `PosterThumb` cards. Pure `similarShows(target, data, n)` in `derive.ts`, unit-tested with fixtures, memoized per show. Turns a dead-end page into browsing.
- **Prev / Next in watch order** — CSV row order is watch history; Show Detail can offer "← watched before / watched after →" (and `←`/`→` keys), plus a "#42 of 159 watched" badge. Cheap: index lookup in `data`.
- **Context instead of raw numbers** — `Popularity 123.4` means nothing to the viewer. Show library rank / percentile instead ("Top 10% rated in your library", "#3 most watched"), computed from `data`.
- **External TMDB link** — "Open on TMDB" button to `https://www.themoviedb.org/tv/${tvId}`. Allowed by the security rule only because `tvId` is a validated positive integer and the origin is fixed — keep a comment saying so, never interpolate a string field.
- **Statistics tab in the URL** — `/stats?tab=ratings` so a chart group is deep-linkable and survives reload / back (needs a `tab` + `onTabChange` prop on `ChartsSection`, which owns `Tabs` today).
- **Chart drill-down** — clicking a genre bar / status slice / decade bar on Statistics jumps to Shows with that filter (same URL-param plumbing as P1). Recharts `onClick` on `Bar` / `Pie`.
- **Scoped statistics** — a small filter row on Statistics (genre / status / progress) that feeds a subset into `StatsBar` + `ChartsSection` ("stats for my Crime shows"). Reuses `Filters` + the extracted `applyFilters`.
- **Table view on Shows** — grid/table toggle (persisted via `saveSetting`); antd `Table` with sortable columns (rating, year, progress, watch time) for dense scanning on desktop. Also gives a natural ascending/descending toggle, which the sort menu lacks.
- **More Shows filters** — rating range, first-air-year range, language, network (options from data, like genres/status). Genre AND ↔ OR toggle (today it's AND only).
- **`usePageData()` / `<DataGate>`** — four pages repeat the same `loading → LoadingState`, `error → ErrorState` prelude with the same message. One helper returning `data` only when ready keeps the order (`loading` → `error` → data) enforced in one place.
- **Split `DashboardPage`** (395 lines) — move sections (`Highlights`, `ContinueWatching`, `RecentlyWatched`, `SidebarTabs`, `NotStartedList`) into `src/pages/dashboard/*` with data as props; page keeps only the memos. Easier to test and to make sections optional (P3 below).

#### P3
- **"What should I watch?" picker** — Dashboard button that picks a random Not Started / In Progress show, weighted by rating and filtered by mood (genre chips). Small modal with re-roll.
- **Auto insights** — 3–4 generated sentences on Dashboard / Statistics: "Drama is 38% of your watch time", "You finish 82% of Crime shows but 40% of Comedy", "Your average rating is 0.6 above TMDB's for this set". Pure functions in `derive.ts` returning numbers (`genreShareOfWatchTime`, `completionGap`, `ratingVsLibraryMean`); sentence templating stays in the UI.
- **Milestones / badges** — 100 shows, 1,000 hours, 10 completed series, a genre fully explored; shown as a small row on Dashboard. No timestamps needed.
- **Customizable Dashboard** — hide / reorder sections, saved via `saveSetting('dashboardLayout', …)` (type-checked on load like `loadFilters`). Depends on the Dashboard split.
- **Layout-matching skeletons** — antd `Skeleton` shaped like each page instead of the centered spinner, so the first paint doesn't jump.
- **Smarter 404** — `NotFoundPage` / Show-not-found offer a search box and, for `/shows/<text>` that isn't a number, "Did you mean…" matches by name (navigate to the result, never echo the path as HTML).
- **Poster-tinted hero** — derive an accent from the poster's dominant color for the Show Detail hero background/border. Spike first: needs CORS-enabled images for canvas reads (TMDB image CDN may or may not allow it) and must still pass theme contrast.
- **Grid keyboard navigation** — arrow keys move focus between `ShowCard`s on Shows (roving `tabIndex`), Enter opens (`/` to search is under Entry / root shortcuts).
- **Export** — download the filtered Shows list (optionally with the personal overlay merged in) as CSV via `toCsv(rows)` (`Papa.unparse`) and stats as JSON; a printable Statistics layout would need a documented exception to the no-CSS rule (or inline `@media print` via `window.print` + a print-mode state).

### Components (`src/components/`)
Scope: `AppLayout`, `BottomNav`, `ChartsSection`, `CsvWarningBanner`, `ErrorState`, `FilterBar`, `LoadingState`, `PosterThumb`, `RouteErrorBoundary`, `ShowCard`, `ShowGrid`, `StatCard`, `StatsBar`, `ThemeToggle`. (Cross-links / URL filters / drill-down from pages are under Pages — not repeated here.)

#### P1
- **Themed chart tooltips** — every Recharts `<Tooltip>` in `ChartsSection` (and Dashboard's Ratings chart) uses the default white box + grey hover cursor, which glares in Default Dark / Dracula. One shared `tooltipProps(theme)` (`contentStyle` / `labelStyle` / `itemStyle` / `cursor` fill from `Theme`) spread into each, like the shared `axisTick`.
- **Cards are real links** — `ShowCard` (and Dashboard's `ShowRowCard`) are `role="button"` + `navigate()`, so middle-click / Ctrl-click / "open in new tab" / "copy link" don't work. Wrap in react-router `<Link to={`/shows/${tvId}`}>` (internal route + validated integer — not a CSV-built `href`, so the security rule holds) and drop `activateOnKey` for these: links already handle Enter.
- **Progress on `ShowCard`** — the card says "12 eps watched" with no total. A 3px progress strip along the poster's bottom edge (`completionColor`) plus a "✓ Completed" corner mark makes the grid readable at a glance.
- **Clickable chart marks** — "Rating vs Popularity" dots and "Top 10 by Watch Time" bars are individual shows: `onClick` → `/shows/:id`, `cursor: pointer`, tooltip hint "click to open".
- **`CsvWarningBanner` lists everything** — after 3 rows it says "see browser console", which non-dev users never open. Expand in place ("Show all 12") inside a max-height scroll box, plus a "Copy" button for pasting into a bug report.
- **Self-healing stale chunk** — `RouteErrorBoundary` notes stale hashed chunks after a deploy but only offers Retry. Detect the dynamic-import failure (`Failed to fetch dynamically imported module` / `ChunkLoadError`) and reload once automatically (sessionStorage guard against loops); add a "Go to Dashboard" button next to Retry for real render errors.
- **No spinner flash** — `LoadingState` shows instantly; the CSV usually loads in < 200ms, so users see a spinner blink. `Spin delay={200}` (one prop).
- **Empty-chart states** — only Actors / Creators handle empty data ("No actor data"). Age ratings, languages, depth etc. render blank axes when the CSV lacks that column's data. A tiny `<ChartCard empty={!rows.length}>` wrapper with antd `Empty` (`image={Empty.PRESENTED_IMAGE_SIMPLE}`) for all 14.

#### P2
- **Global quick switcher (Ctrl/⌘ K)** — the header has empty space between title and `ThemeToggle`. A search box / modal (antd `AutoComplete`) over show names, actors, creators; Enter jumps to the show or to a filtered Shows page. Lives in `AppLayout`, data from the context it already reads.
- **Header data controls** — "Refresh data" icon (calls `refetch`) + "loaded 2 min ago" tooltip; useful while `series-search.py` is appending rows in another window.
- **`StatsBar` with better tiles** — Hours / Minutes / Years are three tiles for one number. Keep Hours (with min/years as its hover text) and use the freed slots for Completed Shows, Avg Episode Runtime, Longest Show (by watch time), Shows Not Started.
- **`StatCard` explanations + actions** — optional `info` prop (ⓘ tooltip: "Completion rate = episodes watched ÷ total episodes, all shows") and optional `onClick` (tile becomes a link, e.g. Top Genre → filtered Shows). Today metrics like Completion Rate are ambiguous (episode- vs show-weighted).
- **Robust tint colors in `StatCard`** — `${color}40` / `${color}22` assume a 6-digit hex; a theme or status color given as `#abc`, `rgb()` or a name silently produces an invalid border/background. Use `FastColor` from `@ant-design/fast-color` (already installed via antd — add it as a direct dependency) or CSS `color-mix()`.
- **Mobile filter drawer** — on `xs` `FilterBar` stacks 4 full-width rows before the first card. Collapse to search + a "Filters (2)" button opening an antd `Drawer` with genre / status / sort.
- **Search suggestions in `FilterBar`** — `AutoComplete` options from names / actors / creators matching the typed text, grouped by kind; picking one fills the search.
- **Live result count** — `"{resultCount} of {data.length} shows"` should be in an `aria-live="polite"` region so screen-reader users hear the effect of a filter.
- **Chart a11y data table** — charts only have an `aria-label`. A "View as table" toggle per chart card (antd `Table` from the same memoized rows) helps screen readers, exact-value lookup, and copy/paste.
- **Expand chart** — maximize icon in each chart card's `extra` → `Modal` at ~80vh with the same chart, for dense ones (scatter, release year, actors).
- **Theme previews in `ThemeToggle`** — each option shows 4–5 swatches from `chartColors` + `contentBg`, so the choice isn't by name alone.
- **Tap active tab = scroll to top (`BottomNav`)** — iOS/Android convention: tapping the already-active item scrolls `Content` to 0 instead of a no-op navigate.
- **`ShowCard` richer `aria-label`** — "Breaking Bad, 2008, rated 8.9, 62 of 62 episodes" instead of name only; sighted users get this from the card, screen-reader users currently don't.
- **Offline-aware `ErrorState`** — when `navigator.onLine === false`, say "You're offline" and auto-retry on the `online` event; otherwise add "Copy details" for the error text.
- **Component tests** — none of `src/components/` has a unit test (e2e only). jsdom + Testing Library for `CsvWarningBanner` (dismiss → refetch re-shows), `RouteErrorBoundary` (reset only on pathname change after an error), `StatCard` hover text, `FilterBar` chip removal.
- **Single nav/route config** — `NAV_ITEMS` (AppLayout) and the routes / lazy loaders (App) describe the same pages twice; one `ROUTES` table (`path`, `label`, `icon`, `loader`, `inNav`) feeds Menu, BottomNav, page title and router.

#### P3
- **Chart registry** — the deferred "data-driven chart config": `{ id, tab, title, subtitle, render }[]` would make chart order, the Dashboard's chart count ("14 charts…" is hard-coded in the Explore card today), per-chart expand / table / empty-state wrappers and hide-a-chart settings fall out for free. Do it together with the `ChartCard` wrapper.
- **Animated stat values** — count-up on first mount (respecting reduced motion) for `StatCard` numbers.
- **Card hover preview** — on desktop hover / long-press on mobile, a `Popover` on `ShowCard` with tagline + overview excerpt + status, so browsing doesn't require opening each show.
- **Virtualized "show all"** — a page-size "All" option backed by a virtualized grid (`ShowGrid` already knows its column count) for scrolling the whole library without pagination.
- **Poster `srcSet`** — TMDB URLs encode the size (`/w500/`); `PosterThumb` could build `srcSet` with `w92` / `w185` / `w342` (only when the URL matches TMDB's pattern) so 36px thumbnails don't download 500px images. Big bandwidth win on mobile.
- **Collapsed sidebar tooltips + logo** — collapsed `Sider` shows only `📺`; replace the emoji with an SVG mark (consistent rendering across OSes) and make sure collapsed menu items show labels as tooltips.
- **Persist banner dismissal** — `CsvWarningBanner` reappears on every reload for the same known-bad rows; remember a hash of the warnings via `saveSetting` and stay hidden until they change.
- **Saved filter presets** — "Save view" in `FilterBar` (name + `Filters`), listed as chips; stored via `settings.ts` with the usual per-field type checks.

### Context (`src/context/`)
Scope: `TvDataContext.tsx` (provider), `useTvDataContext.ts` (context + hook) — and the value shape it exposes from `useTvData`. (Fetch internals belong to Hooks; ideas here are about what the context offers consumers.)

#### P1
- **Discriminated-union value** — today `{ data, loading, error }` lets a page read `data` before checking `loading` / `error`; the order is a convention (CLAUDE.md) not a type. Expose `{ status: 'loading' } | { status: 'error'; error } | { status: 'ready'; data; warnings }` (+ `refetch` on all) so TypeScript forces the check. Pairs with the Pages `usePageData()` idea.
- **Refresh without the spinner** — `refetch` sets `loading: true`, and every page renders `LoadingState` first, so a Retry / future "Refresh data" blanks the whole page even though rows are still there. Split `loading` (no data yet) from `refreshing` (data kept on screen, small indicator in the header).
- **Shared derived indexes** — compute once per `data` in the provider: `byId: Map<number, TvSeries>` (Show Detail does `data.find` on every render), `watchIndex` (CSV position → prev/next & "#42 of 159"), and the lowercased search text map (`ShowsPage` rebuilds it every time Shows mounts). Pages read them from context; no per-page memos.
- **Test provider helper** — `renderWithTvData(ui, { rows, status })` / `makeTvDataValue(rows)` built on `TvDataContext.Provider` + the existing CSV fixtures. Unblocks the page/component unit tests listed above (none exist because every page needs the provider + a fetch mock).

#### P2
- **`useShow(id)` / small selector hooks** — `useShow(id)` returns `{ status, show }` (found / not-found), `useTvWarnings()` for `AppLayout`. Encapsulates the `Number(id)` parse + lookup and keeps pages thin.
- **Split data vs meta contexts** — `AppLayout` only needs `warnings` but re-renders the shell on every data / loading change; a `TvMetaContext` (warnings, status, `loadedAt`) separate from `TvRowsContext` keeps shell and page updates independent. Measure first — cheap today at ~160 rows.
- **`loadedAt` + auto-refresh on focus** — expose when the CSV was last loaded; refetch on `visibilitychange` → visible (debounced, e.g. ≥ 30s since last load) so rows appended by `series-search.py` show up when you switch back. Use `If-None-Match` / `Last-Modified` so an unchanged file is a 304 and skips re-parsing (spike: check Vite dev + the static host send ETags).
- **Dev live reload of the CSV** — tiny Vite plugin watching `public/tv_series.csv` → custom HMR event (`import.meta.hot.on('tvdash:csv')`) → provider calls `refetch`. Save a row in the generator, dashboard updates instantly. Dev-only, zero prod code.
- **Structured errors** — `error: string` → `{ kind: 'timeout' | 'http' | 'network' | 'parse'; status?; message }`. `ErrorState` can then tailor copy (404 → "tv_series.csv not found — run series-search.py", offline → auto-retry) instead of string matching.
- **Personal overlay layer** — user-local data the CSV can't hold: favorite ⭐, own rating, notes, "dropped" flag. Stored via `settings.ts` keyed by `tvId`, merged in the provider into a `personal` field (CSV stays read-only and untouched). Types first: `PersonalEntry = { favorite?; myRating?; notes?; dropped?; updatedAt }`, `PersonalData = Record<TvId, PersonalEntry>`, shared by settings validation and UI. Enables "my rating vs TMDB", a watchlist and favorites filters. Biggest product idea in this module.
- **Load your own CSV** — file picker / drag-drop that swaps the provider's source to a local `File` (read with `FileReader`, never uploaded), same `parseSeriesCsv` path + warnings banner. Makes the app usable by anyone without editing `public/`; "Reset to default data" switches back.

#### P3
- **Instant paint from cache** — keep the last good CSV text (or parsed rows + `loadedAt`) in IndexedDB; render it immediately on boot, then revalidate in the background (stale-while-revalidate). Overlaps the PWA idea under Entry / root.
- **Parse in a Web Worker** — irrelevant at ~160 rows, worth it if the library grows to thousands or the "load your own CSV" path gets big files.
- **Structured warnings** — `{ record, tvId?, name?, reason }` instead of preformatted strings, so the banner can group by reason ("3 duplicate IDs, 1 wrong field count") and future tooling can act on them.
- **Rename for clarity** — `TvDataContext.tsx` holds only `TvDataProvider`; naming it `TvDataProvider.tsx` matches its content (the Fast Refresh split stays as is).
- **Demo / fixture data switch** — dev-only `?data=demo` loading a bundled synthetic CSV (`TEST_CSV`), for screenshots and trying edge cases in the browser without touching the real file.

### Hooks (`src/hooks/`)
Scope: `useTvData.ts` (+ `useTvData.test.ts`) — today the only hook. Also: hook-shaped logic currently inlined in pages/components that could live here. (Context-shape ideas — union status, `refreshing`, derived indexes — are under Context.)

#### P1
- **Detect "CSV missing → got index.html"** — SPA hosts (Netlify / Vercel / GitHub Pages rewrites, and possibly Vite dev's HTML fallback — verify) answer a missing `/tv_series.csv` with `200` + `index.html`. The parser then reports a confusing "missing column" / "no valid rows". Check `Content-Type` (or a leading `<!doctype` / `<html`) before parsing and raise "tv_series.csv not found — run series-search.py or add it to public/".
- **Always revalidate the CSV** — `fetch('/tv_series.csv')` uses the default HTTP cache; on a static host with heuristic caching, rows appended by `series-search.py` may not show after Refresh / Retry. `cache: 'no-cache'` (conditional request → cheap 304 when unchanged). Also a prerequisite for the auto-refresh idea under Context.
- **Extract the inlined hooks** — hook-shaped logic lives in pages/components with no unit tests:
  - `useDebouncedSetting(key, value, ms)` — ShowsPage's debounce + flush-on-unmount (the subtle part CLAUDE.md warns about); reusable for the table-view / dashboard-layout / preset ideas.
  - `useScrollDirection(ref, { threshold, ignoreMs })` — `BottomNav`'s scroll logic incl. the 800ms scroll-anchoring guard.
  - `useClampOverflow(ref, deps)` — Show Detail's `ResizeObserver` "Show more" check.
  - `useSidebarCollapsed()` — `AppLayout`'s `tvdash-sidebar` read/write (keeps the intentional separate key).
  - `useResponsiveColumns(tiers)` — `responsiveColumns` sits in `constants/ui.ts` but is logic over `Grid.useBreakpoint()`; the tier tables (`ShowGrid`, `StatsBar`) stay in constants as named values (`SHOW_GRID_COLUMNS`, `STATS_COLUMNS`).
  Each gets a focused jsdom test; components shrink to rendering.
- **Hooks the other ideas need** — `useDocumentTitle(title)` (per-route tab titles), `usePrefersReducedMotion()` and `useMediaQuery(q)` (System theme, reduced motion) — small, shared, tested once instead of re-implemented per idea.

#### P2
- **Retry with backoff for transient failures** — network errors / 5xx get 2 automatic retries (e.g. 1s, 3s) before showing `ErrorState`; 404 / parse errors fail immediately. Abort/stale logic already supports it (new controller per attempt).
- **Accurate timeout message** — "Request timed out. Check that tv_series.csv is in the public/ folder." — a missing file is a fast 404 (or the HTML case above), not a timeout; a timeout means a slow/stalled connection. Reword, and include the configured limit.
- **`HTTP 404: ` with empty statusText** — HTTP/2 responses have `statusText === ''`, giving a trailing colon. Fall back to a status-code description (`404 Not Found`).
- **Load timing** — record fetch + parse durations (`performance.measure`) and expose `loadMs` in dev / a tooltip; also mark app mount → first chart paint. Gives a baseline before PWA / data-router / Web Worker / cache ideas.
- **Tests for the new behaviors** — HTML-instead-of-CSV, `no-cache` passed, retry/backoff with fake timers, extracted hooks above. Current suite: 10 lifecycle cases, all on the happy fetch shape.

#### P3
- **Generic `useCsvResource(url, parse)`** — separate the fetch lifecycle (abort, stale, timeout, retry) from the TV-specific parser; `useTvData` becomes a 3-line wrapper. Pays off if a second data file appears (e.g. personal overlay export, watch log).
- **`AbortSignal.timeout` + `AbortSignal.any`** — replaces the manual `setTimeout` + `timedOut` flag (`err.name === 'TimeoutError'` distinguishes it). Needs Chrome 116 / Safari 17.4+; check the support target first.
- **`useSyncExternalStore` data store** — move fetch state into a tiny module-level store (subscribe/getSnapshot); the provider becomes optional, StrictMode double-effects stop mattering, and selector hooks (`useShow(id)`) re-render only on their slice.
- **Streaming parse for big files** — Papa's `step` / chunked parse with a progress value (`loaded / total` from `Content-Length`) for the "load your own CSV" case.

### Utils (`src/utils/`)
Scope: `derive.ts`, `parseSeriesCsv.ts` (+ fixture), `settings.ts`, `lookup.ts`, `a11y.ts` and their tests.

#### P1
- **`Intl.DisplayNames` for languages** — `LANGUAGE_NAMES` hard-codes 10 ISO codes; anything else shows as `TR` / `DA` / `SV`. `new Intl.DisplayNames(['en'], { type: 'language' }).of(code)` names every code (fallback to uppercase on a `RangeError` for junk). One exported `languageName(code)` for the Statistics chart and Show Detail's meta row.
- **`progressState(s)` classifier** — `'notStarted' | 'inProgress' | 'completed'` from `episodesWatched` / `totalEpisodes`, defined once (Dashboard inlines `> 0 && < total` and `=== 0`; the Pages "progress filter" and Components "completed mark" ideas need the same rule). Decide here what `episodesWatched > totalEpisodes` means (TMDB added episodes after the row was saved → `completed`? `inProgress`?) and test it.
- **Soft data-quality warnings** — parser only warns when it *skips* a row. Keep the row but warn on contradictions: `episodesWatched > totalEpisodes` (Show Detail renders "110%"), `seasonsWatched` containing a season > `seasons`, negative counts / popularity, unparseable `First Air Date`. Separate `notices` list (or a `level` on structured warnings) so the banner can say "3 rows look inconsistent" without implying data loss.
- **Accent-insensitive search** — a shared `normalizeSearch(s)` (`toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')`) used for both the index and the query: "pokemon" finds "Pokémon", "amelie" finds "Amélie". Pure, one test table. (Lives next to the extracted `filterAndSortShows` from Pages.)
- **Typed settings schema** — `settings.ts` returns `Record<string, unknown>` and each caller re-implements validation (`loadFilters`, `loadThemeName`). A small schema `{ filters: isFilters, themeName: isThemeName, … }` + `getSetting(key)` returning the validated type or the default puts all checks in one tested place — and every new persisted idea (table view, dashboard layout, presets, overlay) just adds a key.
- **`countBy` helper in `derive.ts`** — genre / status / network / actor / creator / language / age-rating distributions are seven copies of "null-proto count map → entries → sort desc → slice". `countBy(data, s => keys, { n, label })` returns `NameValue[]`; also gives one place for a deterministic tie-break (count desc, then name) so chart order doesn't shift when CSV row order changes.

#### P2
- **`format.ts` split + `Intl.NumberFormat`** — formatters (`formatRating`, `formatRuntime`, `truncate`, the inline `toLocaleString()` calls, Show Detail's `formatDate`) move out of `derive.ts` into `format.ts` (previously skipped — now there are enough of them). Add compact numbers (`12.3k`), `formatDuration` with days for big totals ("12d 4h"), and `Intl.RelativeTimeFormat` for "loaded 2 min ago". Pin one locale so numbers and dates agree (dates are fixed `en-US`, numbers follow the browser).
- **Forgiving headers** — `transformHeader: h => h.trim()` (and maybe case-insensitive matching / aliases like `Actors` → `Actors/Actresses`): an Excel round-trip that adds spaces currently triggers "missing required columns".
- **Cross-language column contract test** — `FIELDNAMES` in `series-search.py` and the columns `parseSeriesCsv` reads are kept in sync by hand. A Vitest test that extracts `FIELDNAMES` from the `.py` file (regex) and compares it with an exported TS column list fails CI on drift.
- **Schema-driven row mapping** — `toSeries` is 25 hand-written lines; a table `{ column, field, parse: posNum | optStr | splitList | … }` makes the TS column list (for the contract test above), required columns and normalization rules one data structure.
- **Poster URL allow-list** — `posterUrl` reaches `<img src>` unchecked. Defense in depth: keep only `https:` URLs (optionally only `image.tmdb.org`), otherwise `''` → placeholder; warn as a soft notice. Prevents tracking pixels / `data:` blobs from a hand-edited or third-party CSV.
- **Settings versioning** — store `{ v: 1, … }`; a `migrate(old)` step lets future renames (e.g. `filters` shape change for progress / ranges) keep users' saved state instead of silently resetting it.
- **Property-based parser tests** — `fast-check`: arbitrary field strings never crash `toSeries`, unknowns always become `null` (never `0`/`NaN`), `seasonsWatched` always unique positive ints, quoting round-trips through `Papa.unparse`. Complements the example-based suite.
- **`activateOnKey` ignores auto-repeat** — holding Enter on a focused card fires `navigate` repeatedly (`e.repeat`); skip repeats. (And Space should arguably fire on `keyup` like a native button — check with a screen reader.)
- **Convention nits** — `showsByYear` uses truthiness (`if (s.firstAirYear)`) where CLAUDE.md says `!= null`; `episodesWatched || 0` / `totalEpisodes || 0` guards are dead since the parser already defaults to `0`. Clean up in the `countBy` pass.

#### P3
- **Fuzzy search** — typo-tolerant scoring (small Levenshtein / trigram, no dependency) behind the same `normalizeSearch` index, ranking exact > prefix > fuzzy. Only if plain substring proves annoying.
- **Single-pass library summary** — `summarize(data)` computing totals, distributions and maxima in one loop instead of ~20 separate passes across Dashboard / StatsBar / ChartsSection. Irrelevant at ~160 rows; revisit with "load your own CSV" and big files.
- **`vitest bench`** for parser + derive on a synthetic 10k-row CSV — a regression guard before Web Worker / streaming ideas.
- **`lookup` → `Map`** — CSV-keyed maps could be `Map`s outright (no prototype issue by construction); `lookup` then only remains for static config objects like `LANGUAGE_NAMES` (which `Intl.DisplayNames` removes anyway).

### Constants (`src/constants/`)
Scope: `ui.ts` (+ `ui.test.ts`). Checked against the real CSV (159 shows): genres Drama 85 · Sci-Fi & Fantasy 73 · Action & Adventure 72 · Animation 56 · Comedy 48 · **Crime 26** · Mystery 19 · Documentary 4 · Family 4 · Kids 2 · War & Politics 1 · Reality 1; ratings 59 green / 88 amber / 9 red; statuses Ended 96 · Returning 51 · Canceled 12. (Semantic theme tokens for tier colors are under Entry / root — not repeated.)

#### P1
- **`GENRE_COLORS` follows TMDB's TV genre list** — Crime (26 shows, 6th most common) renders as grey `default`, as do Documentary / Family / Kids / War & Politics / Reality. Meanwhile 6 of the 12 entries (Action, Fantasy, Thriller, Romance, Horror, Adventure) are TMDB *movie* genres that never occur in TV data. Replace with the 16 TV genres (Action & Adventure, Animation, Comedy, Crime, Documentary, Drama, Family, Kids, Mystery, News, Reality, Sci-Fi & Fantasy, Soap, Talk, War & Politics, Western), typed like `STATUSES` (`satisfies Record<TvGenre, …>`) with `KNOWN_GENRES` / `TvGenre` in `types/series.ts` (`genres: (TvGenre | (string & {}))[]`, data type stays free of UI imports), and keep the lookup fallback for anything else.
- **Typography scale** — ~60 inline `fontSize` literals across pages/components (11 ×20, 12 ×13, 13 ×9, 14 ×6, 10 ×3, 20 ×2). A `FONT = { micro: 10, caption: 11, small: 12, body: 13, emphasis: 14, stat: 20 }` (like `SPACING`) makes the scale visible and consistent; the "axis ticks 11" rule becomes `FONT.caption`.
- **Encode the gutter conventions** — CLAUDE.md says outer gutter `[16, 16]`, inner `[10, 10]`, but these are retyped everywhere and `10` isn't in `SPACING` (so `gap: 10`, `marginBottom: 10` stay raw). Add `GUTTER = { outer: [16, 16], inner: [10, 10] } as const` and an inner step to `SPACING`; then the convention is a constant, not prose.
- **Status display labels** — `ShowCard` hard-codes "Ongoing" and Dashboard hard-codes "New eps" for Returning Series. Add `label` / `short` to each `STATUSES` entry (e.g. Returning Series → "Airing"), so every badge reads from one table. Note "New eps" is shown for every unfinished Returning Series — it really means "not caught up"; pick honest wording (or base it on `lastEpisodeAirDate`).

#### P2
- **Colorblind-safe tiers** — rating/completion use green / amber / red, the classic deuteranopia trap, and 88 of 159 ratings sit in the amber middle tier. Options: a blue / amber / vermillion scale, or keep hue but always pair with shape (▲ ● ▼) or the number. Add a test asserting tier colors differ in lightness, not only hue.
- **Theme-owned card style** — `cardShadow(isDark)` / `cardStyle(isDark)` take a boolean and branch; theme-varying values belong on `Theme` (CLAUDE.md: "every color that varies by theme must come from the Theme object"). Move `cardShadow` (and radius) into each theme — Dracula could get a purple-tinted shadow — and `cardStyle(theme)` just reads it.
- **Status icon + description** — extend `STATUSES` with an icon (e.g. `SyncOutlined` Returning, `CheckOutlined` Ended, `StopOutlined` Canceled) and a one-line tooltip ("Canceled — no further seasons planned"). Tags and the donut legend then carry meaning beyond color (helps the colorblind point too).
- **Sort table with direction** — `SORT_LABELS` bakes "↓" into labels; make each entry `{ label, field, defaultDir }` so the Pages asc/desc toggle and the table view share one definition, and labels drop the arrow glyph.
- **Collision check between palettes** — Action & Adventure and Canceled are both red, Comedy gold equals Default Dark's `theme.star`, Returning Series green equals the "good" rating tier. A test (or doc table) listing semantic colors that must not coincide on the same screen (status vs genre on Show Detail).

#### P3
- **Split `ui.ts`** — it mixes layout (`SPACING`, gutters), color tables (genres, statuses, tiers), sort config and a breakpoint helper. `layout.ts` / `colors.ts` / `sort.ts` with `ui.ts` re-exporting during migration.
- **Named Dashboard limits** — `slice(0, 3)` recently watched, `6` continue watching / genres, `8` not started, `15` actors, `20` keywords are scattered literals; a `LIMITS` object documents them and feeds the "customizable dashboard" idea.
- **Genre icons** — optional icon/emoji per genre for chips and the quick switcher (🔍 Crime, 🚀 Sci-Fi & Fantasy), alongside the color.
- **Data-driven rating tiers** — tiers relative to the library (top 25% green, bottom 10% red) instead of fixed 8 / 6, as a setting; makes the color mean "good *for you*". Keep fixed tiers as default.
- **Motion constants** — `0.25s ease` (BottomNav), `debounce={200}`, `300ms` save debounce, `800ms` anchoring guard: `MOTION` / `TIMING` constants so reduced-motion handling can zero them in one place.

### Types (`src/types/`)
Scope: `series.ts` (`TvSeries`, `KNOWN_STATUSES` / `KnownStatus`, `NameValue`, `NameCount`), `filters.ts` (`Filters`, `SortKey`, `NumericSortKey`) — plus the compiler settings that decide how much the types can catch (`tsconfig.json`: `strict`, target/lib `ES2020`).

#### P1
- **Typed CSV columns** — `parseSeriesCsv`'s `RawRow` is `Record<string, string | undefined>`, so a typo like `row['Actors/Actress']` compiles and silently yields `[]` for every show. Define `CSV_COLUMNS = ['TV ID', 'Name', …] as const` + `type CsvColumn` + `type RawRow = Partial<Record<CsvColumn, string>>`. Also gives the exported column list the Utils "contract test vs `series-search.py` FIELDNAMES" idea needs, and `REQUIRED_COLUMNS` becomes `CsvColumn[]`.
- **Read-only data** — `TvSeries` fields and the context's `data` are mutable; every `.sort()` today runs on a fresh copy (checked), but one future `data.sort(...)` in a page would reorder the shared array and break "last row = most recent" everywhere. `readonly TvSeries[]` + `Readonly<TvSeries>` (and `readonly string[]` lists) makes that a compile error.
- **One unknown convention for strings** — numbers use `null` for unknown, but `firstAirDate`, `lastEpisodeAirDate`, `posterUrl`, `tagline`, `overview` use `''`, so consumers mix `!= null` and truthiness (`series.posterUrl && …`, `formatDate` checking `iso ?`). Make them `string | null` (dates validated as `YYYY-MM-DD` in the parser, e.g. a branded `IsoDate`), matching the CLAUDE.md rule "consumers check `!= null`".
- **Filters codec** — `Filters` is validated ad hoc in `loadFilters`; the URL-state idea (Pages) needs the same parse in a second place. One `parseFilters(unknown | URLSearchParams): Filters` + `serializeFilters(f)` next to the type, tested once, used by localStorage and the URL.

#### P2
- **Branded `TvId`** — `type TvId = number & { readonly __brand: 'TvId' }`, created only by the parser and a `parseTvId(param: string | undefined): TvId | null` for the route. `byId.get(index)` or `navigate(`/shows/${someCount}`)` stop compiling; the Show Detail `Number(id)` parse moves into one tested function.
- **Enriched series type** — `TvSeriesView = TvSeries & { progress: number; progressState: ProgressState; watchIndex: number; remainingMinutes: number | null }` computed once in the provider (pairs with Context "derived indexes" and Utils `progressState`), so pages stop recomputing `episodesWatched / totalEpisodes` with their own edge-case handling.
- **Design the `Filters` shape once** — the Pages filter ideas (progress filter, more filters, AND/OR, sort direction) plus multi-select status (`status: string` → `statuses: string[]`) should land as one shape together with the codec and settings versioning, not one field per feature.
- **Bump `lib` / `target` to ES2023** — unlocks `toSorted` / `toReversed` / `findLast` (immutable by construction, fits read-only data: `recentFirst` = `data.toReversed()`). All evergreen browsers support it; check the support target in README first.
- **`noUncheckedIndexedAccess`** — catches `chartColors[i]`, `buckets[idx].count++`, `entries[0][0]` (`topGenreByWatchTime`) and `warnings[0]` as possibly undefined. Expect a moderate number of fixes; most are real edge cases (empty arrays).
- **Type-level tests** — Vitest `expectTypeOf` for the guarantees the project relies on: `NumericSortKey` rejects a string field, `status` accepts any string but autocompletes known ones, `STATUSES` covers every `KnownStatus`, `SORT_LABELS` covers every `SortKey`. Today those guarantees are only "it compiled"; a refactor could silently weaken them.

#### P3
- **Runtime schema → inferred types** — one schema library (e.g. valibot, small) defining CSV row, settings and URL filters; types come from `InferOutput`. Removes hand-written validators in three places. Weigh bundle size vs the handful of hand checks.
- **Unified bucket type** — `{ range, count }`, `{ year, count }`, `{ decade, hours }`, `{ depth, count }`, `{ genre, pct }` alongside `NameValue` / `NameCount`: a generic `Bucket<K> = { key: K; value: number }` would let the chart registry idea render any distribution with one component. (Earlier review kept per-chart names deliberately — revisit only with the registry.)
- **`Theme` type in `src/types/`** — `themes.ts` holds both the type and the data; moving `Theme` (+ the `ThemeName` union from Entry / root) into `types/theme.ts` mirrors `series.ts` / `filters.ts` and lets `settings` validation import the type without the theme objects.
- **Template-literal route types** — `type AppPath = '/' | '/shows' | '/stats' | `/shows/${TvId}``; `navigate` wrapped in a typed `go(path: AppPath)` so a mistyped route (`'/show/'`) fails to compile.
- **`exactOptionalPropertyTypes`** — distinguishes "missing" from "`undefined`" in props like `StatCard`'s `suffix` / `precision`; low value today, worth enabling alongside the settings schema.

### Outside `src/`
Scope: `series-search.py` (+ `scripts/test_series_search.py`, `scripts/run-python.mjs`), `public/tv_series.csv`, build/test config (`vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `eslint.config.js`, `tsconfig*.json`), CI (`.github/workflows/ci.yml`), repo hygiene (`package.json`, `openspec/`, docs).

#### P1
- **Re-watch moves the row to the end** — row order *is* the watch history, but `CsvStore.update()` rewrites an existing row in place. Adding season 4 of a show first saved a year ago leaves it buried, so Dashboard "Recently Watched" / Shows `recentFirst` never show it. On update, move the row to the end (default on, with a "keep position" checkbox for metadata-only fixes).
- **Bulk metadata refresh** — TMDB status / total episodes / rating / last air date go stale (a "Returning Series" ends, new episodes air, so "New eps" and completion % drift). A "Refresh all" action (and `--refresh` CLI flag) re-fetches details for every row through the existing worker + parallel pool, updates TMDB fields only (never `Seasons Watched` / `Episodes Watched` / runtime watched) and reports changes ("12 updated: 3 now Ended, 5 have new episodes"). Row order untouched.
- **Node 20 is EOL (April 2026)** — CI still runs `node-version: 20`. Move to Node 22 LTS (or 24), add `"engines"` + `.nvmrc`, and update the CLAUDE.md lock-file rule (it pins "regenerate with npm 10 because CI is Node 20").
- **Dedupe Vite** — top-level `vite@5` vs Vitest's nested `vite@8` (with its own optional-peer esbuild) caused the `npm ci` lock failures twice (0.4.x, 0.4.11). Upgrading the app to the Vite major Vitest uses (and `@vitejs/plugin-react` to match) collapses the two trees and removes that whole class of lock-file breakage.
- **Type-check + lint `e2e/` in CI** — `e2e/` is outside `tsconfig.json` and `eslint src`; CLAUDE.md documents a long ad-hoc `tsc` command instead. Add `tsconfig.e2e.json` (referenced from the root, `types: ["node"]`) so `tsc -b` covers it, and lint `e2e/` + `playwright.config.ts`.
- **Mark already-saved shows in the search table** — `series-search.py` already loads the CSV; show a ✓ / "saved (S1–S3)" column in the results `Treeview` so you don't open a show just to find it's already there.

#### P2
- **Headless CLI** — `python series-search.py add "Severance" --seasons 1-2`, `refresh`, `list --missing-posters`. Same `TmdbClient` / `CsvStore`, no Tk; scriptable, and testable in CI without a display (unlike `test:gen`).
- **Python checks in CI** — `ruff` + `mypy` (or `pyright`) on `series-search.py` / `scripts/` plus pure-function tests (`new_row`, `us_certification`, `first_runtime`, `redact`, `CsvStore` against a temp dir) that don't need Tk. `test:gen` stays local for the widget-driven part.
- **Declare Python deps** — the script imports `requests` but there's no `requirements.txt` / `pyproject.toml`; a minimal `pyproject.toml` (requests, dev: ruff/mypy) with a pinned Python version documents setup in one place.
- **"Last Watched" column** — the CSV has no timestamp, so the app can't do timelines, streaks or "watched this year". The generator stamps `Last Watched` (ISO date) on every add/update; the app treats it as optional (`null` for old rows) and falls back to row order. Unlocks a whole class of features (year in review, watch-time over time). CSV contract change → update `FIELDNAMES`, parser, contract test together.
- **Episode-level progress** — season checkboxes can't express "halfway through S3". Optional per-season episode count in the season panel (stored as `S3:5` or a separate column), feeding `Episodes Watched` / runtime exactly.
- **Store poster paths, not sized URLs** — `Poster URL` hard-codes `w500`; store the TMDB path (or keep the URL but let the app rewrite the size segment) so the app can pick `w92`–`w780` (`srcSet` idea under Components). Backward compatible if the app only rewrites URLs matching `image.tmdb.org/t/p/w\d+/`.
- **TMDB v4 bearer token** — the v3 `api_key` travels as a query parameter (hence the `redact()` regex); a v4 read token goes in the `Authorization` header, never in URLs or exception text. Accept either via env.
- **Rolling CSV backups** — atomic writes protect against crashes, not against a wrong save. Keep the last N copies (`public/backups/tv_series-<timestamp>.csv`, gitignored) before each write; "Undo last save" button restores the newest.
- **Prettier check + Dependabot** — `format` only rewrites `src` locally; add `prettier --check` to CI (and cover `e2e/`). Dependabot / Renovate for npm + GitHub Actions + pip, grouped weekly — the lock-file rules above make small regular bumps safer than rare big ones.
- **Bundle budget** — antd + recharts dominate the bundle; `rollup-plugin-visualizer` once, then `manualChunks` (vendor-antd / vendor-charts) and a CI size check so Statistics' chart code doesn't land in the Dashboard chunk unnoticed.
- **React 19 / Recharts 3** — React 18.3 and Recharts 2 are a major behind; React 19 also changes the `set-state-in-effect` / StrictMode story CLAUDE.md documents. Spike in a branch with the e2e suite as the safety net.

#### P3
- **Public demo deploy** — GitHub Pages workflow building with a synthetic CSV (the e2e `TEST_CSV` or a bigger generated one; the real CSV stays gitignored/private) → live demo link in README and screenshots that update themselves. Needs the base-path idea from Entry / root.
- **LAN dev server opt-in** — `vite.config.ts` sets `server.host: true`, so every `npm run dev` exposes the app (and the personal CSV) to the local network. Make it `npm run dev:lan` and keep `dev` on localhost.
- **Import from other trackers** — one-off importer (Trakt / TV Time / Netflix viewing-history CSV) that matches titles via TMDB search and writes rows in watch order; review screen for ambiguous matches.
- **Generator UX** — poster thumbnail + overview in the search results, dark-mode Tk theme matching the dashboard, keyboard-only flow (Enter search → ↓ select → Enter save → space toggles seasons).
- **OpenSpec baseline specs** — `openspec/specs/` is empty; capture the current behavior (CSV contract, unknown-value rules, navigation, persistence) as specs so future changes from this list go through proposal → delta specs against a real baseline. `features.txt` is a natural source.
- **Coverage report + thresholds** — `vitest --coverage` (v8) in CI with a floor for `src/utils` / `src/hooks`, uploaded as an artifact; keeps the extracted-hooks / pure-function ideas tested.
- **Tidy the root** — `features.txt`, `BUG_BACKLOG.md`, `IDEAS.md`, `CHANGELOG.md` and `series-search.py` all at top level; move docs into `docs/` and the generator into `tools/` (its `CSV_PATH` is script-relative, so update it and `test:gen` together).

---

## Completed

Finished work, kept for history. ✅ done · 🟡 in progress · ⬜ not started.

### Next Up (all done)

1. ~~Manual run of `series-search.py`~~ — ✅ 2026-11-24: driven through its real Tk widgets (Enter key, buttons, season checkboxes, Confirm) from a scratch copy with TMDB faked — 25/25: search + details fill, Enter / Next / Prev / Search mid-load keep the page counter in sync, new show appended (Seasons / Runtime from details, not `—`), saved seasons shown checked + disabled, existing row updated in place, failed season skipped + reported + still addable, all-failed saves nothing, API key never in the CSV. Harness confirmed to catch the old paging bug. Not covered: real TMDB responses (needs a live key).
2. ~~Browser check~~ — ✅ 2026-11-24 (Playwright, synthetic CSV via route interception, 37/37 twice): `CsvWarningBanner` (count, record numbers, duplicate / invalid ID, dismiss), Highlights via `ShowRowCard` (right shows, aria-labels, click / Enter / Space navigate, broken-poster fallback), `'–'` for blank / 0 / N/A / fractional / huge / negative values on Dashboard, Show Detail and Shows (no `N/A`, `0.0`, `2.5`, `-5 min`; `1e7` seasons renders instantly), URL-keyed poster fallback across SPA navigation, search, `#theme-select`; real CSV: no banner, no console errors, all posters load.
3. ~~Quick fix: `ThemeToggle` `Select` `id`~~ (done in v0.4.11)
4. ~~Make the Playwright check permanent~~ — ✅ v0.4.12: `e2e/` + `npm run e2e` + CI `e2e` job; generator check is `npm run test:gen` (local only).
5. ~~`series-search.py` off the main thread + `App` class~~ — ✅ v0.4.13: `TmdbClient` / `CsvStore` / `App`, workers + polled result queue, API key redacted from errors, importable (`npm run test:gen` imports it).
6. ~~v0.4.11 simplify skips~~ — ✅ v0.4.13: `ratingColor(null)` + `formatRating`, exported `STATUSES` (derived maps removed), `StatCard` `formatter` on Show Detail, `BottomNav` component, `STAR_COLOR` (kept gold, by choice).
7. ~~Optional cleanups~~ — ✅ v0.4.13: CSV `N/A` → `''` (114 cells, backup `public/tv_series.csv.bak`), `status: KnownStatus | (string & {})`, `tsc -b` build.

### Shipped improvement ideas

#### Entry / root — ✅ v0.4.23 (OpenSpec `add-pwa-offline`)
- ~~**Installable PWA / offline**~~ ✅ — the app is static and already mobile-first (bottom nav). `vite-plugin-pwa` + manifest + service worker caching chunks and `tv_series.csv` (network-first) → home-screen icon, works offline. `<meta name="theme-color">` from the active theme comes with it. Shipped with a Reload prompt for new versions (`registerType: 'prompt'`), an offline notice, and a `pwa` Playwright project on `vite preview`; posters deliberately not cached.

#### Entry / root — ✅ v0.4.22 (OpenSpec `smarter-route-prefetch`)
- ~~**Smarter prefetch**~~ ✅ — idle prefetch loaded every page chunk unconditionally. Now skipped under Data Saver / 2G (`shouldIdlePrefetch`); nav items prefetch on hover/focus (touch-start on `BottomNav`), and `ShowCard` / Dashboard show rows prefetch the Show Detail chunk so the first open has no Suspense flash. Loaders moved to `src/routes/pageLoaders.ts`.

#### Entry / root — ✅ v0.4.21 (OpenSpec `sync-settings-across-tabs`)
- ~~**Cross-tab sync**~~ ✅ — listen to the `storage` event for `tvdash-settings`; theme changed in one tab applies in the others. Shipped as `subscribeSettings()` in `settings.ts`; saved filters deliberately **not** live (would overwrite typing in an open Shows page) — they apply on the next visit. Corrupt values ignored, a reset propagates.

#### Entry / root — ✅ v0.4.20 (OpenSpec `add-semantic-theme-colors`)
- ~~**Semantic theme tokens**~~ ✅ — rating/completion colors were fixed hexes in `constants/ui.ts`, so Dracula showed stock green/amber/red next to its own palette (and Default Light's were 1.75–2.08:1, badges white-on-amber 1.9:1). Now `Theme.tiers` (`success` / `warning` / `danger`, each `{ fill, onFill }`) + `star`, covered by the contract test; `areaFill` removed (= `token.colorPrimary`). Status colors stay on antd Tag presets (separate idea).

#### Entry / root — ✅ v0.4.15 (OpenSpec `add-system-theme-and-color-scheme`)
- ~~**Native `color-scheme` per theme**~~ ✅ — set `document.documentElement.style.colorScheme` (and `<html>` background) from `activeTheme.isDark` in `App`. Today scrollbars, autofill and native form controls stay light inside the dark themes (very visible on Windows, where `Content` is the scroll container).
- ~~**"System" theme option**~~ ✅ — first visit always lands on Default Dark. Add a `System` entry that follows `prefers-color-scheme` (Default Dark ↔ Default Light) and listens for changes via `matchMedia(...).addEventListener('change')`; make it the default when nothing is saved.
- ~~**No flash on load**~~ ✅ — `index.html` has no background, so Light/Dracula users see a dark→theme (or white→dark) flash before React mounts. A tiny inline script that reads `tvdash-settings.themeName` and sets `html` background/`color-scheme` before the bundle runs. (Touches the "one CSS rule in index.html" convention — would need a documented exception.)

#### Entry / root + Components — ✅ v0.4.15 (OpenSpec `add-route-document-titles`)
- ~~**Per-route `document.title`**~~ ✅ — tab always says "TV Dashboard". Use the same title lookup as the header (`Dashboard · TV Dashboard`, `<show name> · TV Dashboard` on Show Detail) so browser history, bookmarks and tab switching are readable.
- ~~**Show name in the header**~~ ✅ — `AppLayout` already reads the context (for `warnings`); on `/shows/:id` it can show the series name instead of the generic "Show Detail" (fallback to "Show Detail" while loading / not found).

#### Entry / root — ✅ v0.4.16 (OpenSpec `add-root-error-safety-net`)
- ~~**Root safety net + settings reset**~~ ✅ — `RouteErrorBoundary` sits inside `AppLayout`; a crash in `ThemeProvider`/`ConfigProvider`/`TvDataProvider`/`AppLayout` itself is a blank white page. Add a top-level boundary in `main.tsx` with a plain (no antd) fallback: "Reload" + "Reset saved settings" (clears `tvdash-settings` / `tvdash-sidebar` via `settings.ts`). Also support `?reset` in the URL as an escape hatch.

#### Entry / root — ✅ v0.4.17 (OpenSpec `respect-reduced-motion`)
- ~~**Respect `prefers-reduced-motion`**~~ ✅ — nothing in `src/` checks it. One root hook → antd `ConfigProvider` `token.motion: false`, Recharts `isAnimationActive={false}` (via theme or a small context), no `BottomNav` slide transition.

#### Entry / root — ✅ v0.4.18 (OpenSpec `add-root-smoke-test`)
- ~~**Root smoke test**~~ ✅ — render `<App />` in jsdom with a mocked `fetch` and `MemoryRouter`-equivalent, assert each route mounts and that a corrupt `tvdash-settings.themeName` falls back to System. Root files currently have zero unit coverage (only e2e).

#### Entry / root — ✅ v0.4.19 (OpenSpec `refactor-typed-theme-provider`)
- ~~**Strongly typed theme names**~~ ✅ — `THEMES: Record<string, Theme>` lets any string index it and duplicates `name` (key + field). Use `as const satisfies Record<ThemeName, Omit<Theme,'name'>>` with `ThemeName` derived from the keys; `loadThemeName` returns `ThemeName`, `ThemeToggle` options become exhaustive, and `THEMES[x] ?? fallback` stops being needed.
- ~~**Theme contract test** (`themes.test.ts`)~~ ✅ — every theme has exactly 10 distinct `chartColors`, all required fields, and WCAG contrast ≥ 4.5 for `chartText` on `contentBg` / ≥ 3 for each chart color on `contentBg`. Catches a bad new theme before it ships.
- ~~**Extract `AppThemeProvider`**~~ ✅ — move theme state, persistence, `configTheme` memo, color-scheme effect and system-theme listener out of `App` into one provider (`ThemeContext.tsx` already exists). `App` becomes just provider stack + routes, and `ThemeToggle` can read/set the theme from context instead of prop-drilling `activeThemeName` / `onThemeChange` through `AppLayout`.
  - Contract test found **two** failing Default Light chart colors (not one): `#d97706` 2.93:1 → `#b45309`, `#65a30d` 2.84:1 → `#4d7c0f`.

### Module review tracker

#### Entry / root (`src/`) — ✅ Review complete (2026-11-23: code-review, simplify, security-review)
- `main.tsx` — entry point, React.StrictMode
- `App.tsx` — provider stack + routes
- `ThemeContext.tsx` — `ThemeProvider` + `useTheme()`
- `themes.ts` — `Theme` type, 3 themes (Default Dark, Default Light, Dracula)
- `setupTests.ts` — test setup

#### Pages (`src/pages/`) — ✅ Review complete (2026-11-23: simplify, code-review, security-review)
- `DashboardPage.tsx`
- `ShowsPage.tsx`
- `ShowDetailPage.tsx`
- `StatisticsPage.tsx`
- `NotFoundPage.tsx` — catch-all `*` route (added 2026-11-23)

##### Code-review findings — ✅ all 10 fixed in v0.4.1 (2026-11-23)
Full list + remaining open items in [BUG_BACKLOG.md](BUG_BACKLOG.md). Fix notes in CHANGELOG `[0.4.1]`.

##### Security-review — ✅ no findings (2026-11-23)
No unsafe sinks in `src/` (`dangerouslySetInnerHTML`/`innerHTML`/`eval`/`href`/`window.open`/`location.*`); CSV text rendered via React escaping; `:id` only used in `Number(id)` lookup; `navigate()` targets are static or numeric; localStorage reads type-checked.

#### Components (`src/components/`) — ✅ Review complete (2026-11-23/24: simplify, code-review, security-review, Playwright browser check)
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

##### Simplify — ✅ 16 fixes applied (2026-11-23)
- **New shared helpers:** `PosterThumb`, `StatCard`, `utils/a11y.ts` (`activateOnKey`), `truncate()` in `derive.ts`, `avgRatingColor()` in `ui.ts` (removed in v0.4.8)
- **ChartsSection:** `formatRuntime` in watch-time tooltip (was 90m → "2h 30m"); truncation inside `useMemo`s (stable chart data, no animation replay); `countBarChart` helper for Languages/Networks/Actors/Creators; shared `axisTick`; dropped no-op `useCallback`; `destroyOnHidden` on both `Tabs`; Status pie uses `STATUS_COLORS`
- **AppLayout:** antd tokens instead of hardcoded `isDark ? '#fff' : '#000'`; title from `NAV_ITEMS` (`PAGE_TITLES` removed); removed wrapper div + dead `|| '/'`; removed `onCollapse`/`collapsible`; scroll handler only sets state on change
- **FilterBar:** status/sort options hoisted to module level, genre options memoized, `SECTION_GAP`
- **StatsBar:** one runtime sum → hours/years; Avg Rating no longer red when unrated
- **ShowGrid:** wrapper div removed, `SPACING.lg`
- **LoadingState callers:** default tip no longer passed
- Side effect: closes the `ShowCard` 404 poster bug

##### Code-review — ✅ all 10 findings fixed in v0.4.2 (2026-11-24)
Pie legend replay (important), mobile nav stuck hidden, scroll not reset on navigation, error-boundary double throw, trailing-slash nav, Hours double rounding, status fallback colors, hover-text precision, `formatRuntime` fractions, stale CLAUDE.md poster note. Details in CHANGELOG `[0.4.2]`.

##### Security-review — ✅ no findings (2026-11-24)
No `dangerouslySetInnerHTML`/`innerHTML`/`eval`/`new Function`/`window.open`; `error.message` rendered as escaped text; `posterUrl` only reaches `<img src>`; pathname only compared to static `NAV_ITEMS` keys; `tvdash-sidebar` read is a strict `=== 'true'`.

##### Browser check (Playwright) — ✅ 21/21, 3 consecutive runs (2026-11-24)
Ad-hoc script (not in repo): routes + titles, 404, trailing slash, scroll reset, pie legend fade on tab revisit, StatsBar hover text, Hours parity with Dashboard, mobile nav hide/show + desktop round-trip, no console errors. Surfaced 2 extra fixes: scroll-anchoring re-hiding the mobile nav, `Content` padding warning.
- [x] Status pie colors (fixed per status; In Production/Planned/Pilot added in v0.4.2)
- [x] Pie entry animation + legend fade on returning to Overview tab
- [ ] Sidebar collapse persists across desktop ↔ mobile resize — moved to Open follow-ups at the top

##### Skipped / deferred
- Fully data-driven chart config (large rewrite; `countBarChart` covers most of it) → now tracked as Components P3 "Chart registry"
- ~~Single `STATUSES` source~~ (done in v0.4.8); ~~`SORT_OPTIONS` duplication~~ (done in v0.4.9)
- ~~`cardStyle(isDark)` helper~~ (done in v0.4.11)

##### Follow-ups
- ~~`ThemeToggle` `Select` has no `id`~~ (done in v0.4.11)
- ~~Permanent Playwright e2e suite~~ (done in v0.4.12)

#### Context (`src/context/`) — ✅ Review complete (2026-11-24: simplify, code-review, security-review, Playwright check)
- `TvDataContext.tsx` — `TvDataProvider` only (passes `useTvData()`'s memoized value straight through, v0.4.11)
- `useTvDataContext.ts` — context object (`null` default) + `useTvDataContext()` that throws outside the provider; component-free for Fast Refresh (added 2026-11-24)

##### Simplify — ✅ 3 fixes (2026-11-24)
Context type from `ReturnType<typeof useTvData>`; `null` default + throwing hook; memoized provider value.

##### Code-review — ✅ all 5 findings fixed in v0.4.3 (2026-11-24)
Fast Refresh context recreation (file split), misleading memo comment, plus 3 older `useTvData` bugs: row-level parse errors fatal, unchecked `TV ID`, stale data on failed refetch. Details in CHANGELOG `[0.4.3]`.

##### Security-review — ✅ no findings (2026-11-24)
Fixed fetch URL; no `eval`/`Function`/unsafe deserialization/HTML sinks; `console.warn` only logs CSV line numbers + show names.

##### Browser check (Playwright) — ✅ (2026-11-24)
Real CSV loads all 159 shows with 0 skip warnings; editing `TvDataContext.tsx` with `/shows` open hot-reloads with no error; no console errors.

#### Hooks (`src/hooks/`) — ✅ Review complete (2026-11-24: simplify, code-review, security-review)
- `useTvData.ts` — fetch lifecycle only (controller-identity staleness, `mountedRef`, `timedOut` flag); parsing delegated to `utils/parseSeriesCsv.ts`
- `useTvData.test.ts` — lifecycle tests (incl. superseded response, refetch after unmount, real timeout)

##### Simplify — ✅ applied (2026-11-24)
Parsing → pure `parseSeriesCsv.ts`; 3 staleness refs → controller identity; `timedOut` flag; `num()`/`str()` helpers; `toSeries` returns `null` for bad ID; dropped `any`; test helpers (`fakeResponse`, `stubFetch`, `renderLoaded`) + shared fixtures.

##### Code-review — ✅ all 5 findings fixed in v0.4.4 (2026-11-24)
Broken quote silently dropping later rows (important, regression from 0.4.3), refetch after unmount, no stale-response tests, missing `act()`, stubbed `fetch` not removed. Details in CHANGELOG `[0.4.4]`.

##### Security-review — ✅ no findings (2026-11-24)
Fixed same-origin fetch URL; no `dynamicTyping`; `__proto__` header inert; no unsafe sinks.

#### Utils (`src/utils/`) — ✅ Review complete (2026-11-24: simplify, code-review, security-review. `settings.ts` hardened in v0.4.1 security pass; `parseSeriesCsv.ts` reviewed with Hooks in v0.4.4)
- `a11y.ts` — `activateOnKey` Enter/Space helper (added 2026-11-23)
- `derive.ts` — aggregation functions; `truncate()` added, `formatRuntime` now rounds (v0.4.2)
- `derive.test.ts`
- `parseSeriesCsv.ts` — pure CSV → `TvSeries[]` (added 2026-11-24) ✅
- `parseSeriesCsv.test.ts` + `parseSeriesCsv.fixture.ts` (`csv()`, `withId()` helpers)
- `lookup.ts` — own-key `lookup(map, key)` for CSV-derived keys (v0.4.11, moved out of `ui.ts`)
- 77 tests total across `derive`, `parseSeriesCsv`, `useTvData`, `ui`
- `settings.ts` — localStorage wrapper (`tvdash-settings`)

##### Simplify — ✅ done in v0.4.5 (2026-11-24)
Reuse / efficiency / altitude: clean. Un-exported `REQUIRED_COLUMNS` + fixture `HEADER`; `VALID_CSV = csv(VALID_ROW)`; `withId()` fixture helper replaces 5 copied regexes. Skipped: sidebar key into `settings.ts`, hours helper, `format.ts` split. Details in CHANGELOG `[0.4.5]`.

##### Code-review — ✅ all 5 findings fixed in v0.4.6 (2026-11-24)
Skipped rows console-only (important — now `CsvWarningBanner` + all-skipped fatal), empty CSV delimiter error, duplicate TV IDs, wrong line numbers in warnings, `truncate` splitting emoji / `max < 2`. Details in CHANGELOG `[0.4.6]`.

##### Security-review — ✅ no findings (2026-11-24)
CSV → plain strings/numbers only; banner text rendered by React (no `dangerouslySetInnerHTML` in `src/`); `posterUrl` only in `<img src>`, no CSV-built `href`; `settings.ts` `__proto__` inert.

#### Constants (`src/constants/`) — ✅ Review complete (2026-11-24: simplify, code-review, security-review)
- `ui.ts` — colors, spacing, `cardShadow` / `cardStyle` (v0.4.11), `responsiveColumns`; single exported `STATUSES` table (literal access, v0.4.13); `statusHex`/`statusTagColor`/`genreTagColor` own-key lookups; `sortStatuses`; `tierColor`-based `ratingColor` (accepts `null`, v0.4.13) / `completionColor`; `STAR_COLOR` (v0.4.20: replaced by theme-driven `tier` / `ratingTierColors` / `ratingColor(v, theme)` / `completionColor(v, theme)` + `theme.star`)
- `ui.test.ts` (added v0.4.8)

##### Simplify — ✅ done in v0.4.8
One `STATUSES` table; `avgRating()` → `number | null` (dropped `avgRatingColor` + `'–'` round-trip); `tierColor`; FilterBar status options derived. Skipped: `presetPalettes`-derived hexes (would change Ended/Canceled), other `'–'` sentinels (`topGenreByWatchTime`, StatsBar top network), shared `<StatusTag>`.

##### Code-review — ✅ all 5 findings fixed in v0.4.8
Status filter options from data; typed literal keys; Canceled red unified (`#f5222d`); own-key lookups (+ `derive.ts` null-prototype counts); one unknown-status fallback (theme chart color). Details in CHANGELOG `[0.4.8]`.

##### Security-review — ✅ no findings
Color helpers never return CSV text; own-key lookups; no unsafe sinks.

#### Types (`src/types/`) — ✅ Review complete (2026-11-24: simplify, code-review, security-review)
- `series.ts` — `TvSeries` (unknown = `null`, normalized in `parseSeriesCsv`), `NameValue`, `NameCount`
- `filters.ts` — `Filters`, `SortKey`, `NumericSortKey` (added v0.4.9)

##### Simplify — ✅ done in v0.4.9
`NameValue`/`NameCount`; `Filters`/`SortKey` → `types/filters.ts`; single sort-key source; dropped `as number` cast. Skipped: `episodeRuntime` → `0` (wrong direction), deriving `firstAirYear` from `firstAirDate` (CSV contract), `status: KnownStatus` (layering — later done as `KnownStatus | (string & {})` in v0.4.13).

##### Code-review — ✅ all 6 findings fixed in v0.4.9
Nullable unknowns (year "0", "★ 0.0", "N / 0", N/A tag), Seasons Watched dedupe, number-only `NumericSortKey`, exhaustive sort labels, `Filters.status` sentinel, `NameValue` comment. Details in CHANGELOG `[0.4.9]`.

##### Security-review — ✅ no findings
Saved `sortBy` validated before use as a key; parser helpers produce only numbers / strings / null; no unsafe sinks.

#### Outside `src/` — ✅ Review complete (2026-11-24: simplify, code-review, security-review)
- `series-search.py` — Tkinter TMDB CSV generator; writes `public/tv_series.csv`, blank for unknown, follows existing header. Since v0.4.13: `TmdbClient` / `CsvStore` / `App`, all network calls in workers (polled result queue), API key redacted, atomic CSV rewrite, `utf-8-sig` reads, importable for `scripts/test_series_search.py`
- `public/tv_series.csv` — data source
- Config: `tsconfig.node.json` (`outDir` → `node_modules/.tmp`), `vitest.config.ts` (merges vite config, node env default), `eslint.config.js`

##### Simplify — ✅ done in v0.4.10
`_tmdb_get` helper, session params/headers, `append_to_response` + details cache, `FIELDNAMES`, `load_rows`, config cleanup. Skipped: ESLint flat presets; ~~worker threads, `App` class, `tsc -b` build~~ (done in v0.4.13).

##### Code-review — ✅ all 10 findings fixed in v0.4.10
Incl. 2 regressions from the simplify step (saved-season checkboxes, ESLint `dist/`). Plus generator output: `public/` path, blank for unknown. Details in CHANGELOG `[0.4.10]`.

##### Simplify — ✅ v0.4.13 (whole uncommitted 0.4.12–0.4.13 diff)
Injectable `session` / `dialogs` (harness passes fakes, no global monkeypatching), redaction only in `TmdbClient.get`, parallel season fetches, polling only while work is pending, `first_runtime` / `air_year`; `KnownStatus` moved to `types/series.ts`; e2e `csv` fixture option + shared `csv()` header + deterministic broken poster; CI Playwright cache. Skipped: triple CSV read per save (negligible, re-read is deliberate), locked details cache (rare duplicate request), fixed 1s wait in the desktop→mobile e2e test (deliberate).

##### Code-review — ✅ all 6 findings fixed in v0.4.13
CSV truncation on rewrite (atomic temp + `os.replace`), Excel BOM hiding rows (`utf-8-sig`), season double-count, silent save errors (dialog), Show Detail tile overflow (2×2 below `xl`, `minWidth: 0`), `test:gen` on `python3` systems. Details in CHANGELOG `[0.4.13]`.

##### Security-review — ✅ no findings
Key never in CSV/logs; ~~may appear in a local error dialog~~ (redacted in v0.4.13); fixed path; DictWriter quoting.
