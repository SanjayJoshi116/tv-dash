## Context

Measured contrast against `contentBg` (WCAG relative luminance):

| Theme | `chartText` | weakest chart color |
|---|---|---|
| Default Dark | 12.33 | `#6366f1` 4.43 |
| Default Light | 15.98 | `#65a30d` **2.84** (fails 3.0) |
| Dracula | 13.36 | `#6272a4` 3.03 |

`ThemeContext.tsx` today holds only `ThemeProvider({ theme })` + `useTheme()`. CLAUDE.md lists which components may call `useTheme()` directly.

## Goals / Non-Goals

**Goals:** compile-time theme names; one owner of theme state; a test that rejects an unreadable theme.

**Non-Goals:** semantic success/warning/danger tokens (next change, `add-semantic-theme-colors`, extends this contract test); new themes; changing which theme System maps to.

## Decisions

1. **Theme table shape.** `const THEME_DEFS = { 'Default Dark': {...}, ... } as const satisfies Record<string, ThemeDef>`; `type ThemeName = keyof typeof THEME_DEFS`; `THEMES: Record<ThemeName, Theme>` built by mapping in the key as `name`. `isThemeName(x): x is ThemeName` (own-key) replaces `lookup(THEMES, …)` in validation. `THEME_NAMES: readonly ThemeName[]`.
   *Alternative:* keep `name` field hand-written — the duplication the idea removes.

2. **`AppThemeProvider` in `ThemeContext.tsx`.** Two contexts: the resolved `Theme` (existing `useTheme()`, unchanged for all callers) and a setting context `{ preference, setPreference }` via `useThemeSetting()`. Split so components that only need colors don't re-render on unrelated setting-context changes and `useTheme()` keeps its non-null default. The provider renders antd `ConfigProvider` itself, so `App` no longer imports antd theme algorithms.
   *Alternative:* one context with everything — every `useTheme()` caller would re-render when the setter identity changes; rejected (setter is stable anyway, but the split keeps `useTheme()`'s contract identical).

3. **`ThemeToggle` reads context.** Becomes prop-less (`useThemeSetting()`); `AppLayout` drops `activeThemeName` / `onThemeChange`. CLAUDE.md's list of components calling theme hooks directly gains `ThemeToggle` (theme is cross-cutting — same justification as `useTheme()`).

4. **Contract test thresholds:** text 4.5:1 (AA normal text — `chartText` is 11px axis labels), chart colors 3:1 (AA non-text graphics). Distinctness = 10 unique lowercase hex values. Luminance helper lives in the test file (tiny, no dependency).

5. **Fix Default Light `#65a30d` → `#4d7c0f`** (lime-700, ≈4.6:1) — same hue family, keeps palette order (index 9) so chart color assignments don't shift.

## Risks / Trade-offs

- [Boot-script generator imports `themes.ts`; new `as const` / mapping must stay plain TS without runtime deps] → covered by `npm run build` (`tsc -b` checks `vite.config.ts` + `themes.ts`).
- [Refactor regressions in theme switching] → `add-root-smoke-test` + existing e2e (`#theme-select`) must stay green; add a smoke assertion that switching theme updates the select and document color scheme.
- [Order with change 1] → If applied before `add-system-theme-and-color-scheme`, the provider just moves today's state; change 1's tasks then target `AppThemeProvider` instead of `App` (note in its tasks when applying).
