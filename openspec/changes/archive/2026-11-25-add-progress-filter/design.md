## Context

After `shows-url-state`, Shows filter state is derived from the URL via `showFilters.ts` (`parseFilters`, `filtersFromParams` / `filtersToParams`, `filterAndSortShows`). Dashboard computes `inProgress` (`0 < watched < total`, top 6 by %) and `notStarted` (`watched === 0`, top 8 by rating) inline. `ShowGrid` renders a bare `Empty`.

## Goals / Non-Goals

**Goals:** one definition of progress shared by the filter and Dashboard; `progress` flows through the existing codec and saved-filter validation.

**Non-Goals:** sorting by progress / time left (`add-time-left`); a progress column or bar on cards.

## Decisions

- **`type Progress = 'all' | 'notStarted' | 'inProgress' | 'completed'`** in `types/filters.ts`; `PROGRESS_LABELS: Record<Exclude<Progress,'all'>, string>` in `constants/ui.ts` (like `SORT_LABELS` — a new value without a label fails to compile).
- **`progressOf(s)`** (pure, `showFilters.ts`): `watched === 0` → notStarted; `watched >= total && watched > 0` → completed; else inProgress. A row with `totalEpisodes` 0 and some watched counts as completed (matches Dashboard, which never lists it as in progress). Dashboard's two memos switch to `progressOf(s) === …` so the definitions can't drift.
- **URL param `progress`** (camelCase values, as stored); unknown → `all` via `parseFilters`' per-field fallback, then the existing replace-correction.
- **FilterBar control:** antd `Select` `id="shows-progress-filter"`, `aria-label="Filter by progress"`, placeholder "Progress", `allowClear` (clear = all) — matches the status select instead of a `Segmented` that wouldn't fit the `sm` column. Column spans rebalanced (search 6 / genre 6 / status 4 / progress 4 / sort 4 at `xl`; 12 / 12 + 8 / 8 / 8 from `sm` to `lg` — one row at `md` / `lg` truncated every label, found in the 768px check; full width `xs`). Chip label from `PROGRESS_LABELS`.
- **Empty action:** `ShowGrid` gets `emptyAction?: ReactNode` (memo-safe: `ShowsPage` memoizes the button). `ShowsPage` passes "Clear filters" → `onFiltersChange({ ...DEFAULT_FILTERS, sortBy })` (push). Not rendered when the catalogue itself is empty (no filters active) — that case keeps the plain message.
- **Dashboard links:** `navigate('/shows?progress=notStarted')` / `?progress=inProgress` — fixed strings, router-relative (basename-safe). Continue Watching title row gets `extra`-style "View all" `Button type="link"` like Not Started.

## Risks / Trade-offs

- [FilterBar crowding on `sm`] → e2e form-field-ids test + a visual check at 600 / 768 / 1250px.
- [Saved filters written by this version read by an older tab] → older `loadFilters` ignores unknown fields; harmless.
