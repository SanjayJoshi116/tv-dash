# Bug Backlog

## Open

_None._

## Fixed in 0.4.13 (2026-11-24)

- [x] `series-search.py` — `CsvStore.update` could truncate the CSV (open "w", then a bad extra-field row raised mid-write)
- [x] `series-search.py` — Excel UTF-8 BOM hid existing rows → duplicate TV IDs appended
- [x] `series-search.py` — same season counted twice (two panels / file changed while fetching)
- [x] `series-search.py` — save errors only printed to the console (no dialog)
- [x] `ShowDetailPage` — stat tile values clipped / overflowing at 600–1250px (regression within 0.4.13)
- [x] `package.json` — `test:gen` assumed a `python` command
- [x] `series-search.py` — network calls blocked the Tk main thread (window froze during search / save / season fetches)
- [x] `series-search.py` — API key could appear in an error dialog (request URL in the error text)
- [x] `series-search.py` — a failed Next / Prev left the page counter on the new page while the table showed the old one
- [x] `series-search.py` — Next / Prev paged whatever was typed in the entry, not the search on screen

## Fixed in 0.4.11 (2026-11-24)

- [x] `ThemeToggle.tsx` — `Select` had no `id` / accessible label (form-field convention)
- [x] `series-search.py` — Enter / Next / Prev mid-load desynced the page counter from the table (regression from 0.4.10)
- [x] `series-search.py` — failed season fetch saved the season with 0 episodes, blocking re-add
- [x] `derive.ts` `completionByGenre` — plain-object map indexed by CSV genres (`__proto__` / `constructor`)
- [x] `parseSeriesCsv` — fractional / huge `Seasons` (freeze or "2 / 2.5" on Show Detail)
- [x] `parseSeriesCsv` — zero / negative `Episode Runtime` shown as "-5 min"
- [x] `package.json` — `antd ^5.17.0` allowed versions without `Tabs` `destroyOnHidden`

## Fixed in 0.4.10 (2026-11-24)

- [x] `series-search.py` — saved seasons unchecked in the season picker (regression within this pass)
- [x] `series-search.py` — appends ignored the existing header (values under wrong columns)
- [x] `series-search.py` — Tk dialogs opened from worker threads
- [x] `series-search.py` — overlapping searches via Enter during a load
- [x] `series-search.py` — `—` saved as Seasons / Episode Runtime
- [x] `series-search.py` — buttons stuck disabled after a thread error
- [x] `series-search.py` — failed fetch reported as "All seasons already saved"
- [x] `series-search.py` — search terms not URL-encoded
- [x] `eslint.config.js` — `dist/` linted by `eslint .` / editors (regression within this pass)

## Fixed in 0.4.9 (2026-11-24)

- [x] Year "0" shown for a missing first-air year (ShowCard, Dashboard, Show Detail); Year ↓ sort treated 0 as a real year
- [x] Dashboard Not Started list showed "★ 0.0" for unrated shows
- [x] Show Detail "Seasons Watched N / 0" for a missing season count
- [x] Show Detail showed an "N/A" age-rating / language tag
- [x] `parseSeriesCsv` — duplicate / invalid Seasons Watched entries inflated the count ("1,1,2" → 3)
- [x] `SortKey` without a `SORT_OPTIONS` entry compiled but silently vanished (and reset saved sort)

## Fixed in 0.4.8 (2026-11-24)

- [x] `FilterBar` — status filter offered statuses absent from the data (always 0 results); unknown statuses not selectable
- [x] `ui.ts` — status/genre lookups returned inherited `Object.prototype` members for keys like `constructor`, skipping fallbacks (also in `derive.ts` count maps)
- [x] `ui.ts` — Canceled drawn in two different reds (bar vs Tag)
- [x] `DashboardPage` — unknown statuses drawn in Ended grey (Statistics used a theme color)
- [x] `ui.ts` — literal status keys not type-checked (typo → `undefined` color)

## Fixed in 0.4.6 (2026-11-24)

- [x] `parseSeriesCsv` — skipped rows were console-only; shows could silently vanish (now a warning banner; all rows skipped is fatal)
- [x] `parseSeriesCsv` — empty CSV showed "Unable to auto-detect delimiting character" instead of the empty state
- [x] `parseSeriesCsv` — duplicate TV IDs accepted (duplicate keys, unreachable `/shows/:id`, double-counted stats)
- [x] `parseSeriesCsv` — skip warnings named the wrong line after a multi-line Overview
- [x] `derive.ts` `truncate` — split emoji surrogate pairs; `max < 2` returned a longer string

## Fixed in 0.4.4 (2026-11-24)

- [x] `parseSeriesCsv` — broken quote silently dropped every later row (regression from 0.4.3's row-skipping)
- [x] `useTvData` — retained `refetch` called after unmount started a fetch and set state
- [x] `useTvData.test.ts` — no coverage for stale-response handling; calls outside `act()`; stubbed `fetch` never removed

## Fixed in 0.4.3 (2026-11-24)

- [x] `TvDataContext` — editing the provider file in dev could crash an open page (Fast Refresh recreated the context)
- [x] `TvDataContext` — consumer outside the provider got a fake endless loading state
- [x] `useTvData` — one malformed CSV row failed the whole load for every page
- [x] `useTvData` — blank/invalid `TV ID` → duplicate keys, `/shows/0` or `/shows/NaN`
- [x] `useTvData` — failed refetch left stale data next to the error

## Fixed in 0.4.2 (2026-11-24)

- [x] `ShowCard` — no 404 poster fallback (now renders `PosterThumb`)
- [x] `ChartsSection` — pie legends visible while pies replay after tab revisit
- [x] `ChartsSection` — Status donut fallback colors could match Returning Series / Canceled
- [x] `ChartsSection` / `derive.ts` — watch-time tooltip showed fractional minutes ("2h 5.5m")
- [x] `AppLayout` — new page opened at previous scroll offset
- [x] `AppLayout` — mobile bottom nav stuck hidden after desktop round-trip (incl. scroll-anchoring re-hide)
- [x] `AppLayout` — trailing-slash URLs: no nav highlight, generic title
- [x] `AppLayout` — React padding shorthand/longhand rerender warning
- [x] `RouteErrorBoundary` — error cleared in the same commit as a navigation crash
- [x] `StatsBar` — Hours Watched could differ by 1h from Dashboard
- [x] `StatsBar` — hover text showed unrounded value

## Fixed in 0.4.1 (2026-11-23)

- [x] `DashboardPage` `PosterThumb` — no 404 fallback
- [x] `DashboardPage` — Avg Rating card red when no ratings
- [x] `DashboardPage` — Highlights / Continue Watching / Recently Watched cards not keyboard accessible
- [x] `ShowsPage` — pagination bar (and size picker) vanishes when page size > result count
- [x] `ShowsPage` — last filter change lost on navigate (debounced save cancelled on unmount)
- [x] `ShowsPage` — saved genre/status absent from data filters to 0 results
- [x] `ShowDetailPage` — air dates one day early west of UTC; "Invalid Date" on bad input
- [x] `ShowDetailPage` — overview stays expanded across shows
- [x] `ShowDetailPage` — no "Show more" on narrow screens (length-based check)
- [x] `AppLayout` / `NotFoundPage` — `/shows/12/extra` showed "Show Detail" header + Shows nav highlighted
- [x] Unknown routes rendered blank (no 404 route)
- [x] Page crash / failed lazy chunk white-screened the app (no error boundary)
- [x] `settings.ts` threw on blocked/full storage; non-object JSON passed through
