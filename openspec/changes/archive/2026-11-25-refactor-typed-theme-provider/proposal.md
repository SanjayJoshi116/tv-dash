## Why

Theme handling is loosely typed and spread out: `THEMES: Record<string, Theme>` accepts any string key and repeats each name (key + `name` field); `App` owns theme state, persistence, the antd `configTheme` memo and (after `add-system-theme-and-color-scheme`) OS-preference resolution and document sync; `activeThemeName` / `onThemeChange` are prop-drilled through `AppLayout` into `ThemeToggle`. Nothing checks that a theme is complete or readable. Three Entry / root P2 ideas fix this together: **Strongly typed theme names**, **Extract `AppThemeProvider`**, **Theme contract test**.

## What Changes

- `ThemeName` union derived from the theme table; `THEMES` declared `as const satisfies Record<ThemeName, …>` with `name` derived from the key; preference type `ThemeName | 'System'`. Lookups no longer need `?? fallback`.
- New `AppThemeProvider` owns preference state, persistence (`settings.ts`), System resolution, document color-scheme/background sync and the antd `ConfigProvider` theme. `App` keeps only the provider stack + routes; `ThemeToggle` reads/sets the theme via a `useThemeSetting()` hook instead of props (`AppLayout` loses two props).
- New `src/themes.test.ts` contract: every theme has all fields, exactly 10 distinct `chartColors`, `chartText` ≥ 4.5:1 and every chart color ≥ 3:1 against `contentBg` (WCAG AA text / graphics).
- The contract currently **fails for Default Light** (`#65a30d` is 2.84:1 on `#f5f5f7`) — that one chart color is darkened to pass (e.g. `#4d7c0f`). Only visible effect of this change.
- No behavior change otherwise (hence `skip_specs`).

## Capabilities

### New Capabilities
<!-- none: refactor + tests; the single color tweak is not a spec-level behavior -->

### Modified Capabilities
<!-- none -->

## Impact

- `src/themes.ts`, `src/ThemeContext.tsx` (provider + hooks), `src/App.tsx`, `src/components/AppLayout.tsx`, `src/components/ThemeToggle.tsx`; the boot-script generator in `vite.config.ts` keeps importing `themes.ts` (must stay dependency-free).
- Depends on `add-system-theme-and-color-scheme` (moves its logic) and should follow `add-root-smoke-test` (safety net). Can be applied without change 1 by moving only today's logic.
- Docs: `CLAUDE.md` (provider stack, Theme System, component-context exceptions: `ThemeToggle` now calls a hook), `IDEAS.md`, `CHANGELOG.md`.
