## Context

`App` renders `BrowserRouter > Routes > Route element={<AppLayout/>}` with child routes using `React.lazy` pages; `AppLayout` wraps `<Outlet />` in `RouteErrorBoundary` (resets on pathname change only if an error was already showing) and `Suspense` (fallback `LoadingState`). `Content` is the scroll container; `AppLayout` resets its `scrollTop` on pathname change and `BottomNav` re-shows on pathname change. Conventions in CLAUDE.md about StrictMode and `set-state-in-effect` came from real bugs here. Requirements: `specs/navigation-feedback/spec.md`.

## Goals / Non-Goals

**Goals:** route-level lazy + error elements + navigation state, with every existing navigation behavior preserved.

**Non-Goals:** route `loader`s for data (one CSV loaded once by `TvDataProvider` — moving it into loaders is a separate question); `ScrollRestoration` (doesn't manage a non-window scroll container); URL search-param state (Pages idea).

## Decisions

1. **Spike gate — go only if all hold on the branch:**
   1. All unit + e2e suites green (incl. `mobile-nav`, `show-detail` SPA navigation, `recovery` from the safety-net change).
   2. `/shows/1 → /shows/2` doesn't remount `ShowDetailPage` (overview-expanded reset still via its effect; poster state URL-keyed).
   3. Error on page A, navigate to B → B renders; error on the navigating render isn't swallowed (the case `RouteErrorBoundary`'s `prevState.error` rule exists for).
   4. No StrictMode-only oscillation in progress bar / nav state (check with a debug trace like the BottomNav investigation).
   5. Prefetch from `pageLoaders.ts` still dedupes with route `lazy` (one request per page module).
   If any fails without a clean fix → stop, write findings under the IDEAS entry, close the change.

2. **Router shape:** `createBrowserRouter([{ element: <AppLayout/>, errorElement: <RootRouteError/>, children: [{ index, lazy: lazyPage('dashboard') }, …, { path: '*', Component: NotFoundPage }] }])`, `<RouterProvider>` inside `TvDataProvider` (provider order unchanged otherwise). `lazyPage(key)` adapts `PAGE_LOADERS[key]` to `{ Component }`.
   *Alternative:* keep `BrowserRouter` and add a manual pending state around `Suspense` with `useTransition` — reimplements what the data router provides.

3. **Errors:** each child route gets `errorElement: <PageError/>` (reads `useRouteError()`, renders `ErrorState` with Retry = `navigate(0)`/reload); data routers clear route errors on navigation, replacing `RouteErrorBoundary`'s manual reset. Keep the class boundary only if criterion 3 fails for render errors thrown during navigation.

4. **Progress bar:** `useNavigation().state !== 'idle'` in `AppLayout` → 3px bar (`theme.token.colorPrimary`, inline styles) pinned to the top of `Content`; delayed ~150ms so fast navigations don't flash; no animation when reduced motion is requested (`respect-reduced-motion`).

5. **Scroll reset / BottomNav re-show** stay on `location.pathname` effects — unchanged.

## Risks / Trade-offs

- [Behavior differences under StrictMode] → Criterion 4; this codebase has history here.
- [Larger rewrite of CLAUDE.md routing notes] → Part of the change's docs task; old notes about `RouteErrorBoundary` move to the changelog if the class is removed.
- [Spike cost with no shipped result] → Time-box (one session); findings still improve the IDEAS entry.
