## Context

`ShowsPage.tsx` holds `loadFilters()` (type-checks saved `filters`), three per-data memos (`genreSet`, `statusSet`, `searchText` — a `Map<TvSeries, string>` of `'\n'`-joined lowercase fields), `validFilters` (drops genres / status absent from the data, keeps object identity when nothing changes) and `filtered` (search → AND genres → status → sort). Sorting: `recentFirst(result)`, `name` via `localeCompare`, numeric keys via `compareDescNullsLast`.

## Goals / Non-Goals

**Goals:** pure functions with no React / storage imports; identical output; `ShowsPage` memos call them with the same dependency granularity (a keystroke never rebuilds the index).

**Non-Goals:** new filters, URL params, UI changes — later changes.

## Decisions

- **`buildSearchIndex(data): Map<TvSeries, string>`** — same `'\n'` join (a query can't match across fields). Kept keyed by row object, not `tvId`, so `filterAndSortShows` needs no lookup map.
- **`sanitizeFilters(filters, { genres: Set, statuses: Set })`** returns the **same object** when nothing is dropped, so `useDeferredValue` / memos don't churn; with empty data it returns `filters` unchanged (today's `!data.length` guard — saved values must survive the loading phase).
- **`filterAndSortShows(data, filters, index)`** — never mutates `data` (copy before sort); `recentFirst` reuses `derive.ts`.
- **`parseFilters(raw: unknown): Filters`** + `DEFAULT_FILTERS` live in the module; `ShowsPage` calls `parseFilters(getSettings().filters)`. Field-by-field fallback unchanged. This is the shared validator the URL-state change will feed query params into.
- **File in `utils/`**, not `derive.ts`: `derive.ts` is aggregation for charts; this is Shows-list logic with its own `Filters` type.

## Risks / Trade-offs

- [Accidental behavior drift] → tests written against today's behavior first (run them against an inline copy before moving), plus the existing `shows` e2e.
- [Memo granularity lost] → `ShowsPage` keeps three memos (index per `data`, sanitized per `filters`/sets, result per deferred filters) — no single mega-memo.
