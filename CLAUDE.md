# CLAUDE.md — TV Dashboard

## Architecture

Single-page React app. No backend. Data comes from one static CSV file (`public/tv_series.csv`) fetched at runtime.

**Provider stack (outer → inner):**
```
ThemeProvider → ConfigProvider (Ant Design) → TvDataProvider → BrowserRouter → Routes → AppLayout → RouteErrorBoundary → Suspense → Pages
```

**Data flow:** CSV → `useTvData` hook → `TvDataContext` → pages (via `useTvDataContext()`) → components (via props).

The context object + `useTvDataContext()` live in `src/context/useTvDataContext.ts` (component-free, so Fast Refresh never recreates the context); `TvDataContext.tsx` holds only `TvDataProvider`. Pages import the hook from `useTvDataContext.ts`. The context default is `null` and the hook throws outside the provider — no fake loading state.

**CSV parsing (`src/utils/parseSeriesCsv.ts`, pure — `useTvData` only fetches, logs the returned `warnings`, exposes them as `warnings` (cleared on error), and owns loading/error state):** only `FieldMismatch` (wrong field count) errors are row-local and skip that row with a warning; `Quotes`/`Delimiter` errors are fatal — a bad quote makes Papa swallow every later line into one field and reports `row` off by one, so "skip that row" would silently lose the rest of the file. Rows with a non-positive-integer or duplicate `TV ID` are also skipped with a warning (first duplicate kept). If **every** data row is skipped, that's fatal (`CSV has no valid rows`) — not the empty state. `delimiter: ','` is fixed: Papa's auto-detect fails on an empty file. Warnings say `record N` (Nth data row), never a file line number — quoted newlines in Overview make line numbers wrong. `TV ID` is a required column. **Unknown = `null`, normalized once here:** `posNum` for `firstAirYear` / `voteAverage` / `seasons` (blank, non-numeric or ≤ 0 → `null` — TMDB's `0.0` rating means no votes), `optStr` for `language` / `ageRating` (blank or `N/A` → `null`), `posNum` for `episodeRuntime` too, and `seasons` must also be an integer ≤ 1000 (`seasonCount` — it drives an `Array.from` on Show Detail); other numbers use `num(val, 0)`. Consumers check `!= null` — never `> 0`, truthiness or `=== 'N/A'` — and render `'–'` or hide the element. Sort nullable numbers with `compareDescNullsLast` (`derive.ts`); for the single top row use `maxBy(data, pick)` (skips nulls, first row wins ties) instead of filter + sort + `[0]`. `seasonsWatched` is deduped positive integers, so `.length` is the count. Staleness in `useTvData` is a `controllerRef` identity check (superseded by refetch or nulled on unmount), plus `mountedRef` so a retained `refetch` called after unmount is a no-op; the "timed out" message comes from a `timedOut` flag set by the timeout, not from `err.name`. On any fetch/parse error `data` is cleared to `[]` — pages check `loading` → `error` → data, and never see stale rows next to an error.

Pages always pull from context. Components always receive data as props — they do not call `useTvDataContext()` themselves. The exceptions (all intentional): `AppLayout`, `ChartsSection`, `FilterBar` and `StatsBar` call `useTheme()` directly since theme is a cross-cutting concern (card shadow, chart colors); `ShowCard` also calls it directly for its poster-fallback background, since prop-drilling a single color through `ShowGrid` isn't worth it. `AppLayout` is also the one component that calls `useTvDataContext()` — only for `warnings`, passed as a prop to `CsvWarningBanner` (shell-level, shown above every page; dismissal tied to the warnings array identity so a refetch re-shows it).

## Styling

**100% React inline styles.** No CSS files in `src/`. No Tailwind, no CSS modules, no styled-components. The one CSS rule in the project is in `index.html` (`html, body, #root { height: 100%; overflow: hidden; margin: 0; }`).

Ant Design component styling is done via `ConfigProvider` + design tokens in `src/themes.ts`.

## Theme System

`src/themes.ts` defines the `Theme` type and 3 theme objects: **Default Dark**, **Default Light**, **Dracula**. Every color that varies by theme must come from the `Theme` object — never hardcode dark/light-specific colors.

Key `Theme` fields:
- `token.colorPrimary` — Ant Design primary color; use for `strokeColor` on `Progress`
- `token.colorTextBase?` — optional; set on Default Light to `#000000` for darker text
- `posterFallbackBg` — background for shows without a poster image
- `borderColor` — sidebar/header borders
- `chartColors[]` — 10-color array for Recharts
- `isDark` — boolean, used only for Ant Design algorithm selection

`useTheme()` is the access hook.

## Shared Constants

`src/constants/ui.ts`:
- `genreTagColor(g)` — Ant Design Tag color per genre (`GENRE_COLORS` is private), `'default'` if unknown
- `ratingColor(v)` / `completionColor(v)` — green/amber/red from one `tierColor(high, mid)` (8/6 on 0–10, 75/40 on 0–100). `avgRating()` returns `number | null` — color `null` with `theme.chartText`, display it as `'–'`
- `cardShadow(isDark)` — shared card shadow formula (dark vs light); use this instead of inlining the rgba values — it was duplicated across 5 files before being extracted. `cardStyle(isDark)` = `{ borderRadius: 10, boxShadow }` — spread it into a `Card`'s style instead of repeating the pair
- **Statuses:** one private `STATUSES` table (`{ hex, tag }` per TMDB status: Returning Series, Ended, Canceled, In Production, Planned, Pilot) — add a status there once. Each hex is its tag preset's -6 shade so bars and Tags match. `STATUS_COLORS` / `STATUS_TAG_COLORS` are typed `Record<KnownStatus, string>` — **literal keys only** (`STATUS_COLORS['Returning Series']`). For a status from the CSV use `statusHex(name, theme.chartColors[i % n])` (unknown → theme chart color, same on every page) or `statusTagColor(name)`. `sortStatuses(names)` gives known-first order — FilterBar's status options come from the data through it, like genres
- **CSV-derived keys:** never index a plain object with a CSV string (`map[csvValue]`) — `constructor`/`toString` return inherited functions and skip the `??` fallback. Use the `ui.ts` helpers or `lookup(map, key)` (own-key, `src/utils/lookup.ts`), and `Object.create(null)` for count maps (see `derive.ts`)
- `SORT_OPTIONS` — built from `SORT_LABELS: Record<SortKey, string>` (a new `SortKey` without a label fails to compile); FilterBar's menu and ShowsPage's saved-sort validation both read it. Types `Filters` / `SortKey` / `NumericSortKey` live in `src/types/filters.ts`, not in `FilterBar`
- `SECTION_GAP = 24` — standard section `marginBottom`
- `SPACING` — `{ xs: 4, sm: 8, md: 12, lg: 16, xl: 24 }`

## localStorage

All persistence goes through `src/utils/settings.ts` (`getSettings()` / `saveSetting(key, value)`). Both use the `tvdash-settings` key. `getSettings()` always returns a plain object (non-object JSON → `{}`) and `saveSetting()` swallows storage errors — callers must still type-check each field they read (see `loadFilters`, `loadThemeName`). Never read/write localStorage directly elsewhere.

Exception: sidebar collapsed state uses a separate `tvdash-sidebar` key directly in `AppLayout` (intentional isolation).

## Key Conventions

- **Spacing:** use `SECTION_GAP` (24px) for top-level section `marginBottom`. Inner card gutters use `[10, 10]`.
- **Row gutters:** standard outer gutter is `[16, 16]`.
- **Chart axis ticks:** `fontSize: 11` everywhere.
- **Recharts charts:** all derive calls in `ChartsSection` are `useMemo`-ized. No `Collapse` wrapper — but as of v0.4.0 the 14 charts are grouped into 4 antd `Tabs` (Overview / Watch Time / Ratings / People & Networks), each tab rendering one `<Row>` of chart `Card`s. Only the active tab's charts are mounted, not all 14 simultaneously (`destroyOnHidden`). Because panes remount, any per-chart animation state must live in a child component, not in `ChartsSection` — see `AnimatedPie` (pie legend fades in on `onAnimationEnd`; a flag in the parent stayed `true` and showed the legend during the replay).
- **React.memo:** applied to `ShowCard`, `ShowGrid`, `StatsBar`, `ChartsSection`.
- **ShowGrid columns:** uses `Grid.useBreakpoint()` (viewport breakpoints) — not ResizeObserver. Avoids layout-shift race conditions.
- **Loading/error/empty state:** use `<LoadingState />` and `<ErrorState />` shared components — never inline Spin/Alert patterns. `Spin` requires nested content when using the `tip` prop (antd v5) — never render a bare `<Spin tip={...} />`. For "no data" / "not found" cases (empty CSV on Dashboard, invalid show ID on Show Detail) use antd `Empty` directly with a contextual message + action button — there's no shared `<EmptyState />` component, each page builds its own `Empty` block inline, matching the existing pattern rather than introducing a new one.
- **Poster fallback:** every spot that shows a poster (`ShowCard`, `ShowDetailPage`, all poster thumbnails in `DashboardPage`) uses `<VideoCameraOutlined style={{ opacity: 0.4 }} />` on `theme.posterFallbackBg`, not an emoji. `ShowDetailPage`'s hero poster and Dashboard's `PosterThumb` (covers every Dashboard thumbnail) also have an `onError` handler on the `<img>` so a broken/404 URL falls back to the same placeholder, not just an empty `posterUrl` string. `ShowCard` also renders `PosterThumb`, so it covers broken/404 URLs the same way.
- **Routing / errors:** unknown URLs hit the catch-all `*` route → `NotFoundPage`. `Suspense` + `RouteErrorBoundary` live in `AppLayout` around `<Outlet />` (not in `App`), so the shell stays mounted while a chunk loads or a page crashes. The boundary resets on pathname change via `componentDidUpdate` — deliberately **not** `key={pathname}`, which would remount `ShowDetailPage` on `/shows/1` → `/shows/2`. The reset only fires if an error was already showing before the update (`prevState.error`) — otherwise an error thrown on the navigating render is cleared in the same commit. Show-detail detection (header title, nav highlight) uses `useMatch('/shows/:id')`, not `startsWith`; other nav/title lookups use the pathname with trailing slashes stripped (`normalizedPath`).
- **Dates:** CSV dates are `YYYY-MM-DD`, which `new Date()` parses as UTC midnight — always format with `timeZone: 'UTC'` or they render a day early west of UTC (see `ShowDetailPage`'s `formatDate`).
- **Clickable non-button elements:** `role="button"` + `tabIndex={0}` + Enter/Space `onKeyDown` (`activateOnKey` in `src/utils/a11y.ts`). Applies to every clickable card/row (Dashboard, `ShowCard`) — import the helper, don't re-inline the key check. Dashboard's clickable cards (Highlights, Continue Watching, Recently Watched) all go through its local `ShowRowCard` (optional `thumb`/`header`/`ariaLabel`/`style`/`padding`).
- **Debounced saves:** `ShowsPage` debounces filter persistence 300ms and flushes the pending save on unmount (latest value in a ref) — don't just `clearTimeout` in cleanup, that drops the last change.
- **CSV-derived text is untrusted-ish:** render it only as React text / `<img src>` — never `dangerouslySetInnerHTML`, and never build an `href` from a CSV field (a `javascript:` URL would run). The 0.4.7 security review relied on both holding.
- **Form fields:** every `Input`/`Select` needs an `id` (and `name` where applicable) — a11y/DevTools requirement, see `FilterBar.tsx`.
- **Sidebar / mobile nav:** desktop (viewport ≥ `lg`) keeps the icon-rail-collapsible `Sider`, but the collapse trigger lives at the **bottom of the `Sider` itself** (not the Header — the Header carries no menu-toggle button on desktop). Below `lg`, the `Sider` is fully hidden (`collapsedWidth={0}`, tracked via the separate `broken` boolean — don't conflate it with the desktop `collapsed` boolean) and replaced by a **fixed bottom nav bar** (`AppLayout`'s own `<nav>`, not a `Sider` drawer) with one button per `NAV_ITEMS` entry. The bottom nav auto-hides on scroll-down and reappears on scroll-up or near the top (`Content`'s scroll listener, `translateY` + CSS transition) — it does **not** stay pinned visible the whole time. `Content` gets extra `paddingBottom` on mobile (`BOTTOM_NAV_HEIGHT + 12`) so the last element is never covered even while the bar is shown. `Content` is capped at `maxWidth: 1600` + centered so desktop collapse only shifts margin above that width. `Content` (not window) is the scroll container, so the pathname effect resets its `scrollTop` to 0 on every navigation. Entering mobile (`broken` → true) re-shows the nav and ignores scroll events for 800ms if already scrolled — browser scroll anchoring during the reflow fires large positive deltas that would otherwise re-hide it. `Content` padding uses longhands only (`paddingTop`/`paddingInline`/`paddingBottom`) — mixing `padding` + `paddingBottom` triggers a React rerender warning.
- **Recharts `ResponsiveContainer`:** always set `debounce={200}` — without it, every container re-measures/re-renders on every animation frame during the Sider collapse transition (14 charts × continuous resize events was the concrete perf problem this fixed).
- **`react-hooks/set-state-in-effect`:** this project runs `<React.StrictMode>` (`src/main.tsx`). React's own documented workaround for this lint rule — "adjust state during render" (compare a prop/derived value against a `last*` state value, call `setState` in the render body when it differs, skip the `useEffect`) — genuinely misbehaves here: confirmed via a debug trace (`AppLayout`'s nav-visibility reset, `ShowDetailPage`'s `overviewExpanded` reset; its poster error is URL-keyed like `PosterThumb`, so it needs no reset) that it oscillates across StrictMode's double-render and settles on the wrong value. Both spots (and the `[broken]` nav re-show in `AppLayout`) use a plain `useEffect` with `// eslint-disable-next-line react-hooks/set-state-in-effect` + a comment. If you hit this rule elsewhere, don't reach for the render-time-adjustment pattern by reflex — verify it against a real navigation/prop-change in the browser before trusting it, or just suppress the rule.

## CSV Row Order

Last rows in the CSV = most recently watched. No timestamp field exists. "Recently Watched" section uses `.reverse().slice(0, 3)`. Shows page default sort is `recentFirst` which reverses the data array — same principle.

## derive.ts Functions Added in v0.2

- `languageDistribution(data, n)` — count shows by `language`, maps ISO codes to display names via `LANGUAGE_NAMES` constant
- `ageRatingDistribution(data)` — count shows by `ageRating`, skips `N/A`
- `seasonsWatchedDepth(data)` — fixed-order buckets: 1/2/3/4+ seasons watched; uses array literal to guarantee axis order

## CSV Generator (series-search.py)

Standalone Tkinter script, outside the React app, used to build/maintain `public/tv_series.csv` via the TMDB API. It writes `CSV_PATH` = `<script dir>/public/tv_series.csv` (not the working directory). `FIELDNAMES` is the column contract with `parseSeriesCsv.ts`; appends follow the existing file's header (warning about missing columns). Unknown values are written as `''`, not `'N/A'` (older rows may still hold `'N/A'` — the app handles both). Tk rules: dialogs only on the main thread (worker fetches pass `quiet=True`, failures reported once via `root.after`); a `loading` flag blocks overlapping searches — search/prev/next handlers check it **before** touching `current_page` (else the counter desyncs from the table). `fetch_season_details` returns `None` on failure (not `[]`): a failed season is skipped and reported, never saved as 0 episodes. Reads `TMDB_API_KEY` from the environment (`os.environ.get`) — never hardcode the key, it must not land in git history.

## Tests

`src/hooks/useTvData.test.ts` — fetch lifecycle (success, HTTP error, refetch, data cleared on failed refetch, superseded slow response ignored, refetch after unmount is a no-op, real timeout via fake timers)  
`src/utils/parseSeriesCsv.test.ts` — row mapping, missing columns, malformed-row / invalid-ID skipping, broken quote is fatal, numeric fallbacks, season-count / runtime normalization (fixtures in `parseSeriesCsv.fixture.ts`: `VALID_ROW`, `VALID_CSV`, `csv(...rows)`, `withId(id, row?)` — use these instead of hand-editing CSV strings)  
`src/utils/derive.test.ts` — all aggregation functions  
`src/constants/ui.test.ts` — tier colors, status/genre lookups (incl. inherited keys), status ordering (77 tests total)

Run with `npm test`. Config in `vitest.config.ts`. No e2e suite in the repo — browser checks (Playwright) have been run ad hoc from outside the project; `.gitignore` already covers Playwright output dirs if one is added.

Vitest's default environment is **node** (`vitest.config.ts`, which merges `vite.config.ts`). A test that needs the DOM (`renderHook`, `render`) must start with `// @vitest-environment jsdom` — see `useTvData.test.ts` — or it fails with `document is not defined`.

Use `npm run build` (plain `tsc`, `noEmit`) for type checks. `tsc -b` also builds `tsconfig.node.json`, whose output goes to `node_modules/.tmp` (`outDir`) — `noEmit` isn't allowed on a referenced project (TS6310). If an old root `vite.config.js` / `vite.config.d.ts` is lying around, delete it: Vite and the vitest config import resolve `.js` before `.ts`.

## Lock File

If `package.json`'s `version` (or any dependency) is bumped by hand, run `npm install` immediately after so `package-lock.json` resyncs — a stale lock passes `npm install` silently but fails `npm ci` in CI. This bit us once: `vitest`'s nested `vite@8` needs a separate `esbuild ^0.27||^0.28` tree from the top-level `vite@5`'s `esbuild ~0.21`, and a stale lock had them wrongly deduped.

## Commands

```bash
npm run dev        # dev server
npm run build      # tsc + vite build (use this to catch type errors)
npm run test       # vitest run
npm run lint       # eslint src
npm run format     # prettier --write src
```
