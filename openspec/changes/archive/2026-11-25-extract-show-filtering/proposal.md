## Why

The Shows filter / sort / search logic (~40 lines across `ShowsPage`'s `useMemo`s: search index, stale genre/status cleanup, AND-genre match, status match, `recentFirst` / name / nulls-last sorts) has zero unit coverage — only one e2e search test. The next Pages changes (URL state, progress filter, cross-navigation links, scoped stats) all extend this logic, so it needs to be a pure, tested module first. `IDEAS.md` → Pages P1 ("Pure `filterAndSortShows()` + tests").

## What Changes

- New pure module `src/utils/showFilters.ts`: `buildSearchIndex(data)`, `sanitizeFilters(filters, data-derived sets)` (drop genres / status no longer in the data), `filterAndSortShows(data, filters, index)`.
- `DEFAULT_FILTERS` and `parseFilters(raw)` (today's `loadFilters` type-checking, minus the `getSettings()` read) move there too, so the URL-state change can reuse the same validation for query params.
- `ShowsPage` keeps only state, debounced save, memo wiring and rendering.
- Unit tests for every branch (see design).
- **No behavior change**: same results, order, saved-filter handling and debounce.

## Capabilities

### New Capabilities
<!-- none: pure refactor (skip_specs: true) -->

### Modified Capabilities
<!-- none -->

## Impact

- New `src/utils/showFilters.ts` + `src/utils/showFilters.test.ts`; `src/pages/ShowsPage.tsx` slimmed.
- No new dependencies, no storage / URL / UI change.
- Docs: `CLAUDE.md` (Tests list; Debounced saves note points at `ShowsPage` still), `IDEAS.md` (idea → Completed), `CHANGELOG.md`.
- First of five sequential Pages changes: `extract-show-filtering` → `shows-url-state` → `add-progress-filter` → `add-cross-navigation-links` → `add-time-left`.
