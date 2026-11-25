## Why

Every tab, history entry and bookmark says "TV Dashboard", so browser history, tab switching and bookmarks can't tell Dashboard, Shows, Statistics or a particular show apart. The header has the same gap on Show Detail ("Show Detail" instead of the show's name), even though `AppLayout` already reads the data context. `IDEAS.md` → Entry / root P1 ("Per-route `document.title`"), plus the matching Components P1 idea ("Show name in the header"), which derives from the same title.

## What Changes

- The browser tab title follows the current route: `Dashboard · TV Dashboard`, `Shows · TV Dashboard`, `Statistics · TV Dashboard`, `<show name> · TV Dashboard` on Show Detail, `Page not found · TV Dashboard` for unknown URLs.
- Show Detail falls back to `Show Detail` while data loads and `Show not found` for an unknown ID — in both the tab title and the header.
- The header title on Show Detail shows the series name (same source as the tab title, without the suffix).
- Titles are computed in one place, so header and tab can't disagree.

## Capabilities

### New Capabilities
- `page-titles`: the page title shown in the header and the browser tab title for every route, including loading / not-found fallbacks.

### Modified Capabilities
<!-- none -->

## Impact

- `src/components/AppLayout.tsx` (title derivation; header text), new `src/hooks/useDocumentTitle.ts`.
- Reads `data` (and `loading`) from the existing `useTvDataContext()` call in `AppLayout` — CLAUDE.md's "AppLayout reads the context only for `warnings`" note must be updated.
- Tests: unit test for the title function; e2e assertions via `toHaveTitle` in a new or existing spec.
- Docs: `CLAUDE.md`, `features.txt`, `IDEAS.md`, `CHANGELOG.md`.
