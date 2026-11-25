## Context

After `refactor-typed-theme-provider`, `THEMES` is a typed table (`ThemeName` derived from keys) with a contract test (`src/themes.test.ts`: fields, 10 distinct `chartColors`, `chartText` ≥ 4.5:1 and chart colors ≥ 3:1 vs `contentBg`). The selector, boot script and `ThemeName` all derive from the table. Requirements: `specs/builtin-themes/spec.md`.

## Goals / Non-Goals

**Goals:** four data-only theme additions, each contract-checked; stricter check for High Contrast.

**Non-Goals:** Solarized Dark / Nord Light variants (cheap later); per-theme fonts or radius; letting System map to a non-default theme; Windows forced-colors mode (`forced-colors: active`) support — separate concern.

## Decisions

1. **Starting palettes, tuned by the test.** Values below are the source palettes; any chart color the contract rejects is nudged in lightness (keeping hue) until it passes — the test is the arbiter, not these numbers.
   - **High Contrast** (dark): content/header `#000000` / `#0a0a0a`, text `#ffffff`, border `#a3a3a3`, primary `#ffd60a`, chart colors from a saturated, light set (`#ffd60a #4cc9f0 #ff6b9d #7cff6b #ff9f1c #c77dff #00f5d4 #ff5c5c #a3e635 #60a5fa`), grid `#5c5c5c`.
   - **OLED Black** (dark): content/header `#000000`, border `#1f1f1f`, poster fallback `#111111`, otherwise Default Dark's accent + chart colors.
   - **Nord** (dark): content `#2e3440`, header `#3b4252`, border `#4c566a`, text `#eceff4`, primary `#88c0d0`, chart colors from Frost + Aurora (`#88c0d0 #81a1c1 #b48ead #ebcb8b #a3be8c #d08770 #bf616a #8fbcbb` + two lightened Frost tones).
   - **Solarized Light** (light): content `#fdf6e3`, header `#eee8d5`, border `#d3cbb7`, text `#073642` (colorTextBase), primary `#268bd2`, chart colors = Solarized accents darkened where needed (`#268bd2 #6c71c4 #d33682 #b58900 #859900 #2aa198 #dc322f #cb4b16` + two).
   Palette names are references to public open-source color schemes (Nord, Solarized — both MIT-licensed); colors only, no logos.

2. **High Contrast extra assertions** live in the same test file, keyed by name (`THEMES['High Contrast']`), so they compile-fail if the theme is renamed.

3. **Order** = table insertion order (`THEME_NAMES`): defaults first so existing users see a familiar list top.

4. **`areaFill` / `colorPrimary`**: kept equal (or derived, if `add-semantic-theme-colors` made `areaFill` derived).

## Risks / Trade-offs

- [Selector gets long on mobile header] → 7–8 short names in a dropdown is fine; `Select` already scrolls.
- [OLED Black cards blend into the background] → Cards use antd's dark algorithm surfaces (`colorBgContainer` derived from `colorBgBase: #000`) plus `cardShadow`; check in browser, and if cards vanish set `colorBgContainer` explicitly (token passthrough).
- [Palette fidelity vs contrast] → Nudged colors drift slightly from the canonical palettes; readability wins (spec).
