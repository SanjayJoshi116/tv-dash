## 1. Baseline

- [x] 1.1 Run `npm test` and `npm run e2e`; note counts

## 2. DataGate

- [x] 2.1 New `src/components/DataGate.tsx` (`state: { data, loading, error, refetch }`, `tip?`, render-prop children) + `DataGate.test.tsx` (jsdom: loading, error + Retry, data, loading-over-error)
- [x] 2.2 Use it in `StatisticsPage`, `ShowDetailPage`, `ShowsPage` (memos into an inner content component), `DashboardPage`

## 3. Dashboard split

- [x] 3.1 `src/pages/dashboard/ShowRowCard.tsx` (moved verbatim)
- [x] 3.2 Sections: `Highlights`, `ContinueWatching` (incl. order toggle from `add-time-left`), `RecentlyWatched`, `SidebarTabs`, `NotStartedList`, `ExploreCards` — props only; reduced-motion read where Recharts renders
- [x] 3.3 `DashboardPage.tsx`: gate + memos + layout only

## 4. Verify & docs

- [x] 4.1 `npm run lint`, `npm test`, `npm run build`, `npm run e2e` — same as 1.1 plus new tests
- [x] 4.2 `CLAUDE.md` (Loading/error/empty → `DataGate`; `ShowRowCard` path; Tests), `IDEAS.md` (both P2 ideas → Completed; P3 Customizable Dashboard now unblocked), `CHANGELOG.md`, `features.txt` header, version bump
