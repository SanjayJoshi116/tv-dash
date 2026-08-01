# Changelog

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
