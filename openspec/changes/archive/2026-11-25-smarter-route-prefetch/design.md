## Context

`App.tsx` defines four loaders (`import('./pages/X').then(m => ({ default: m.X }))`), `lazy()`s them, and in an effect calls all of them at `requestIdleCallback` (fallback `setTimeout`), swallowing errors. Show Detail navigation happens from `ShowCard` (Shows grid) and Dashboard `ShowRowCard` / Not Started rows; nav from `AppLayout`'s `Menu` and `BottomNav`. Requirements: `specs/route-prefetch/spec.md`.

## Goals / Non-Goals

**Goals:** one module owning loaders + policy; intent triggers with zero cost after the first call.

**Non-Goals:** `<link rel="modulepreload">` injection / Speculation Rules (Vite chunk graph handles deps; revisit with the data-router spike); prefetching data (the CSV is already loaded once for all pages); prefetch on viewport visibility.

## Decisions

1. **`src/routes/pageLoaders.ts`** exports `PAGE_LOADERS: Record<PageKey, () => Promise<{ default: ComponentType }>>`, the `lazy()` components, `prefetchPage(key)` and `prefetchAllWhenIdle()`. `prefetchPage` memoizes the promise per key (`Map<PageKey, Promise>`) and attaches `.catch(() => {})` to the *prefetch* copy only; on rejection it deletes the cache entry so a later attempt (or real navigation) retries. `lazy()` calls the raw loader — the browser's module map dedupes the request with any in-flight prefetch.
   *Alternative:* keep loaders in `App` and pass callbacks down — prop drilling into memoized `ShowCard`; rejected.

2. **Connection policy** `shouldIdlePrefetch(conn = navigator.connection)` — pure, `false` when `conn?.saveData` or `conn?.effectiveType` is `'2g'` / `'slow-2g'`; `true` when `connection` is undefined (Firefox/Safari). Typed with a minimal local interface (the Network Information API isn't in TS's DOM lib).

3. **Triggers:**
   - `AppLayout` `Menu` items: `label` wrapped in a span with `onMouseEnter` / `onFocus` → `prefetchPage(key)` (antd `Menu` `items` accept ReactNode labels).
   - `BottomNav` buttons: `onPointerDown` / `onFocus` (touch has no hover; pointerdown fires before click).
   - `ShowCard`, Dashboard `ShowRowCard`, Not Started rows: `onMouseEnter` / `onFocus` → `prefetchPage('showDetail')`. `ShowCard` stays `memo`'d — handlers are module-level constants, no new props.

4. **Mapping nav keys → pages** via a small `NAV_KEY_TO_PAGE` next to `NAV_ITEMS` (`'/'` → dashboard, `'/shows'` → shows, `'/stats'` → statistics). Pairs with the future single route config idea.

## Risks / Trade-offs

- [Network Information API is Chromium-only] → Policy defaults to prefetch where unknown (current behavior); spec states it.
- [Dev server: every module is its own request, so "at most once" is per entry module] → E2E counts requests for the page module URL only (`/src/pages/ShowDetailPage.tsx`), which is stable in dev.
- [Hover on touch devices fires emulated mouseenter on tap] → Harmless: same chunk, same dedupe.
