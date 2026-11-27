## 1. Baseline

- [x] 1.1 Run `npm test` and `npm run e2e` before touching code; note the counts (the refactor must leave them unchanged except for the new tests)

## 2. Page table

- [x] 2.1 New `src/routes/pages.ts`: `PageDef` type, `PAGES` (`page`, `path`, `load`, optional `nav: { label, icon }` with icon component types) `as const satisfies`, `PageKey` derived, `hasNav` guard + `NAV_PAGES`
- [x] 2.2 `src/routes/pageLoaders.ts`: drop the hand-written `PageKey` / loader map; derive `PAGE_LOADERS` from `PAGES` (re-export `PageKey`); prefetch / idle logic unchanged
- [x] 2.3 New `src/routes/pages.test.ts`: unique keys and paths, paths start with `/`, nav order `/`, `/shows`, `/stats`, Show Detail has no nav, `PAGE_LOADERS` keys = table keys

## 3. Consumers

- [x] 3.1 `App.tsx`: page routes mapped from `PAGES` under the pathless `PagesOutlet` route; `*` → `NotFoundPage` unchanged
- [x] 3.2 `AppLayout.tsx`: build `NavItem[]` and antd Menu items from `NAV_PAGES` (no `page` stripping); `BottomNav` / `pageTitleFor` inputs unchanged in shape
- [x] 3.3 New `src/utils/showLink.ts` `showLinkProps(tvId, navigate)` (+ small test: click / Enter / Space navigate, prefetch handlers are `prefetchShowDetail` itself); use it in `ShowCard`, Dashboard `ShowRowCard` and the Not Started rows

## 4. Verify & docs

- [x] 4.1 `npm run lint`, `npm test`, `npm run build`, `npm run e2e`, `npm run e2e:subpath` — same results as 1.1 plus the new tests
- [x] 4.2 `CLAUDE.md` (Page code loading / prefetch: "a new page = one `PAGES` row"; Routing; Clickable non-button elements → `showLinkProps`; Tests list), `IDEAS.md` (Single route table + the `showLinkProps` candidate → Completed; Components "Single nav/route config" pointer), `CHANGELOG.md`, `features.txt` header, version bump
