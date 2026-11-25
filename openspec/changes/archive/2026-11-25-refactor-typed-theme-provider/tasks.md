## 1. Contract test first

- [x] 1.1 New `src/themes.test.ts`: all `Theme` fields present per theme; exactly 10 distinct `chartColors`; `chartText` ≥ 4.5:1 and each chart color ≥ 3:1 vs `contentBg` (relative-luminance helper in the test)
- [x] 1.2 Confirm it fails only on Default Light `#65a30d`; change it to `#4d7c0f`; test green

## 2. Typed theme names

- [x] 2.1 `themes.ts`: `THEME_DEFS as const satisfies …`, `ThemeName`, `THEMES: Record<ThemeName, Theme>` with `name` from the key, `THEME_NAMES`, `isThemeName()`; keep the module dependency-free
- [x] 2.2 Preference type `ThemeName | typeof SYSTEM_THEME` (if change 1 is applied) or `ThemeName`; replace `lookup(THEMES, …)` / `?? THEMES[DEFAULT]` call sites
- [x] 2.3 Unit tests for `isThemeName` (valid, unknown, inherited keys like `constructor`)

## 3. AppThemeProvider

- [x] 3.1 `ThemeContext.tsx`: `AppThemeProvider` (preference state + `saveSetting`, System resolution + document sync if present, antd `ConfigProvider` with algorithm/token); `useTheme()` unchanged; new `useThemeSetting()`
- [x] 3.2 `App.tsx`: provider stack + routes only; remove theme state/memo
- [x] 3.3 `ThemeToggle`: prop-less via `useThemeSetting()`; `AppLayout` drops `activeThemeName` / `onThemeChange`
- [x] 3.4 Extend `App.test.tsx` (from `add-root-smoke-test`): choosing a theme in `#theme-select` updates the select and persists to `tvdash-settings`

## 4. Wrap-up

- [x] 4.1 `CLAUDE.md`: provider stack diagram, Theme System (`ThemeName`, `AppThemeProvider`, `useThemeSetting`), component hook exceptions (+`ThemeToggle`), Tests list
- [x] 4.2 `IDEAS.md` (move the 3 ideas to Completed), `CHANGELOG.md` (note the Default Light chart color change)
- [x] 4.3 Run `npm run lint`, `npm test`, `npm run build`, `npm run e2e`
