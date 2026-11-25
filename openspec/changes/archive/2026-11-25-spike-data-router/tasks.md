## 1. Spike (time-boxed, on a branch)

- [x] 1.1 Branch; replace `BrowserRouter` with `createBrowserRouter` + `RouterProvider`; route `lazy` via `lazyPage(key)` over `PAGE_LOADERS` (create the loaders module if `smarter-route-prefetch` isn't applied)
- [x] 1.2 Route `errorElement`s (`PageError` with `ErrorState`) for children; keep `RouteErrorBoundary` in place initially
- [x] 1.3 Check go/no-go criteria 1–5 from `design.md`; record results (incl. StrictMode trace) in the change folder as `spike-notes.md`
- [x] 1.4 Decision: **no-go** → write findings into the IDEAS.md entry, revert branch, stop here. **Go** → continue

## 2. Migration (go only)

- [x] 2.1 Remove `Suspense` around `Outlet` for navigations (first load still shows `LoadingState` via `HydrateFallback` / initial state) and remove or reduce `RouteErrorBoundary` per criterion 3
- [x] 2.2 `AppLayout`: navigation progress bar (`useNavigation`, ~150ms delay, primary color, no animation under reduced motion)
- [x] 2.3 Confirm scroll reset + BottomNav re-show effects unchanged; `useMatch('/shows/:id')` / title logic unchanged

## 3. E2E

- [x] 3.1 Delay the `StatisticsPage` module (route interception) → Dashboard stays visible + progress bar shown → Statistics appears, bar gone
- [x] 3.2 Page throw (intercepted module) → in-layout error; navigate to another page → renders
- [x] 3.3 `/shows/1 → /shows/2`: no loading state, content scrolled to top, overview-collapsed state reset as today
- [x] 3.4 Full suite green under the default and `pwa` projects (if present)

## 4. Docs

- [x] 4.1 `CLAUDE.md`: provider stack diagram, Routing / errors section (data router, error elements, progress bar), remove obsolete `RouteErrorBoundary` notes if removed, Tests list
- [x] 4.2 `features.txt`, `IDEAS.md` (move "Data router" to Completed, or record no-go findings), `CHANGELOG.md`
- [x] 4.3 Run `npm run lint`, `npm test`, `npm run build`, `npm run e2e`
