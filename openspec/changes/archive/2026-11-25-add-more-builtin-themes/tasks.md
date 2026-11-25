## 1. Themes

- [x] 1.1 `themes.ts`: add High Contrast, OLED Black, Nord, Solarized Light (starting palettes from design.md) in that order
- [x] 1.2 Run the contract test; nudge failing chart colors' lightness until all pass
- [x] 1.3 `themes.test.ts`: High Contrast text ≥ 7:1, chart colors + border ≥ 4.5:1; OLED Black content/header `#000000`; theme order assertion

## 2. Check in the app

- [x] 2.1 Browser pass per new theme on Dashboard, Shows, Statistics (all 4 tabs), Show Detail: cards visible (OLED), tags/status colors legible, native scrollbars match
- [x] 2.2 e2e: loop over the new theme names — select theme (or `?theme=` if available), open Statistics, assert no console errors and document background = theme `contentBg`
- [x] 2.3 Confirm "System" still resolves only to Default Dark / Default Light (existing test, or add one)

## 3. Docs

- [x] 3.1 `CLAUDE.md` Theme System (7 themes), `IDEAS.md`, `CHANGELOG.md`, `features.txt`; README theme list
- [x] 3.2 Run `npm run lint`, `npm test`, `npm run build`, `npm run e2e`
