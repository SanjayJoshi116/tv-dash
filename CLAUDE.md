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
- **Recharts charts:** all derive calls in `ChartsSection` are `useMemo`-ized. Charts are always visible (no Collapse wrapper).
- **React.memo:** applied to `ShowCard`, `ShowGrid`, `StatsBar`, `ChartsSection`.
- **ShowGrid columns:** uses `Grid.useBreakpoint()` (viewport breakpoints) — not ResizeObserver. Avoids layout-shift race conditions.
- **Loading/error state:** use `<LoadingState />` and `<ErrorState />` shared components — never inline Spin/Alert patterns. `Spin` requires nested content when using the `tip` prop (antd v5) — never render a bare `<Spin tip={...} />`.
- **Form fields:** every `Input`/`Select` needs an `id` (and `name` where applicable) — a11y/DevTools requirement, see `FilterBar.tsx`.
- **Sidebar collapse:** trigger lives in the Header (fold/unfold icon), not the default Ant Design `Sider` footer button (`Sider` uses `trigger={null}`). Manual collapse → icon-rail (`collapsedWidth={80}`), nav icons stay visible with hover tooltips (built-in antd `Menu`-in-`Sider` behavior, no custom tooltip code). Viewport-breakpoint collapse (mobile) is tracked separately (`broken` state) and always fully hides (`collapsedWidth={0}`) — don't conflate the two into one boolean. `Content` is capped at `maxWidth: 1600` + centered so collapse only shifts margin above that width, keeping the reflow feel consistent across pages.
- **Recharts `ResponsiveContainer`:** always set `debounce={200}` — without it, every container re-measures/re-renders on every animation frame during the Sider collapse transition (14 charts × continuous resize events was the concrete perf problem this fixed).

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

## Commands

```bash
npm run dev        # dev server
npm run build      # tsc + vite build (use this to catch type errors)
npm run test       # vitest run
npm run lint       # eslint src
npm run format     # prettier --write src
```
