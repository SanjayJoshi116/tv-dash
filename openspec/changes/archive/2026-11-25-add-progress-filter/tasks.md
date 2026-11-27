## 1. Model

- [x] 1.1 `types/filters.ts`: `Progress`, `Filters.progress`; `constants/ui.ts`: `PROGRESS_LABELS` + `PROGRESS_OPTIONS`
- [x] 1.2 `showFilters.ts`: `progressOf`, `DEFAULT_FILTERS.progress = 'all'`, `parseFilters` field, filter step in `filterAndSortShows`, `progress` param in the codec
- [x] 1.3 Tests: `progressOf` (0 watched, partial, full, total 0, over-watched), filter combined with genre, `parseFilters` without the field → `all`, unknown value → `all`, codec round trip / default omitted

## 2. UI

- [x] 2.1 `FilterBar.tsx`: progress `Select` (`id="shows-progress-filter"`, `aria-label`), chip, `hasActiveFilters`, Reset clears it; rebalance column spans
- [x] 2.2 `ShowGrid.tsx`: optional `emptyAction`; `ShowsPage.tsx`: memoized "Clear filters" button (keeps sort, pushes history), only when a filter is active
- [x] 2.3 `DashboardPage.tsx`: `inProgress` / `notStarted` memos use `progressOf`; Not Started "View all" → `/shows?progress=notStarted`; new Continue Watching "View all" → `/shows?progress=inProgress`

## 3. Tests

- [x] 3.1 e2e: progress select filters + chip + URL; Completed + genre; empty result → Clear filters keeps sort; Dashboard Not Started / Continue Watching View all land on the filtered list (count matches); form-field ids include `shows-progress-filter`; `TEST_CSV` has at least one show per progress state (add rows via `csv()` if not)

## 4. Verify & docs

- [x] 4.1 `npm run lint`, `npm test`, `npm run build`, `npm run e2e`; FilterBar checked at 600 / 768 / 1250px
- [x] 4.2 `CLAUDE.md` (`PROGRESS_LABELS` next to `SORT_OPTIONS`, Tests), `IDEAS.md` (both P1 ideas → Completed; P2 "Scoped statistics" can reuse `progress`), `CHANGELOG.md`, `features.txt`, README if user-facing, version bump
