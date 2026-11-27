## 1. Codec

- [x] 1.1 `src/utils/showFilters.ts`: `filtersFromParams(params)` (`null` when no filter param), `filtersToParams(filters, page, size)` (defaults omitted, repeated `genre`), `parsePage` / `parsePageSize` (positive integers; size ∈ `PAGE_SIZE_OPTIONS`, moved here from `ShowsPage`)
- [x] 1.2 Tests: round trip, defaults omitted, repeated / encoded genres (`Sci-Fi & Fantasy`), unknown `sort`, `page=0` / `-1` / `1.5` / `abc`, unsupported `size`, inherited-key strings (`constructor`), no-param → `null`

## 2. Shows page

- [x] 2.1 `ShowsPage.tsx`: derive filters / page / size from `useSearchParams` (memo on the param string); remove the `useState`s
- [x] 2.2 Seed from saved filters with `replace` when the URL has no filter param; render uses the saved filters until then
- [x] 2.3 `onFiltersChange(next, { replace })`: search typing replaces, all other changes push; page → 1; debounced filter save + unmount flush kept
- [x] 2.4 Correct stale genre / status and out-of-range page in the URL with `replace` once data has loaded (string compare, settles in one pass)
- [x] 2.5 `FilterBar`: pass `replace: true` from the search `onChange` only (prop signature change)

## 3. Scroll restoration

- [x] 3.1 `AppLayout.tsx`: record `Content.scrollTop` per `location.key` (rAF-throttled scroll listener, cap 50 entries); on location change restore on `POP` when known (rAF), skip on `REPLACE` that only changed the search, else scroll to top

## 4. Tests

- [x] 4.1 e2e `shows-url.spec.ts`: filter → URL params; open a filtered URL in a fresh page; URL beats seeded storage (`seedSettings`); empty URL seeded + Back leaves `/shows`; Back undoes a genre; typing then Back = one step; stale genre dropped from URL; page 999 → last page; page 3 → show → Back = page 3 + same scroll; Shows scrolled → Statistics via nav = top
- [x] 4.2 Update `settings-sync` e2e for the new scenario (tab B opens a Crime URL); keep the existing ones green; `App.test.tsx` `/shows?genre=…` route mounts

## 5. Verify & docs

- [x] 5.1 `npm run lint`, `npm test`, `npm run build`, `npm run e2e`, `npm run e2e:subpath` (basename + query params)
- [x] 5.2 `CLAUDE.md` (Debounced saves, scroll reset → per-entry restore, Cross-tab sync filters note, Tests), `IDEAS.md` (Pages P1 "Shows state in the URL" → Completed; Statistics-tab-in-URL P2 can reuse the pattern), `CHANGELOG.md`, `features.txt`, README if user-facing, version bump
