## Why

Shows filters and the current page live only in component state + localStorage, and `AppLayout` scrolls `Content` to the top on every navigation. So Shows → Show Detail → Back lands on page 1 at the top, a filtered view can't be shared or bookmarked, and browser Back can't undo a filter. Every later Pages idea that opens a filtered list (progress "View all", tag links, chart drill-down) needs filters addressable by URL. `IDEAS.md` → Pages P1 ("Shows state in the URL").

## What Changes

- Shows filters (`q`, repeated `genre`, `status`, `sort`) and pagination (`page`, `size`) are mirrored into the query string. Default values are omitted, so plain `/shows` stays clean.
- A URL with any filter param wins over saved filters; a URL with none is seeded from saved filters (written back with `replace`, no extra history entry).
- Discrete changes (genre, status, sort, page, page size, clearing) push a history entry — Back undoes them; typing in search replaces the current entry (no entry per keystroke).
- Invalid / stale params are corrected the same way saved filters are (unknown sort → default, unknown genre / status dropped once data loads, bad `page` / `size` → defaults) and the URL is rewritten with `replace`.
- Back / Forward restores the `Content` scroll position of that history entry on every page; other navigations still scroll to the top.
- Filters are still saved (debounced) as today; `page` / `size` are URL-only.

## Capabilities

### New Capabilities
- `shows-url-state`: Shows filters / pagination in the URL, precedence over saved filters, history behavior, and scroll restoration on Back / Forward.

### Modified Capabilities
- `settings-sync`: "Shows filters are not overwritten live" — the saved filters apply on the next visit **without filter parameters**; a URL with filters shows those instead.

## Impact

- `src/pages/ShowsPage.tsx` (state ← `useSearchParams`), `src/utils/showFilters.ts` (from `extract-show-filtering`: `filtersFromParams` / `filtersToParams`, reusing `parseFilters`' validation), `src/components/AppLayout.tsx` (scroll reset → save / restore by history entry key on POP).
- No new dependencies. Security: param values only reach React state / text, never an `href` (CLAUDE.md CSV rule).
- Depends on `extract-show-filtering`. Enables `add-progress-filter` and `add-cross-navigation-links`.
- Docs: `CLAUDE.md` (Debounced saves, Sidebar / mobile nav scroll-reset note, localStorage → Cross-tab sync note on filters, Tests), `IDEAS.md`, `CHANGELOG.md`, `features.txt`.
