## Context

`Theme` (`src/themes.ts`) has `isDark`, `token` (`colorPrimary`, `colorBgBase`, `colorTextBase?`), surface colors, `chartColors[10]`, `chartGrid`, `chartText`, `areaFill`. `App` builds the antd `ConfigProvider` theme from `algorithm` + `token`, so antd already derives hover/active shades from `colorPrimary`. `themes.ts` must stay dependency-free (the boot script generator in `vite.config.ts` imports it). Requirements: `specs/custom-theme/spec.md`.

## Goals / Non-Goals

**Goals:** pure, tested `buildCustomTheme(accent, base)`; readable palette for any accent; small UI.

**Non-Goals:** editing every theme field; multiple saved custom themes; sharing a theme via URL (see `add-url-theme-override` — could later accept `?accent=`); applying the accent to rating/status semantic colors.

## Decisions

1. **Base + accent overlay.** `buildCustomTheme(accent, base: 'dark' | 'light')` spreads `THEMES['Default Dark' | 'Default Light']` and overrides `name: 'Custom'`, `token.colorPrimary`, `areaFill`, `chartColors`. Surfaces stay the tested base values, so the contract (text contrast etc.) holds by construction.
   *Alternative:* derive surfaces from the accent too (tinted backgrounds) — more expressive, much harder to keep readable; out of scope.

2. **Palette = HSL hue rotation with contrast correction.** Convert accent to HSL; color *i* = hue + i·36°, saturation `max(s, 0.45)` (so grey accents still give 10 distinct hues), lightness starting from the accent's. For each color, step lightness toward darker (light base) or lighter (dark base) in 2% steps until contrast vs `contentBg` ≥ 3:1. Color 0 is the accent itself only if it already passes; otherwise its corrected version (the raw accent still drives `colorPrimary`, where antd handles contrast for buttons).
   *Alternative:* OKLCH for perceptual evenness — nicer, but needs more math in a dependency-free module; HSL + contrast correction meets the spec. Can be swapped later behind the same function.

3. **Color helpers in `src/utils/color.ts`** (`parseHex`, `hexToHsl`, `hslToHex`, `contrastRatio`) — pure, imported by `themes.ts` (still no third-party deps). The theme contract test (from `refactor-typed-theme-provider`) reuses `contrastRatio` instead of its own copy.

4. **Storage shape.** Theme preference stays `themeName` (`'Custom'` is a new valid value); `customTheme: { accent: '#rrggbb', base: 'dark' | 'light' }` is a separate key so leaving Custom keeps it. Validation: `/^#[0-9a-f]{6}$/i` and `base ∈ {dark, light}`, field-by-field fallback (per spec).

5. **UI.** `ThemeToggle` renders, when Custom is selected, an antd `ColorPicker` (`format="hex"`, `disabledAlpha`, `size="small"`, preset row = the three built-in primaries) and a `Segmented` Dark/Light. Picker `onChange` updates state live; persistence uses `onChangeComplete` to avoid a write per drag frame. Both get `id`s (form-field convention). On mobile the header is narrow — the picker is a small swatch button, so it fits next to the select.

6. **Boot script.** The generated script maps `'Custom'` → read `customTheme.base` (default dark) → that base's color scheme / background. Accent isn't needed for first paint.

## Risks / Trade-offs

- [Hue-rotated palettes can look garish] → Saturation capped at 0.85; it's an opt-in experimental theme (P3).
- [Lightness correction can't reach 3:1 for some hue] → Loop clamps at L = 0.05 / 0.95, where contrast vs both base backgrounds exceeds 3:1; unit test sweeps hues 0–359 × several lightness/saturation values on both bases.
- [Distinctness after correction] → Hues differ by 36°, so colors stay distinct even when lightness is clamped; asserted in tests.
- [antd ColorPicker bundle weight] → Loaded in the header chunk; acceptable (antd already present). If it shows up in bundle size, lazy-load it when Custom is selected.
