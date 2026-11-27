## Context

Each data page does `const { data, loading, error, refetch } = useTvDataContext()` then `if (loading) return <LoadingState tip=… />; if (error) return <ErrorState message="Failed to load data" description={error} onRetry={refetch} />`. Hooks used after the prelude (Shows' memos, Dashboard's memos) must run before the early returns, so pages can't simply move everything below a gate. `useTvDataContext()` must be called by pages, not components (CLAUDE.md), except the documented shell exceptions.

## Goals / Non-Goals

**Goals:** one place for the loading → error order; Dashboard sections as prop-driven units; zero visual / DOM change.

**Non-Goals:** layout-matching skeletons (P3); customizable Dashboard (P3); changing page hooks' order.

## Decisions

- **`<DataGate state={ctx} tip?>{data => …}</DataGate>` component, not a `usePageData()` hook.** A hook can't return early for the caller; it would still need `if (!ready) return …` in every page. A render-prop component makes the order structural. The page still calls `useTvDataContext()` and passes the context value, so `DataGate` doesn't read context itself (keeps "components receive data as props"). Pages whose memos need `data` keep computing them before the gate (they're cheap on `[]`) — or move memos into a child (`DashboardContent`) rendered inside the gate; Dashboard and Shows use the child approach, which also keeps memos from running during loading.
- **ShowDetail's not-found `Empty`** stays in the page, inside the gate (needs loaded data).
- **Dashboard split:** `src/pages/dashboard/` (not `components/`): these are page-private sections. `ShowRowCard` moves to `dashboard/ShowRowCard.tsx`; each section takes its precomputed list and the page's `theme` as props (no new `useTheme()` callers, so CLAUDE.md's exception list doesn't grow) — exception: sections with Recharts read `usePrefersReducedMotion()` themselves (CLAUDE.md: animation sites call it directly).
- **Tests:** `DataGate` jsdom test (loading → spinner, error → message + Retry calls `refetch`, data → children; loading wins over error). Existing `dashboard` e2e + `App.test.tsx` cover the split.

## Risks / Trade-offs

- [Subtle DOM change breaks e2e selectors] → run full e2e before / after; diff `App.test` snapshots not used — rely on e2e.
- [`memo`ized children re-rendering more] → sections receive stable memoized arrays from the page; no new inline objects as props.
