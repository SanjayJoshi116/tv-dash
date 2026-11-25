## 1. Hook

- [x] 1.1 Confirm `src/hooks/useMediaQuery.ts` exists (from `add-system-theme-and-color-scheme`); if not, create it with the same `useSyncExternalStore` API and tests
- [x] 1.2 Add `src/hooks/usePrefersReducedMotion.ts` (`useMediaQuery('(prefers-reduced-motion: reduce)')`) + jsdom test with a stubbed `matchMedia` (initial value, live change)

## 2. Apply at each animation site

- [x] 2.1 `App.tsx`: `configTheme` includes `token.motion: !reducedMotion` (memo deps updated)
- [x] 2.2 `ChartsSection.tsx`: read the flag once; `isAnimationActive={!reducedMotion}` on every `Bar` / `Area` / `Scatter`, passed into `countBarChart` and `AnimatedPie`
- [x] 2.3 `AnimatedPie`: `Pie` `isAnimationActive`; legend visible when `reducedMotion || animDone`, no opacity transition when reduced
- [x] 2.4 `DashboardPage.tsx`: ratings `Bar` `isAnimationActive={!reducedMotion}`
- [x] 2.5 `BottomNav.tsx`: `transition: 'none'` when reduced
- [x] 2.6 Grep `src/` for remaining `transition`, `animation`, Recharts series components without the flag

## 3. E2E

- [x] 3.1 New `e2e/reduced-motion.spec.ts` with `reducedMotion: 'reduce'`: Overview tab pie legend has opacity 1 immediately; after switching tabs and back, still visible immediately
- [x] 3.2 Mobile viewport + reduced motion: bottom nav computed `transition` is `none` (or duration 0) and it still hides on scroll-down / shows on scroll-up (`toBeInViewport`)
- [x] 3.3 Without reduced motion: legend still fades in (existing behavior preserved — opacity reaches 1 after animation)

## 4. Docs

- [x] 4.1 `CLAUDE.md`: Recharts convention (`isAnimationActive={!reducedMotion}` on every series, helpers carry it), `AnimatedPie` legend rule, BottomNav transition note, `usePrefersReducedMotion`, Tests list
- [x] 4.2 `features.txt`, `IDEAS.md` (move Entry / root "Respect `prefers-reduced-motion`" to Completed), `CHANGELOG.md`
- [x] 4.3 Run `npm run lint`, `npm test`, `npm run build`, `npm run e2e`
