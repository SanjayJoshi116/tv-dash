## Why

Show Detail and Dashboard are dead ends: genre, status, network, creator, actor and keyword tags on Show Detail, and the Top Genres / Watch Status bars on Dashboard, are plain text. "What else have I watched with this actor / on this network / in this genre?" needs a manual trip to Shows and retyping. With Shows filters in the URL (`shows-url-state`) every one of these can be a real link. `IDEAS.md` → Pages P1 ("Everything is a link").

## What Changes

- Show Detail: each genre tag → Shows filtered to that genre; status tag → filtered to that status; each network, creator, actor and keyword → Shows searched for that exact name. Creators become one link per name instead of a comma-joined string.
- Dashboard: each Top Genres bar → Shows filtered to that genre; each Watch Status bar → filtered to that status.
- They are real links (keyboard focusable, Enter activates, middle-click / Ctrl-click opens a new tab, visible focus), styled as today's tags / bars plus a hover affordance from the theme.
- Opening a link replaces the Shows view with exactly that filter (URL precedence from `shows-url-state`), and hovering / focusing one prefetches the Shows page code.
- Security: the link target is always the fixed Shows path; the data value goes only into an encoded query parameter — never into a path or a scheme.

## Capabilities

### New Capabilities
- `cross-navigation`: which elements link to a filtered Shows list, link semantics (keyboard, new tab), and the URL-safety constraint for data-derived links.

### Modified Capabilities
<!-- none -->

## Impact

- New `src/utils/showsLink.ts` (`showsLink({ genre?, status?, q? })` → router `To` with literal pathname `/shows` + `URLSearchParams` search; one test file); new small `src/components/FilterLink.tsx` (react-router `Link` around a `Tag` / bar, `onMouseEnter` / `onFocus` → `prefetchPage('shows')`).
- `src/pages/ShowDetailPage.tsx`, `src/pages/DashboardPage.tsx` (`renderBar`).
- `CLAUDE.md` "CSV-derived text is untrusted-ish" gets a documented, narrow exception (data value in an encoded query string on a fixed in-app path) — the reason the 0.4.7 security review relied on still holds.
- Depends on `shows-url-state`. No new dependencies.
- Docs: `CLAUDE.md`, `IDEAS.md`, `CHANGELOG.md`, `features.txt`.
