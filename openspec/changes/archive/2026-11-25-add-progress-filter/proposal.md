## Why

Watch progress is the most useful way to slice a personal library ("what am I in the middle of?"), yet Shows can't filter by it: Dashboard's "Not Started → View all" opens the whole unfiltered catalogue, and Continue Watching has no "View all" at all (only its top 6 are reachable). Separately, a filter combination with no results shows "No shows match your filters" with no way out except finding the Reset link in the filter card. `IDEAS.md` → Pages P1 ("Progress filter", "Empty Shows result with a way out").

## What Changes

- New Shows filter **Progress**: All / Not started / In progress / Completed, from `episodesWatched` vs `totalEpisodes` (same rules Dashboard's Continue Watching / Not Started use). Shown in `FilterBar`, as an active-filter chip, in the URL (`progress=`), saved with the other filters, cleared by Reset.
- Dashboard: "Not Started → View all" opens Shows filtered to Not started; Continue Watching gets a "View all" that opens Shows filtered to In progress.
- Empty Shows result shows a "Clear filters" action (keeps the sort), next to the existing message.

## Capabilities

### New Capabilities
- `shows-filters`: Shows filter set behavior — progress filter definitions, empty result recovery, Dashboard "View all" targets.

### Modified Capabilities
- `shows-url-state`: the URL also carries the progress filter (added via the same requirement — delta adds a requirement, not a rewrite).

## Impact

- `src/types/filters.ts` (`Progress` type, `Filters.progress`), `src/utils/showFilters.ts` (`progressOf(series)`, filter step, param codec, `parseFilters` default `all` — old saved filters without the field still load), `src/components/FilterBar.tsx` (select `id="shows-progress-filter"`, chip, `hasActiveFilters`), `src/components/ShowGrid.tsx` (optional empty-state action prop), `src/pages/ShowsPage.tsx`, `src/pages/DashboardPage.tsx`.
- Depends on `shows-url-state` (the "View all" links are URLs). No new dependencies.
- Docs: `CLAUDE.md`, `IDEAS.md`, `CHANGELOG.md`, `features.txt`.
