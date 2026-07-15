# Changelog

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
