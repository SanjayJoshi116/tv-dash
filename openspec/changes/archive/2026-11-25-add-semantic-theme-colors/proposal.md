## Why

Rating and completion colors are fixed hexes in `constants/ui.ts` (`#52c41a` / `#faad14` / `#f5222d`), identical in every theme. Measured against the themes:

- On Default Light they are nearly unreadable as text: green 2.08:1, amber 1.75:1 on `#f5f5f7`.
- The rating badges (Show Card, Show Detail) put **white text** on these fills: 2.27:1 on green, 1.9:1 on amber — below WCAG in every theme.
- Dracula shows stock antd colors next to its own palette.

`IDEAS.md` → Entry / root P2 ("Semantic theme tokens").

## What Changes

- Each theme defines **success / warning / danger** colors plus a matching **text-on-fill** color for each, and a **star** color; rating and completion tiers (and the compact-list star) read them from the active theme.
- Default Light gets darker tier colors (e.g. `#237804` / `#ad6800` / `#cf1322`); dark themes keep bright fills but rating badges switch to dark text; Dracula uses its own green / yellow / red.
- `areaFill` is removed from `Theme` and derived from the primary color (it equals `colorPrimary` in every theme today).
- The theme contract test (from `refactor-typed-theme-provider`) is extended to these colors.
- Tier thresholds (8 / 6 rating, 75 / 40 completion) are unchanged.

## Capabilities

### New Capabilities
- `semantic-colors`: how good / medium / poor values (ratings, completion) are colored per theme, and the contrast those colors must meet.

### Modified Capabilities
<!-- none in openspec/specs/ -->

## Impact

- `src/themes.ts` (new fields, `areaFill` removed), `src/constants/ui.ts` (`tierColor` / `ratingColor` / `completionColor` / `STAR_COLOR` take the theme), every caller: `DashboardPage`, `ShowDetailPage`, `ShowCard`, `StatsBar`, `ChartsSection`, Dashboard lists.
- `ratingColor(v)` signature changes to need the theme (e.g. `ratingColor(v, theme)`) — compile errors point to every call site.
- `ui.test.ts` tier tests updated; `themes.test.ts` extended. E2E: rating badge text color check.
- Builds on `refactor-typed-theme-provider` (contract test); can be applied without it by adding the test here.
- Docs: `CLAUDE.md` (Theme fields, Shared Constants: `ratingColor` / `completionColor` / `STAR_COLOR`), `features.txt`, `IDEAS.md`, `CHANGELOG.md`.
