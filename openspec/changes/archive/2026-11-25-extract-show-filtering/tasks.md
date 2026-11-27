## 1. Baseline

- [x] 1.1 Run `npm test` and `npm run e2e -- e2e/shows.spec.ts`; note counts

## 2. Module + tests

- [x] 2.1 New `src/utils/showFilters.ts`: `DEFAULT_FILTERS`, `parseFilters(raw)`, `buildSearchIndex(data)`, `sanitizeFilters(filters, sets)`, `filterAndSortShows(data, filters, index)` — logic moved verbatim from `ShowsPage`
- [x] 2.2 New `src/utils/showFilters.test.ts` (fixtures via `parseSeriesCsv.fixture.ts` / plain `TvSeries` builders): `parseFilters` (non-object, corrupt fields one by one, unknown `sortBy`, non-string genre); search across name / actor / keyword / genre / creator / network, case-insensitive, no cross-field match; genres AND; status; unknown saved genre / status dropped, same object when nothing dropped, untouched with empty data; `recentFirst` = reversed order; `name`; each numeric key nulls last; input array not mutated

## 3. Page

- [x] 3.1 `ShowsPage.tsx`: use the module (memos: index per `data`, sets per `data`, sanitized per `filters`, result per deferred filters); remove the moved code

## 4. Verify & docs

- [x] 4.1 `npm run lint`, `npm test`, `npm run build`, `npm run e2e` — same as 1.1 plus new tests
- [x] 4.2 `CLAUDE.md` Tests list (+ `showFilters.test.ts`, new total), `IDEAS.md` (Pages P1 "Pure `filterAndSortShows()`" → Completed), `CHANGELOG.md`, `features.txt` header, version bump (one patch version)
