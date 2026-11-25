## Context

`App` renders its own `BrowserRouter`, lazy-loads pages (`React.lazy`) and idle-prefetches all chunks. `useTvData` fetches `/tv_series.csv`. jsdom tests must start with `// @vitest-environment jsdom`; default env is node. Fixtures: `csv()` / `VALID_ROW` / `withId()` in `parseSeriesCsv.fixture.ts`.

## Goals / Non-Goals

**Goals:** catch "root crashes / route doesn't mount / theme fallback broken" in < 2s without a browser.

**Non-Goals:** visual or layout assertions (e2e's job); chart rendering (Recharts needs real layout — assert the page heading/landmark only); replacing any e2e spec.

## Decisions

1. **Drive the URL with `window.history.pushState` before render**, keeping `App`'s `BrowserRouter` as is. jsdom supports the History API, so `BrowserRouter` reads the pushed path — no need to refactor `App` to accept a router.
   *Alternative:* split `App` into `AppProviders` + `AppRoutes` so the test can use `MemoryRouter` — cleaner but a refactor; deferred to `refactor-typed-theme-provider`, where `App` is restructured anyway.

2. **Stub `fetch`** with `vi.stubGlobal` returning `csv(VALID_ROW, withId(2))`; unstub in `afterEach` (same pattern as `useTvData.test.ts`). Stub `matchMedia` (jsdom lacks it) and `requestIdleCallback` (absent → falls back to `setTimeout`, fine).

3. **Assert with `findBy*`** on stable text per page (header title from `NAV_ITEMS`, the show name on Show Detail, "Page not found") so lazy chunks resolve. `ResizeObserver` is stubbed for Show Detail's overview clamp.

4. **Theme fallback asserted through observable output**, not internals: the `#theme-select` value (and, once change 1 lands, `document.documentElement.style.colorScheme`). The test reads the expected default from `themes.ts` exports so it passes before and after `add-system-theme-and-color-scheme`.

## Risks / Trade-offs

- [antd / Recharts warnings in jsdom (e.g. `ResponsiveContainer` width 0)] → Only Statistics renders charts; assert the tab list, and silence the known Recharts size warning in that test only.
- [Flaky lazy loading] → `findBy*` with the default timeout; Vitest resolves dynamic imports synchronously enough in node — no timers mocked here.
