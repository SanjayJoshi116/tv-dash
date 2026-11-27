## Context

See proposal.md for why. Current shape:
- `routes/pageLoaders.ts`: `PageKey` (hand-written union), `PAGE_LOADERS: Record<PageKey, loader>`, `lazyPage(key)`, `createPrefetcher` / `prefetchPage` / `prefetchShowDetail`, idle-prefetch policy. Imported by `App`, `AppLayout`, `BottomNav`, `ShowCard`, `DashboardPage`.
- `App.tsx`: `ROUTES` with the four page paths written by hand, each `...page(key)` (`lazy` + `HydrateFallback`) under the pathless `PagesOutlet` route, plus `*` → `NotFoundPage`.
- `AppLayout.tsx`: `NAV_ITEMS: NavItem[]` (`key` = path, `label`, `icon` JSX, `page`), `MENU_ITEMS` (same minus `page`, plus `onMouseEnter` / `onFocus` prefetch), and `NAV_ITEMS` passed to `BottomNav` and `pageTitleFor`.
- Clickable shows: three copies of `onClick` / `onKeyDown={activateOnKey(…)}` / `onMouseEnter` + `onFocus={prefetchShowDetail}` / `role="button"` / `tabIndex={0}`.
Constraints from CLAUDE.md: `prefetchShowDetail` must keep a stable identity (memo'd `ShowCard`); rc-menu item prefetch must stay on `onMouseEnter` / `onFocus` item props (not a span label); `BottomNav` prefetches on `onPointerDown` / `onFocus`; Show Detail must not remount between shows; `pageTitleFor` stays pure.

## Goals / Non-Goals

**Goals:** one place to add a page; derived lists typed so a mismatch can't compile; the clickable-show props written once; identical runtime behavior.

**Non-Goals:** changing URLs, titles, nav order or prefetch policy; moving `NotFoundPage` into the table (it's the `*` fallback, not a page with a key / loader); turning clickable cards into real `<a>` links (separate Components idea "Cards are real links"); a route-config library.

## Decisions

1. **Table module `src/routes/pages.ts`** (plain `.ts`, no JSX — icons stored as component types, rendered by the consumer):
   ```ts
   export const PAGES = [
     { page: 'dashboard', path: '/', load: () => import('../pages/DashboardPage').then(m => ({ default: m.DashboardPage })), nav: { label: 'Dashboard', icon: DashboardOutlined } },
     { page: 'shows', path: '/shows', load: …, nav: { label: 'Shows', icon: VideoCameraOutlined } },
     { page: 'showDetail', path: '/shows/:id', load: … },
     { page: 'statistics', path: '/stats', load: …, nav: { label: 'Statistics', icon: BarChartOutlined } },
   ] as const satisfies readonly PageDef[]
   export type PageKey = (typeof PAGES)[number]['page']
   export const NAV_PAGES = PAGES.filter(hasNav) // typed: nav is non-optional
   ```
   Table order = nav order (sidebar, bottom nav). `pageLoaders.ts` keeps all prefetch logic and derives `PAGE_LOADERS` from `PAGES` (`Object.fromEntries`, typed `Record<PageKey, …>`), so `pageLoaders.test.ts` and every prefetch caller are unchanged. Dependency direction: `pages.ts` → page modules (dynamic only) + icons; `pageLoaders.ts` → `pages.ts`; nothing imports back.
   *Alternative:* keep `PAGE_LOADERS` separate and only reference keys from the table — still two lists to keep in step; folding the loader into the row removes one.
   *Alternative:* JSX icons in the table (`.tsx`) — would make the table a component module (Fast Refresh boundary, `react-refresh/only-export-components` lint); component types avoid that.

2. **App routes from the table:** `PAGES.map(p => ({ path: p.path, lazy: lazyPage(p.page), HydrateFallback: LoadingState }))` inside the existing pathless `PagesOutlet` route, then `{ path: '*', Component: NotFoundPage }`. Same route objects as today, so React Router's matching and the Show Detail no-remount guarantee are unaffected.

3. **Nav consumers:** `NavItem` becomes `{ key: string; label: string; icon: ReactNode; page: PageKey }` built once in `AppLayout` from `NAV_PAGES` (`key: path`, `icon: <Icon />`) — `BottomNav`'s props and prefetch calls stay as they are. antd `Menu` items are built from `NAV_PAGES` directly (`key`, `label`, `icon`, `onMouseEnter` / `onFocus` → `prefetchPage(page)`), so there's no `page` field to strip. `pageTitleFor`'s `navItems` input only needs `{ key, label }` — unchanged signature.
   *Alternative:* `BottomNav` reads `NAV_PAGES` itself — would break the "components receive data as props" rule for no gain.

4. **`showLinkProps(tvId, navigate)`** in `src/utils/showLink.ts`: returns `{ onClick, onKeyDown, onMouseEnter: prefetchShowDetail, onFocus: prefetchShowDetail, role: 'button', tabIndex: 0 }` with `onClick = () => navigate(`/shows/${tvId}`)` and `onKeyDown = activateOnKey(onClick)`. A plain function, not a hook, because the Not Started rows call it inside `.map()`. `aria-label` stays at the call sites (they differ: `ShowRowCard`'s `ariaLabel ?? series.name`). `ShowRowCard` keeps its `onClick` prop for callers that pass it; Dashboard passes `navigate` once.
   *Alternative:* `useShowLink(tvId)` hook — can't be called in the Not Started `.map()`.

5. **Invariant test `src/routes/pages.test.ts`:** unique `page` keys and paths; every path starts with `/`; `NAV_PAGES` order = `['/', '/shows', '/stats']`; `PAGE_LOADERS` has exactly the table's keys; `/shows/:id` (the Show Detail route) has no `nav`.

## Risks / Trade-offs

- [Refactor regresses nav highlight, titles or prefetch] → Existing `App.test.tsx` (every route + titles), `pageTitle.test.ts`, `pageLoaders.test.ts`, and e2e `titles` / `prefetch` / `navigation` / `mobile-nav` / `subpath` cover the observable behavior; run all before and after.
- [`as const` table + `filter` loses the narrowed `nav` type] → a `hasNav` type guard keeps `NAV_PAGES[number]['nav']` non-optional.
- [Spreading `showLinkProps` onto antd `Card` passes `tabIndex` / `role` through] → `Card` forwards them to its root div today (current code already sets them on `Card`); unchanged.
- [`prefetchShowDetail` identity] → the helper returns the module-level function itself, never a wrapper, so `ShowCard`'s memo props stay stable.
