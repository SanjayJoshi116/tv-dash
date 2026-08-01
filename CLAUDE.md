# CLAUDE.md — TV Dashboard

## Architecture

Single-page React app. No backend. Data comes from one static CSV file (`public/tv_series.csv`) fetched at runtime.

**Provider stack (outer → inner):**
```
ThemeProvider → ConfigProvider (Ant Design) → TvDataProvider → BrowserRouter → Routes → AppLayout → Pages
```

**Data flow:** CSV → `useTvData` hook → `TvDataContext` → pages (via `useTvDataContext()`) → components (via props).

Pages always pull from context. Components always receive data as props — they do not call `useTvDataContext()` themselves. The exceptions (all intentional): `AppLayout` and `ChartsSection` call `useTheme()` directly since theme is a cross-cutting concern; `ShowCard` also calls it directly for its poster-fallback background, since prop-drilling a single color through `ShowGrid` isn't worth it.

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
- `GENRE_COLORS` — Ant Design tag color strings per genre
- `ratingColor(v)` — green/yellow/red based on 0–10 rating
- `completionColor(v)` — green/yellow/red based on 0–100 percentage
- `cardShadow(isDark)` — shared card shadow formula (dark vs light); use this instead of inlining the rgba values — it was duplicated across 5 files before being extracted
- `STATUS_COLORS` — hex values for Progress `strokeColor`
- `STATUS_TAG_COLORS` — Ant Design strings for Tag `color`
- `SECTION_GAP = 24` — standard section `marginBottom`
- `SPACING` — `{ xs: 4, sm: 8, md: 12, lg: 16, xl: 24 }`

## localStorage

All persistence goes through `src/utils/settings.ts` (`getSettings()` / `saveSetting(key, value)`). Both use the `tvdash-settings` key. Never read/write localStorage directly elsewhere.

Exception: sidebar collapsed state uses a separate `tvdash-sidebar` key directly in `AppLayout` (intentional isolation).

## Key Conventions

- **Spacing:** use `SECTION_GAP` (24px) for top-level section `marginBottom`. Inner card gutters use `[10, 10]`.
- **Row gutters:** standard outer gutter is `[16, 16]`.
- **Chart axis ticks:** `fontSize: 11` everywhere.
- **Recharts charts:** all derive calls in `ChartsSection` are `useMemo`-ized. No `Collapse` wrapper — but as of v0.4.0 the 14 charts are grouped into 4 antd `Tabs` (Overview / Watch Time / Ratings / People & Networks), each tab rendering one `<Row>` of chart `Card`s. Only the active tab's charts are mounted, not all 14 simultaneously.
- **React.memo:** applied to `ShowCard`, `ShowGrid`, `StatsBar`, `ChartsSection`.
- **ShowGrid columns:** uses `Grid.useBreakpoint()` (viewport breakpoints) — not ResizeObserver. Avoids layout-shift race conditions.
- **Loading/error/empty state:** use `<LoadingState />` and `<ErrorState />` shared components — never inline Spin/Alert patterns. `Spin` requires nested content when using the `tip` prop (antd v5) — never render a bare `<Spin tip={...} />`. For "no data" / "not found" cases (empty CSV on Dashboard, invalid show ID on Show Detail) use antd `Empty` directly with a contextual message + action button — there's no shared `<EmptyState />` component, each page builds its own `Empty` block inline, matching the existing pattern rather than introducing a new one.
- **Poster fallback:** every spot that shows a poster (`ShowCard`, `ShowDetailPage`, all poster thumbnails in `DashboardPage`) uses `<VideoCameraOutlined style={{ opacity: 0.4 }} />` on `theme.posterFallbackBg`, not an emoji. `ShowDetailPage`'s hero poster additionally has an `onError` handler on the `<img>` so a broken/404 URL falls back to the same placeholder, not just an empty `posterUrl` string. As of v0.4.0 this is the only poster `<img>` with that handler — `ShowCard` and Dashboard's thumbnails still only cover the empty-`posterUrl` case, not a 404 on a real URL. If that gap gets fixed, update this note.
- **Form fields:** every `Input`/`Select` needs an `id` (and `name` where applicable) — a11y/DevTools requirement, see `FilterBar.tsx`.
- **Sidebar / mobile nav:** desktop (viewport ≥ `lg`) keeps the icon-rail-collapsible `Sider`, but the collapse trigger lives at the **bottom of the `Sider` itself** (not the Header — the Header carries no menu-toggle button on desktop). Below `lg`, the `Sider` is fully hidden (`collapsedWidth={0}`, tracked via the separate `broken` boolean — don't conflate it with the desktop `collapsed` boolean) and replaced by a **fixed bottom nav bar** (`AppLayout`'s own `<nav>`, not a `Sider` drawer) with one button per `NAV_ITEMS` entry. The bottom nav auto-hides on scroll-down and reappears on scroll-up or near the top (`Content`'s scroll listener, `translateY` + CSS transition) — it does **not** stay pinned visible the whole time. `Content` gets extra `paddingBottom` on mobile (`BOTTOM_NAV_HEIGHT + 12`) so the last element is never covered even while the bar is shown. `Content` is capped at `maxWidth: 1600` + centered so desktop collapse only shifts margin above that width.
- **Recharts `ResponsiveContainer`:** always set `debounce={200}` — without it, every container re-measures/re-renders on every animation frame during the Sider collapse transition (14 charts × continuous resize events was the concrete perf problem this fixed).
- **`react-hooks/set-state-in-effect`:** this project runs `<React.StrictMode>` (`src/main.tsx`). React's own documented workaround for this lint rule — "adjust state during render" (compare a prop/derived value against a `last*` state value, call `setState` in the render body when it differs, skip the `useEffect`) — genuinely misbehaves here: confirmed via a debug trace (`AppLayout`'s nav-visibility reset, `ShowDetailPage`'s poster-error reset) that it oscillates across StrictMode's double-render and settles on the wrong value. Both spots were reverted to a plain `useEffect` with `// eslint-disable-next-line react-hooks/set-state-in-effect` + a comment. If you hit this rule elsewhere, don't reach for the render-time-adjustment pattern by reflex — verify it against a real navigation/prop-change in the browser before trusting it, or just suppress the rule.

## CSV Row Order

Last rows in the CSV = most recently watched. No timestamp field exists. "Recently Watched" section uses `.reverse().slice(0, 3)`. Shows page default sort is `recentFirst` which reverses the data array — same principle.

## derive.ts Functions Added in v0.2

- `languageDistribution(data, n)` — count shows by `language`, maps ISO codes to display names via `LANGUAGE_NAMES` constant
- `ageRatingDistribution(data)` — count shows by `ageRating`, skips `N/A`
- `seasonsWatchedDepth(data)` — fixed-order buckets: 1/2/3/4+ seasons watched; uses array literal to guarantee axis order

## CSV Generator (series-search.py)

Standalone Tkinter script, outside the React app, used to build/maintain `public/tv_series.csv` via the TMDB API. Reads `TMDB_API_KEY` from the environment (`os.environ.get`) — never hardcode the key, it must not land in git history.

## Tests

`src/hooks/useTvData.test.ts` — fetch lifecycle  
`src/utils/derive.test.ts` — all aggregation functions

Run with `npm test`. Config in `vitest.config.ts`.

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
