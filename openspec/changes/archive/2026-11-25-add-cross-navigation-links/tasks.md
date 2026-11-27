## 1. Helper + component

- [x] 1.1 `src/utils/showsLink.ts`: `showsLink({ genre?, status?, q? })` → `{ pathname: '/shows', search }` via `filtersToParams`; comment stating the safety argument
- [x] 1.2 `src/utils/showsLink.test.ts`: pathname always `/shows`; `&`, `#`, `?`, `/`, `%`, `javascript:alert(1)`, unicode round-trip through `filtersFromParams`; only the given field set
- [x] 1.3 `src/components/FilterLink.tsx`: `Link` + `aria-label` + hover underline state + `prefetchPage('shows')` on hover / focus; no focus-outline suppression

## 2. Pages

- [x] 2.1 `ShowDetailPage.tsx`: genre / status / network / actor / keyword tags wrapped in `FilterLink`; creators split into per-name links
- [x] 2.2 `DashboardPage.tsx`: `renderBar` optional `to`; Top Genres → genre, Watch Status → status

## 3. Tests

- [x] 3.1 e2e `cross-navigation.spec.ts`: genre tag → filtered list (only that genre chip); actor → search includes origin show; status; keyboard Tab + Enter on a keyword; Ctrl-click opens a new tab (`context.waitForEvent('page')`) and keeps the original; Dashboard Drama bar count = listed count; `Sci-Fi & Fantasy` exact; hostile `javascript:` keyword in `TEST_CSV` → search text, no dialog (`page.on('dialog')` fails the test), `href` starts with the app's `/shows?`
- [x] 3.2 `e2e:subpath`: one link from Show Detail resolves to `/sub/shows?…`

## 4. Verify & docs

- [x] 4.1 `npm run lint`, `npm test`, `npm run build`, `npm run e2e`, `npm run e2e:subpath`
- [x] 4.2 `CLAUDE.md` (CSV-derived text rule → documented `showsLink` exception; Tests), `IDEAS.md` (Pages P1 "Everything is a link" → Completed; Chart drill-down P2 note: reuse `showsLink`), `CHANGELOG.md`, `features.txt`, README if user-facing, version bump
