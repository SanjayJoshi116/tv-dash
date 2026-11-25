## 1. Parse

- [x] 1.1 `themes.ts`: `readThemeOverride(search)` — `URLSearchParams`, trim, case-insensitive match → canonical option name or `null`
- [x] 1.2 Tests: exact, lowercase, `%20` / `+` encoded, empty, unknown, inherited-key names (`constructor`), multiple `theme` params (first wins)

## 2. Apply

- [x] 2.1 Theme state init (`App` / `AppThemeProvider`): `readThemeOverride(window.location.search) ?? load…()`; nothing saved on mount
- [x] 2.2 If `sync-settings-across-tabs` is applied: `fromUrl` ref set at init, cleared in the selector handler; storage subscriber ignores theme changes while set
- [x] 2.3 Boot script generator (if present): URL override before storage; jsdom test executes the generated script for sample URLs and checks `colorScheme` / background
- [x] 2.4 Root smoke test (if present): `?theme=Dracula` renders Dracula and leaves `tvdash-settings` unchanged

## 3. e2e & docs

- [x] 3.1 `e2e/fixtures.ts`: `theme` option; new spec: override applied, survives in-app navigation, not persisted on reload without the param, selector choice saves
- [x] 3.2 `CLAUDE.md` (Theme System: `?theme=` override, never persisted; e2e `theme` fixture), README screenshot tip, `IDEAS.md`, `CHANGELOG.md`
- [x] 3.3 Run `npm run lint`, `npm test`, `npm run build`, `npm run e2e`
