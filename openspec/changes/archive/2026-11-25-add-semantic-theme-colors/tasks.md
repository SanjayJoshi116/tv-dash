## 1. Theme data + contract

- [x] 1.1 Add `tiers` (`success` / `warning` / `danger`, each `{ fill, onFill }`) and `star` to `Theme` and all three themes; remove `areaFill`
- [x] 1.2 Extend `themes.test.ts` (create it if `refactor-typed-theme-provider` isn't applied): fills ≥ 3:1 vs `contentBg`, `onFill` ≥ 4.5:1 vs fill, `star` ≥ 3:1; tune values until green

## 2. Helpers

- [x] 2.1 `ui.ts`: pure `tier(v, high, mid)`; `ratingColor(v, theme)`, `ratingOnColor(v, theme)`, `completionColor(v, theme)`; remove `STAR_COLOR`
- [x] 2.2 Update `ui.test.ts`: tier boundaries (8 / 6, 75 / 40), `null` → `undefined`, colors read from a given theme

## 3. Call sites

- [x] 3.1 `ShowCard` and Show Detail rating badges: fill `ratingColor`, text `ratingOnColor`
- [x] 3.2 `DashboardPage` (stat cards, Highlights Top Rated, compact-list stars → `theme.star`), `StatsBar`, Show Detail completion `Progress`
- [x] 3.3 `ChartsSection`: `areaFill` → `theme.token.colorPrimary`
- [x] 3.4 `npm run build` clean (no remaining old signatures)

## 4. E2E + docs

- [x] 4.1 E2E: in Default Light and Default Dark, a rating badge's computed text vs background contrast ≥ 4.5 (compute from `getComputedStyle` in the test)
- [x] 4.2 `CLAUDE.md` (Theme fields incl. `tiers` / `star`, Shared Constants section), `features.txt`, `IDEAS.md` (move "Semantic theme tokens" to Completed), `CHANGELOG.md`
- [x] 4.3 Run `npm run lint`, `npm test`, `npm run build`, `npm run e2e`
