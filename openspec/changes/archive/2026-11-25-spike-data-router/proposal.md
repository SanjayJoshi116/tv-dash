## Why

Navigation feedback is coarse: moving to a page whose code isn't loaded yet swaps the current page for a centered spinner (`Suspense` fallback), and page errors rely on a hand-written boundary that resets on pathname changes with subtle ordering rules (`prevState.error` check, deliberately not keyed). React Router v7's data router (`createBrowserRouter`) offers route-level `lazy`, per-route `errorElement` and `useNavigation()` — keeping the current page on screen with a progress indicator while the next one loads. The project already runs react-router v7 but uses `BrowserRouter`. `IDEAS.md` → Entry / root P2 ("Data router"), flagged "spike first" because `Content` (not window) is the scroll container and several conventions depend on current router behavior.

## What Changes

- **Spike (gate):** migrate on a branch and check the go/no-go criteria in `design.md` (StrictMode, scroll reset, `/shows/1 → /shows/2` without remount, error reset, prefetch, e2e green). If any fails without a clean fix, stop and record the findings in `IDEAS.md`; nothing ships.
- **If go:** routes defined with `createBrowserRouter` + `RouterProvider`, pages loaded with route `lazy`.
- While the next page's code loads, the **current page stays visible** and a thin **progress bar** shows at the top of the content area (replaces the full-page spinner for navigations; first load still shows the loading state).
- Page render errors are shown in the layout via the route error element and clear on the next navigation; Show Detail is still not remounted between shows.

## Capabilities

### New Capabilities
- `navigation-feedback`: what the user sees while navigating between pages and when a page fails to render.

### Modified Capabilities
<!-- none in openspec/specs/ -->

## Impact

- `src/App.tsx` (router), `src/components/AppLayout.tsx` (progress bar, `Outlet`), `src/components/RouteErrorBoundary.tsx` (replaced or reduced to an error element), `src/routes/pageLoaders.ts` (from `smarter-route-prefetch`; route `lazy` reuses the loaders).
- Interacts with `add-root-error-safety-net` (root boundary stays outside the router), `smarter-route-prefetch` and `add-pwa-offline` (chunk loading) — apply last.
- Tests: e2e for progress bar + kept page, error reset, no Show Detail remount; existing mobile-nav / scroll specs must stay green.
- Docs: `CLAUDE.md` provider stack + Routing / errors section (large rewrite of the boundary notes), `features.txt`, `IDEAS.md`, `CHANGELOG.md`.
