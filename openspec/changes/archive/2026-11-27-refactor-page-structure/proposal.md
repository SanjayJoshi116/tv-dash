## Why

Two structural costs in `src/pages/` grow with every Pages feature: (1) all four data pages repeat the same `loading → LoadingState`, `error → ErrorState` prelude — the order CLAUDE.md requires (`loading` → `error` → data) is enforced by copy-paste; (2) `DashboardPage.tsx` is ~400 lines (more after `add-progress-filter` / `add-time-left`) holding six sections, a local `ShowRowCard` and every memo. The next P2 changes add more page UI, and the later "Customizable Dashboard" (P3) needs sections as units. `IDEAS.md` → Pages P2 ("`usePageData()` / `<DataGate>`", "Split `DashboardPage`").

## What Changes

- New `<DataGate>` component (render prop: `children(data)`) that owns the loading / error prelude with the page's spinner tip; Dashboard, Shows, Show Detail and Statistics use it. Pages keep their own empty / not-found `Empty` blocks (CLAUDE.md convention).
- `DashboardPage` split into `src/pages/dashboard/`: `ShowRowCard`, `Highlights`, `ContinueWatching`, `RecentlyWatched`, `SidebarTabs` (Top Genres / Watch Status / Ratings), `NotStartedList`, `ExploreCards`. Sections receive data as props (pages-pull / components-receive rule); `DashboardPage` keeps the memos and layout.
- **No behavior change**: same DOM structure, ids, labels, prefetch, keyboard handling, reduced-motion handling.

## Capabilities

### New Capabilities
<!-- none: pure refactor (skip_specs: true) -->

### Modified Capabilities
<!-- none -->

## Impact

- New `src/components/DataGate.tsx` (+ jsdom test), new `src/pages/dashboard/*.tsx`; `src/pages/{Dashboard,Shows,ShowDetail,Statistics}Page.tsx`.
- Page lazy chunks unchanged (section modules are imported statically by `DashboardPage`, so still one chunk per page).
- Docs: `CLAUDE.md` (Loading/error/empty state → `DataGate`; Clickable non-button elements → `ShowRowCard`'s new path; Poster fallback mention of `DashboardPage` thumbnails), `IDEAS.md`, `CHANGELOG.md`.
- First of the eight P2 Pages changes; assumes the five P1 changes (`extract-show-filtering` … `add-time-left`) have shipped.
