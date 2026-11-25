## Why

Getting the app into a specific theme today means clicking the selector, which also overwrites the visitor's saved preference. That's awkward for README screenshots, for comparing themes side by side in two tabs, and for e2e tests (which currently can only cover non-default themes by driving the selector). `IDEAS.md` → Entry / root P3 ("URL theme override").

## What Changes

- `?theme=<name>` in the URL (e.g. `?theme=Dracula`, `?theme=Default+Light`) applies that theme for the page session **without saving it**. The saved preference is left untouched.
- Unknown / empty values are ignored (normal saved / default theme used); matching is exact-name, case-insensitive.
- The override lasts while the user navigates within the app (it's read once at startup), and ends when the user picks a theme in the selector — that choice applies and is saved as usual.
- First-paint boot script (if `add-system-theme-and-color-scheme` is applied) honors the override too, so screenshots have no flash.
- e2e fixture gains a `theme` option using the override.

## Capabilities

### New Capabilities
- `theme-url-override`: temporary, non-persisted theme selection via the page URL.

### Modified Capabilities
<!-- none -->

## Impact

- Theme state init in `App` (or `AppThemeProvider`): `readThemeOverride(location.search)` (pure, in `themes.ts` or a small util) → initial resolved theme + `persist: false` flag until the user changes the selector.
- Boot script generator in `vite.config.ts` (if present): parse `location.search` before `localStorage`.
- `e2e/fixtures.ts` (`theme` option → navigates with `?theme=`), optional theme spec loop; `add-more-builtin-themes` uses it.
- Docs: `CLAUDE.md` (Theme System / localStorage: override never persists), README (screenshot tip), `IDEAS.md`, `CHANGELOG.md`.
