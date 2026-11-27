## Why

Adding or renaming a page means editing three hand-synced lists: `App.tsx`'s `ROUTES` (data-router routes), `AppLayout.tsx`'s `NAV_ITEMS` (`key` + `label` + `icon` + `page`, also feeding `BottomNav` and `pageTitleFor`) and `routes/pageLoaders.ts`'s `PAGE_LOADERS`. Nothing ties them together: a path typo or a page missing from one list compiles fine and only shows up as a wrong title, a dead nav item or a page that's never prefetched. `AppLayout` also strips the `page` field back out (`MENU_ITEMS`) so it doesn't land on antd's `<li>`. Separately, the three clickable show elements (`ShowCard`, Dashboard's `ShowRowCard`, the Not Started rows) each repeat the same five props (click, Enter/Space key, hover / focus prefetch, `role`, `tabIndex`). `IDEAS.md` → Entry / root P2 ("Single route table").

## What Changes

- One page table in `src/routes/` — per page: `page` key, `path`, code loader and optional `nav` (`label`, `icon`). `PageKey`, `PAGE_LOADERS`, the router's page routes, the sidebar / bottom-nav items and the nav-route titles are all derived from it.
- `App.tsx` maps the table to data-router routes (pathless `PagesOutlet` route, `HydrateFallback`, `*` → `NotFoundPage` unchanged).
- `AppLayout` / `BottomNav` / `pageTitleFor` read the derived nav list; the `NavItem.page` field and the `MENU_ITEMS` stripping go away (antd Menu items are built from the table without extra keys).
- A `showLinkProps(tvId, navigate)` helper returns the shared clickable-show props; the three call sites use it.
- **No behavior change**: same URLs, titles, nav order / highlight, prefetch triggers, keyboard handling and lazy loading. Existing unit + e2e suites are the safety net; a unit test pins the table's invariants.

## Capabilities

### New Capabilities
<!-- none: pure refactor, no requirement changes (skip_specs: true) -->

### Modified Capabilities
<!-- none -->

## Impact

- New `src/routes/pages.ts` (table + derived lists) and its test; `src/routes/pageLoaders.ts` (loaders / `PageKey` derived from the table, prefetch logic unchanged), `src/App.tsx`, `src/components/AppLayout.tsx`, `src/components/BottomNav.tsx` (`NavItem` type), `src/utils/pageTitle.ts` (input type only), new `src/utils/showLink.ts` (or next to `a11y.ts`), `src/components/ShowCard.tsx`, `src/pages/DashboardPage.tsx`.
- No new dependencies; no URL, storage or spec changes.
- Docs: `CLAUDE.md` (Page code loading / prefetch, Routing, Clickable non-button elements — "a new page: one table entry"), `IDEAS.md` (move the idea to Completed), `CHANGELOG.md`.
