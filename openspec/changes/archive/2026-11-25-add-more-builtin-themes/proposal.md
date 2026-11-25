## Why

Three themes cover the basics, but there's nothing for users who need stronger contrast (low vision, bright rooms, cheap displays), nothing true-black for OLED phones (the app is mobile-first), and no well-known community palettes. Once the theme contract test exists (`refactor-typed-theme-provider`), adding a theme is just data with an automatic readability check. `IDEAS.md` → Entry / root P3 ("More built-in themes").

## What Changes

- Four new themes in the selector: **High Contrast** (dark, AAA text contrast, accessibility-focused), **OLED Black** (pure `#000` surfaces), **Nord** (dark), **Solarized Light** (light).
- Each passes the existing theme contract (10 distinct chart colors, text ≥ 4.5:1, chart colors ≥ 3:1); High Contrast additionally meets ≥ 7:1 for text and ≥ 4.5:1 for chart colors and borders.
- Selector order: Default Dark, Default Light, Dracula, then the new themes (System first if present). "System" still resolves only to Default Dark / Default Light.
- No change for users with a saved theme.

## Capabilities

### New Capabilities
- `builtin-themes`: the set of named themes offered and the readability guarantees every named theme meets.

### Modified Capabilities
<!-- none -->

## Impact

- `src/themes.ts` (four entries; with typed names, `ThemeName` grows automatically), `src/themes.test.ts` (contract runs over all themes; extra High Contrast assertions).
- Depends on `refactor-typed-theme-provider` (contract test). If `add-semantic-theme-colors` landed, each new theme also sets its semantic colors (and they're contract-checked).
- Boot script picks the new themes up automatically (generated from `THEMES`).
- e2e: extend theme coverage (ideally via `add-url-theme-override`'s `?theme=`) with a smoke pass per new theme on Statistics.
- Docs: `CLAUDE.md` (Theme System: "3 theme objects" → 7), `README` screenshots optional, `IDEAS.md`, `CHANGELOG.md`, `features.txt`.
