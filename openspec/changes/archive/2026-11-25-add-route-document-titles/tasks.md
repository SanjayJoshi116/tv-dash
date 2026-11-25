## 1. Title logic

- [x] 1.1 Add pure `pageTitleFor({ path, showId, data, loading })` (Dashboard / Shows / Statistics / Page not found / show name / Show Detail / Show not found) and `APP_NAME = 'TV Dashboard'`
- [x] 1.2 Unit tests: each route, trailing slash (caller passes normalized path), known show, unknown ID, loading, error state with no data
- [x] 1.3 Add `src/hooks/useDocumentTitle.ts` (sets `document.title` on change) + jsdom test

## 2. Wire into the shell

- [x] 2.1 `AppLayout`: read `data` / `loading` from the existing `useTvDataContext()` call; get the show id from `useMatch('/shows/:id')`; compute the title once (memoized show lookup)
- [x] 2.2 Header `Title` renders the page title; `useDocumentTitle(`${pageTitle} · ${APP_NAME}`)`
- [x] 2.3 Comment on `NAV_ITEMS`: every route needs an entry here (or an explicit case in `pageTitleFor`)

## 3. E2E

- [x] 3.1 `toHaveTitle` for `/`, `/shows`, `/shows/`, `/stats`, an unknown URL
- [x] 3.2 Show Detail: title + header use the show name from `TEST_CSV`; SPA navigation to another show updates both; unknown ID → "Show not found · TV Dashboard"

## 4. Docs

- [x] 4.1 `CLAUDE.md`: `AppLayout` reads `warnings`, `data`, `loading` from context (title); routing note on titles; Tests list
- [x] 4.2 `features.txt`, `IDEAS.md` (move Entry / root "Per-route `document.title`" and Components "Show name in the header" to Completed), `CHANGELOG.md`
- [x] 4.3 Run `npm run lint`, `npm test`, `npm run build`, `npm run e2e`
