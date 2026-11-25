## Why

Nothing in `src/` checks `prefers-reduced-motion`: every chart animates its bars / slices / areas on each tab switch (panes remount), the pie legend fades in, Ant Design components animate, and the mobile bottom nav slides on every scroll-direction change. Users who asked their OS to reduce motion get all of it. `IDEAS.md` → Entry / root P1 ("Respect `prefers-reduced-motion`").

## What Changes

- When the OS requests reduced motion, the dashboard turns off non-essential animation: chart entry animations (all Statistics charts and the Dashboard ratings chart), the pie legend fade, Ant Design component motion, and the bottom-nav slide (it still hides/shows, instantly).
- Content that waits for an animation to finish (the pie legend) appears immediately instead.
- Follows OS changes live; no in-app setting in this change.
- Depends on `add-system-theme-and-color-scheme` for the shared media-query hook (apply that change first).

## Capabilities

### New Capabilities
- `motion-preferences`: which animations the dashboard plays, and how it behaves when the user's OS requests reduced motion.

### Modified Capabilities
<!-- none -->

## Impact

- `src/App.tsx` (Ant Design motion via `ConfigProvider` theme), `src/components/ChartsSection.tsx` (chart animation flags, `AnimatedPie` legend), `src/pages/DashboardPage.tsx` (ratings chart), `src/components/BottomNav.tsx` (transition), new `src/hooks/usePrefersReducedMotion.ts` (on `useMediaQuery`).
- Tests: unit test for the hook; e2e with emulated `reducedMotion: 'reduce'` (legend visible immediately, no nav transition).
- Docs: `CLAUDE.md` (Recharts conventions, `AnimatedPie` note, BottomNav), `features.txt`, `IDEAS.md`, `CHANGELOG.md`.
