# Changelog

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
