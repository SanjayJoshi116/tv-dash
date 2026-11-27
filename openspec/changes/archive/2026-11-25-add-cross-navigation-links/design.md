## Context

After `shows-url-state`, Shows reads `q`, `genre`, `status` (and `progress`, `sort`, `page`, `size`) from the URL and a URL with any filter param wins over saved filters. Show Detail renders genres / networks / actors / keywords as antd `Tag`s, status as a colored `Tag`, creators as `join(', ')`. Dashboard's `renderBar` draws Top Genres / Watch Status rows. CLAUDE.md: never build an `href` from a CSV field; clickable non-buttons use `role="button"` + `activateOnKey`. Prefetch: `prefetchPage(key)` from `routes/pageLoaders.ts`.

## Goals / Non-Goals

**Goals:** real `<a>` links (new-tab gestures, copy link) built safely; one helper so the security argument lives in one place.

**Non-Goals:** chart drill-down on Statistics (P2, will reuse `showsLink`); dedicated network / actor filters (search is enough for now — see Risks); links on Shows cards.

## Decisions

- **`<Link>` over `navigate()` + `role="button"`:** a link is the right semantics (it navigates) and gives middle-click / Ctrl-click / context menu for free. Safe because `showsLink()` returns `{ pathname: '/shows', search: '?' + new URLSearchParams(...) }` — the pathname is a literal, the data value is percent-encoded into the query, so the rendered `href` is always `<base>/shows?…`; no `javascript:` / other-origin href is possible. React Router applies the basename. Alternative `navigate()` keeps today's rule untouched but loses link behavior — rejected.
- **`showsLink({ genre?, status?, q? })`** in `src/utils/showsLink.ts` builds only the params it's given (so the link means exactly that filter — URL precedence clears the rest). It uses `filtersToParams` from `showFilters.ts` with `DEFAULT_FILTERS` + the one field, so param names can't drift from the codec.
- **Search for people / networks / keywords:** `q=<name>`. Search already indexes actors, creators, networks, keywords, genres; the result always contains the origin show. Exact-field filters would need new filter types and UI — not worth it now.
- **`FilterLink` component:** `Link` with `style` removing underline / inheriting color, wrapping the existing `Tag` (or bar row); `onMouseEnter` / `onFocus` → `prefetchPage('shows')` (stable module-level handler); `aria-label` e.g. "Shows in genre Crime" / "Shows matching Bryan Cranston". Focus ring: `:focus-visible` can't be styled inline (no CSS files), so rely on the browser's default `<a>` focus outline — inline styles must not set `outline: none`. Hover: `cursor: pointer` + antd Tag hover is subtle; add `textDecoration` underline on hover via a small hover state in `FilterLink` (no CSS file).
- **Creators** render as `Space`-separated `FilterLink`s with comma text between, keeping the current look.
- **Dashboard bars:** `renderBar` gains an optional link target; the whole row (name, count, bar) is the link, block display, so the hit area is large on mobile.

## Risks / Trade-offs

- [Search over-matches: `q=HBO` also matches a keyword "hbo max"] → acceptable; the origin show is always included and the chip shows the search. A network filter stays a P2 idea ("More Shows filters").
- [CLAUDE.md rule erosion] → the exception is narrow and documented: only via `showsLink()`, only fixed in-app pathname. The e2e hostile-value test pins it.
- [Short actor names matching many shows (e.g. "Al")] → same as above; user can refine.
