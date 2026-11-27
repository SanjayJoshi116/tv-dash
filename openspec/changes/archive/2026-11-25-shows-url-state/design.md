## Context

After `extract-show-filtering`, `ShowsPage` holds `filters` (seeded by `parseFilters(getSettings().filters)`), `page`, `pageSize` in `useState`, saves filters debounced 300ms with flush on unmount, and calls pure `showFilters.ts` helpers. `AppLayout` runs `contentRef.current?.scrollTo(0, 0)` on every `location.pathname` change; `Content`, not window, scrolls, so React Router's `ScrollRestoration` doesn't apply. Data router (`createBrowserRouter`, basename-aware) — `useSearchParams` / `useNavigationType` are available.

## Goals / Non-Goals

**Goals:** URL is the single source of truth for Shows view state; saved filters only seed an empty URL; scroll restore on POP for every page.

**Non-Goals:** saving `page` / `size`; live cross-tab sync of filters (unchanged); restoring scroll across reloads; the progress filter (next change adds a `progress` param through the same codec).

## Decisions

- **Param names:** `q`, `genre` (repeated, one per genre — `?genre=Drama&genre=Crime`), `status`, `sort` (a `SortKey`), `page`, `size`. Short, readable, and the cross-navigation change can build `?genre=Drama` / `?q=<actor>` with `URLSearchParams`. Alternative: one JSON param — rejected, unreadable and hand-unfriendly.
- **Codec in `showFilters.ts`:** `filtersFromParams(params): Filters | null` (`null` = no filter param present → seed from storage) built on `parseFilters` (same per-field fallback); `filtersToParams(filters, page, size): URLSearchParams` omits defaults and writes genres in selection order. Unit-tested round trip.
- **State = URL:** `ShowsPage` derives `filters` / `page` / `size` from `useSearchParams()` each render (memoized on `searchParams.toString()` so the filters object is stable for memos / `useDeferredValue`). No mirrored `useState` → no sync effect, no StrictMode double-update risk.
- **Seeding:** on mount, if `filtersFromParams` is `null` and saved filters differ from defaults, `setSearchParams(toParams(saved), { replace: true })` in an effect (one-shot). Render before that effect uses the saved filters directly, so no flash of the unfiltered list.
- **History:** `onFiltersChange(next, { replace })` — FilterBar's search `onChange` passes `replace: true`; everything else (genre, status, sort, tag close, Reset, pagination) pushes. Each change resets page to 1 (omitted). Debounced save of filters unchanged (saves the latest filters, not page / size).
- **Correction:** sanitized filters (stale genre / status, after data load) and a clamped page are written back with `replace` in an effect when `toParams(sanitized)` differs from the current string — compare strings, so it settles in one pass and StrictMode's re-run is a no-op.
- **Scroll restore (AppLayout):** a `Map<location.key, number>` in a ref; record `Content.scrollTop` for the current key on scroll (rAF-throttled) — not on unmount, since the next page has already rendered by then. In the location effect: `useNavigationType() === 'POP'` and the map has `location.key` → `scrollTo(0, saved)` after paint (`requestAnimationFrame`, so the Shows grid has laid out); else `scrollTo(0, 0)`. Keyed by history entry, not pathname — the same `/shows` twice in history keeps two positions. Effect key changes from `pathname` to `location.key`; a search-only change (filter push) therefore also scrolls to top, which is right for a new filter but wrong for typing → skip the reset when only `search` changed with `replace` (navigation type `REPLACE`).
- **BottomNav** keeps its own pathname effect (re-show) — unchanged.

## Risks / Trade-offs

- [Restored position before images / grid layout settle] → restore in rAF after commit; the grid's height comes from CSS grid rows, not image load (posters have fixed aspect boxes), so one frame is enough. e2e asserts it.
- [`/` shortcut focus request + URL seeding effect ordering] → seeding uses `replace`, pathname stays `/shows`, so `GlobalShortcuts`' cancel-on-other-pathname logic is unaffected.
- [Map grows unbounded] → entries are numbers per history entry visited in this session; negligible. Cap at 50 (drop oldest) to be safe.
- [`page` param out of range before data loads] → clamp only after `loading` is false; while loading the page shows `LoadingState` anyway.
