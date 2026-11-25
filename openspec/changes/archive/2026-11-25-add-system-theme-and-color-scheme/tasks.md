## 1. Theme model

- [x] 1.1 In `src/themes.ts`: add `SYSTEM_THEME = 'System'`, `THEME_OPTIONS = [SYSTEM_THEME, ...THEME_NAMES]`, pure `resolveThemeName(pref, prefersDark)`; add a top-of-file note that the module must stay dependency-free (imported by `vite.config.ts`)
- [x] 1.2 Replace `loadThemeName` in `App.tsx` with `loadThemePreference()` — saved `themeName` if it is `SYSTEM_THEME` or a known theme (own-key `lookup`), else `SYSTEM_THEME`
- [x] 1.3 Unit tests (`src/themes.test.ts`): `resolveThemeName` for System dark/light and named themes; preference loading for missing / unknown / non-string / `"System"` / valid name (move `loadThemePreference` next to `resolveThemeName` if that keeps it testable without React)

## 2. OS preference + document sync

- [x] 2.1 Add `useMediaQuery(query)` in `src/hooks/useMediaQuery.ts` on `useSyncExternalStore` (SSR/no-`matchMedia` safe: returns `false`)
- [x] 2.2 `App.tsx`: store `themePreference`; resolve the active `Theme` from preference + `useMediaQuery('(prefers-color-scheme: dark)')`; save the preference on change
- [x] 2.3 `App.tsx`: effect on the resolved theme setting `document.documentElement.style.colorScheme` and `.backgroundColor` (`contentBg`)
- [x] 2.4 `ThemeToggle`: options from `THEME_OPTIONS` (System first); value/onChange are the preference (prop types updated through `AppLayout`)
- [x] 2.5 jsdom test for `useMediaQuery` (initial value, live `change` event, cleanup)

## 3. No-flash boot script

- [x] 3.1 `vite.config.ts`: plugin with `transformIndexHtml` injecting an inline head script generated from `THEMES` (name → color scheme + `contentBg`), resolving saved / System / invalid via `matchMedia`, wrapped in `try/catch`
- [x] 3.2 Add `src/themes.ts` to `tsconfig.node.json` `include`; confirm `npm run build` (`tsc -b`) passes and the built `dist/index.html` contains the script
- [x] 3.3 Verify in dev that the script runs (served `index.html` contains it) and that no console errors appear

## 4. E2E

- [x] 4.1 New `e2e/theme.spec.ts`: `colorScheme: 'light'` emulation with no saved settings → Default Light + computed `color-scheme: light`; `'dark'` → Default Dark
- [x] 4.2 Live switch: System selected, `page.emulateMedia({ colorScheme })` flips → theme follows without reload; with Dracula saved → no change
- [x] 4.3 Saved Default Light + delayed `/src/main.tsx` (route interception) → `html` background already Default Light's `contentBg` before mount
- [x] 4.4 Theme selector shows System first; choosing a theme persists across reload

## 5. Docs

- [x] 5.1 `CLAUDE.md`: Theme System (preference vs resolved, System default, `resolveThemeName`, `useMediaQuery`), Styling exception (generated boot script in `index.html`), localStorage exception (boot script read-only), Tests list
- [x] 5.2 `README.md` / `features.txt`: System theme + no-flash; `IDEAS.md`: move the three Entry / root P1 items to Completed; `CHANGELOG.md` entry
- [x] 5.3 Run `npm run lint`, `npm test`, `npm run build`, `npm run e2e`
