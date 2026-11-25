## Context

- Animations today: Recharts default entry animations on 14 Statistics charts (remounted per tab via `destroyOnHidden`) and the Dashboard ratings chart; `AnimatedPie` shows its legend only after `onAnimationEnd` (opacity 0 → 1, `transition: opacity 0.3s`); Ant Design's built-in motion; `BottomNav` `transition: transform 0.25s ease`.
- `add-system-theme-and-color-scheme` introduces `useMediaQuery` (`useSyncExternalStore`); this change builds on it.
- Components may call cross-cutting hooks directly (CLAUDE.md allows `useTheme()` in components for the same reason). Requirements: `specs/motion-preferences/spec.md`.

## Goals / Non-Goals

**Goals:** one boolean source (`usePrefersReducedMotion()`), applied at each animation site; nothing gated on an animation event that won't fire.

**Non-Goals:** in-app "reduce motion" toggle (possible later via `settings.ts`); count-up / skeleton animations that don't exist yet (future ideas must read the same hook); disabling scroll-to-top smoothing (none exists).

## Decisions

1. **`usePrefersReducedMotion()` = `useMediaQuery('(prefers-reduced-motion: reduce)')`** in `src/hooks/`. Called directly where needed (`App`, `ChartsSection`/`AnimatedPie`, `DashboardPage`, `BottomNav`) rather than through a new context: `useSyncExternalStore` keeps every caller in sync with one `matchMedia` source, and no prop drilling through memoized components.
   *Alternative:* put `reducedMotion` on the `Theme` object — themes are static data; mixing a runtime preference in would break `THEMES` as pure data (and the boot-script generator that imports it). Rejected.

2. **Ant Design:** `App`'s `configTheme` memo adds `token.motion: !reducedMotion` (antd 5 seed token `motion: boolean` — present in the installed version). One switch covers Tabs ink bar, Select dropdowns, Collapse, Spin, etc.

3. **Recharts:** every `Bar` / `Area` / `Pie` / `Scatter` gets `isAnimationActive={!reducedMotion}`. In `ChartsSection` the flag is read once and passed into the shared helpers (`countBarChart`, `AnimatedPie`) so new charts built from helpers inherit it.

4. **`AnimatedPie` legend:** visible when `reducedMotion || animDone`, and the legend's opacity transition is omitted when reduced. With `isAnimationActive={false}` Recharts doesn't fire `onAnimationEnd`, so the old gate would hide the legend forever — this is the one place where skipping animation changes logic, hence its own requirement.

5. **`BottomNav`:** `transition: reducedMotion ? 'none' : 'transform 0.25s ease'`. Hide/show logic untouched.

## Risks / Trade-offs

- [Missing an animation site (a new chart added later without the flag)] → Helpers carry it; CLAUDE.md Recharts convention gains "always pass `isAnimationActive={!reducedMotion}`"; e2e checks the legend case, which is the only logic-affecting one.
- [`ChartsSection` is `React.memo`'d; the hook inside it re-renders it on preference change] → Intended (rare event); memo still skips parent-driven re-renders.
- [Ordering dependency on change 1] → Tasks start by confirming `useMediaQuery` exists; if this change is applied first, task 1.1 creates it with the same API.
