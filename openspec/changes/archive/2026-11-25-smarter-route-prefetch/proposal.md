## Why

After mount, `App` idle-prefetches **every** page chunk (Dashboard, Shows, Statistics — the heaviest, with Recharts — and Show Detail) unconditionally, even on a metered / data-saver or 2G connection. Meanwhile the one navigation users do most — opening a show — gets no targeted warm-up. `IDEAS.md` → Entry / root P2 ("Smarter prefetch", which also absorbed the Components idea "hover-prefetch the detail chunk").

## What Changes

- Idle prefetch of all pages is **skipped** when the browser reports Data Saver or a 2G-class connection.
- **Intent prefetch:** hovering or focusing a navigation item (sidebar menu, mobile bottom nav on touch-start) loads that page's code; hovering or focusing a show card / Dashboard show row loads the Show Detail code. This also runs under Data Saver (it's a strong signal the user is about to navigate, and each chunk is fetched at most once).
- Prefetch failures stay silent; a real navigation still surfaces errors through the existing error boundary.
- Page loaders move out of `App` into one shared module so the shell and cards can trigger them.

## Capabilities

### New Capabilities
- `route-prefetch`: when page code is loaded ahead of navigation, and when it must not be.

### Modified Capabilities
<!-- none in openspec/specs/ -->

## Impact

- New `src/routes/pageLoaders.ts` (loaders + `prefetchPage(key)` + idle policy); `App.tsx` imports from it; `AppLayout` (menu items), `BottomNav`, `ShowCard`, Dashboard `ShowRowCard` / Not Started rows call `prefetchPage`.
- Tests: unit tests for the connection policy; e2e asserting chunk requests (hover → Show Detail chunk; data-saver → no idle requests).
- Docs: `CLAUDE.md` (routing / prefetch note), `features.txt`, `IDEAS.md`, `CHANGELOG.md`.
