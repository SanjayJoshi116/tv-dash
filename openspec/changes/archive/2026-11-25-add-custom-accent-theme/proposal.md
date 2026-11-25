## Why

The three built-in themes are the only look the dashboard offers; users who want their own accent (brand color, favorite color, better contrast for their eyes) can't get it without editing `themes.ts`. Ant Design derives a whole palette from one `colorPrimary` and the `Theme` object is small, so a user-picked accent is cheap. `IDEAS.md` → Entry / root P3 ("Custom accent theme").

## What Changes

- New **Custom** entry in the theme selector. Choosing it reveals an accent color picker (antd `ColorPicker`) and a Dark / Light base switch next to the selector.
- The Custom theme is built from the chosen base (Default Dark or Default Light surfaces: backgrounds, borders, text, grid) plus the accent: `token.colorPrimary`, `areaFill` and a 10-color `chartColors` palette derived from the accent by hue rotation, lightness-adjusted so every chart color stays readable on the base background.
- Accent + base persist via `saveSetting('customTheme', { accent, base })`; invalid / missing saved values fall back to the base theme's own accent. Selecting another theme keeps the saved Custom settings for next time.
- First-paint boot script (from `add-system-theme-and-color-scheme`, if applied) treats Custom as its base for color scheme / background.

## Capabilities

### New Capabilities
- `custom-theme`: user-defined accent theme — selection, derived palette readability, persistence and fallback.

### Modified Capabilities
<!-- none: the `theming` capability lives in the unarchived add-system-theme-and-color-scheme change; this change adds a separate capability rather than editing an unarchived delta -->

## Impact

- `src/themes.ts` (`buildCustomTheme(accent, base)` + pure color helpers — must stay dependency-free for the boot script), new `src/utils/color.ts` (hex ↔ HSL, relative luminance / contrast) + tests, `src/components/ThemeToggle.tsx` (picker + base switch), theme state in `App` (or `AppThemeProvider`).
- Best applied after `refactor-typed-theme-provider` (typed `ThemeName`, provider, contract test — the contract test then also runs against sample Custom themes) and `add-semantic-theme-colors` (Custom inherits the base's semantic colors).
- Docs: `CLAUDE.md` (Theme System: Custom theme, `customTheme` setting), `IDEAS.md`, `CHANGELOG.md`, `features.txt`.
