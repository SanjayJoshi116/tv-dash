## Context

`AppLayout` computes `pageTitle` from `NAV_ITEMS` + `normalizedPath`, with `useMatch('/shows/:id')` for Show Detail → literal "Show Detail"; unknown URLs fall back to "TV Dashboard". It already calls `useTvDataContext()` (for `warnings`). `index.html`'s `<title>` is "TV Dashboard". Requirements: `specs/page-titles/spec.md`.

## Goals / Non-Goals

**Goals:** one pure title function feeding both header and `document.title`; no per-page title code.

**Non-Goals:** titles set by pages themselves; Open Graph / social meta (no server rendering); announcing route changes to screen readers (separate a11y idea).

## Decisions

1. **Pure `pageTitleFor(...)` in `AppLayout.tsx` (or a small `utils/pageTitle.ts`).** Inputs: `normalizedPath`, the `/shows/:id` match's `id`, `data`, `loading`. Output: the page title string. Unit-testable without rendering. Known paths come from `NAV_ITEMS`; anything else that isn't Show Detail is "Page not found".
   *Alternative:* each page calls `useDocumentTitle` itself — spreads the logic over 5 files, and the header would still need its own copy; rejected.

2. **Show lookup.** `data.find(s => s.tvId === Number(id))`, memoized on `[data, id]`. `loading` → "Show Detail"; loaded/error and not found → "Show not found". (The Context "derived indexes" idea would later replace `find` with `byId.get`.)

3. **`useDocumentTitle(title)`** in `src/hooks/useDocumentTitle.ts`: `useEffect(() => { document.title = title }, [title])`. DOM side effect only — no state, so no `set-state-in-effect` concern. Suffix " · TV Dashboard" added by `AppLayout` (constant `APP_NAME = 'TV Dashboard'`, also used for the fallback).

4. **Not-found detection by exclusion** rather than plumbing a flag from the `*` route: the route table is small and `NAV_ITEMS` + the `/shows/:id` match cover every real route. A comment on `NAV_ITEMS` notes that a new route needs a nav entry (or an explicit title) — the single route config idea (Components P2) would remove that coupling.

## Risks / Trade-offs

- [`AppLayout` re-renders on data changes now that it reads `data`] → It already re-rendered on context changes (same context object); no new cost. Splitting contexts is a separate, measured idea.
- [A future route without a `NAV_ITEMS` entry would be titled "Page not found"] → Comment + unit test listing every route path; caught when the route is added.
- [Long show names overflow the header] → Header `Title` already has `ellipsis`; the tab title is truncated by the browser.
