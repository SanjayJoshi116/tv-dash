## 1. Color math

- [x] 1.1 New `src/utils/color.ts`: `parseHex`, `hexToHsl`, `hslToHex`, `relativeLuminance`, `contrastRatio` (pure, no deps)
- [x] 1.2 New `src/utils/color.test.ts`: round-trips, known WCAG ratios (black/white 21:1, `#777` on white ≈ 4.48)

## 2. Custom theme builder

- [x] 2.1 `themes.ts`: `CUSTOM_THEME = 'Custom'`, `buildCustomTheme(accent, base)` (base spread + `colorPrimary` / `areaFill` / derived `chartColors`), `parseCustomTheme(value)` with field-by-field fallback
- [x] 2.2 Tests: 10 distinct colors, each ≥ 3:1 vs `contentBg`, swept over hues × lightness × saturation on both bases (incl. `#fef08a`, `#808080`, `#000000`, `#ffffff`); invalid accent/base fallbacks; inherited-key strings rejected
- [x] 2.3 If the theme contract test exists, run it against a few `buildCustomTheme` outputs too

## 3. State & UI

- [x] 3.1 Theme state (`App` or `AppThemeProvider`): accept `'Custom'` preference, keep `customTheme` state loaded via `getSettings()` + `parseCustomTheme`, resolve to `buildCustomTheme(...)` (memoized)
- [x] 3.2 `ThemeToggle`: "Custom" option; when selected show `ColorPicker` (`id="theme-accent"`, hex, no alpha, presets) and `Segmented` base switch (`id="theme-base"`); live `onChange`, `saveSetting('customTheme', …)` on `onChangeComplete`
- [x] 3.3 Boot script (if `add-system-theme-and-color-scheme` applied): `'Custom'` → `customTheme.base` color scheme / background

## 4. Tests & docs

- [x] 4.1 e2e: select Custom, set accent via the picker's hex input, assert primary color applied and persisted across reload; switch base → document color scheme light; switch to Dracula and back restores accent
- [x] 4.2 `CLAUDE.md` (Theme System: Custom theme, `customTheme` setting, `utils/color.ts`), `IDEAS.md`, `CHANGELOG.md`, `features.txt`
- [x] 4.3 Run `npm run lint`, `npm test`, `npm run build`, `npm run e2e`
