# Spike notes — data router

Branch `spike/data-router`, react-router-dom 7.18. Decision: **go**.

## Shape tried

- `App`: `createBrowserRouter(ROUTES)` (per mount via `useState`, since the router reads
  `window.location` when created; `App.test` `pushState`s before each render) + `RouterProvider`.
- Layout route `AppLayout`, `errorElement: <RootRouteError />` (rethrows `useRouteError()` so
  `RootErrorBoundary` still shows the recovery screen; otherwise React Router's default error page
  would replace it).
- Pathless child route: element `PagesOutlet` (`UndefinedThrowGuard` around `<Outlet />`),
  `errorElement: <PageError />` — one in-layout boundary for every page.
- Pages: `lazy: lazyPage(key)` over `PAGE_LOADERS` + static `HydrateFallback: LoadingState`.
  `NotFoundPage` stays static.

## Criteria

1. **Suites green** — yes: lint, 210 unit, build, 63 e2e (incl. new `navigation.spec.ts`), 4 pwa.
   Two console-allowlist tweaks in `recovery.spec.ts` (React logs one more line per crash: the
   `RootRouteError` / `UndefinedThrowGuard` rethrow layer). Behavior assertions unchanged.
2. **`/shows/1 → /shows/3` no remount** — yes: a marker property on the `h3` survives the
   navigation; no spinner; `Content` back at `scrollTop` 0. Same route + same lazy `Component`,
   so React keeps the instance (overview-expanded reset stays on ShowDetailPage's effect — code
   untouched; not separately e2e'd, needs a long-overview fixture row).
3. **Errors** — yes, after one fix. React Router's `RenderErrorBoundary` resets on location change
   (`getDerivedStateFromProps` compares `location`), and an error thrown on the navigating render
   is caught after that reset — so the case `RouteErrorBoundary`'s `prevState.hasError` rule
   existed for holds. **But** it renders the errorElement only when `error !== undefined`:
   `throw undefined` looped past it to the recovery screen (e2e reproduced). Fix:
   `UndefinedThrowGuard` (rethrows `undefined` as an `Error` in `render`). No reset logic: while
   the errorElement shows, the guard is unmounted; the next navigation mounts a fresh one.
   `throw null` already worked (null ≠ undefined).
4. **StrictMode** — no oscillation. Dev server runs StrictMode; a `MutationObserver` init script
   records every bar appear / disappear: `['show', 'hide']` for a held-back page, `[]` for an
   already-loaded one. `NavProgress` derives visibility from location-keyed state (`shownFor ===
   navigation.location`) instead of resetting a boolean in an effect, so StrictMode's double
   effect just restarts the 150ms timer.
5. **Prefetch dedupe** — yes: hover + click on Statistics → one request for `StatisticsPage.tsx`
   (route `lazy` calls the same `import()`; the module map dedupes it).

## Other observations

- First load: the matched child's `HydrateFallback` renders inside the layout (React Router slices
  matches at the first route with a fallback) — header / sidebar visible, spinner in Content.
- `Suspense` around `<Outlet />` is gone: nothing suspends any more (no `React.lazy` left).
- `RouteErrorBoundary.tsx` deleted; its job is the pathless route's `errorElement`.
- Router instances aren't disposed on unmount (StrictMode would dispose the live one); only matters
  for tests that mount `App` repeatedly.
