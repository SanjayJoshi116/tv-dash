## Why

The theme only exists inside React: first visit always lands on Default Dark regardless of the OS setting, native UI (scrollbars of the `Content` scroll container, autofill, form controls) stays light inside the dark themes, and Light / Dracula users see a dark-or-white flash before the bundle mounts. Three P1 items from `IDEAS.md` → Entry / root fix the same root cause — the document itself doesn't know the theme — so they ship together.

## What Changes

- New **System** theme option that follows the OS `prefers-color-scheme` (dark → Default Dark, light → Default Light) and switches live when the OS setting changes. It is the default when no theme is saved (or the saved value is invalid); an explicitly saved theme is still honored, so existing users see no change.
- The document root gets the active theme's native **color scheme** (dark/light) and **background**, so scrollbars, autofill and native controls match, and overscroll / gaps show the theme background instead of white.
- **No flash on load:** a tiny boot script in `index.html` applies the saved (or system-resolved) color scheme and background before the app bundle runs. Theme colors stay single-sourced in `src/themes.ts` (the script is generated from it at build time).
- Theme selector lists **System** first.
- Documented exceptions in `CLAUDE.md`: `index.html` carries one boot script (besides its one CSS rule), and that script reads `tvdash-settings` directly because `settings.ts` isn't loaded yet.

## Capabilities

### New Capabilities
- `theming`: how the active theme is chosen (System vs explicit), persisted, kept in sync with the OS, and applied to the document (native color scheme, background, first paint).

### Modified Capabilities
<!-- none — openspec/specs/ has no existing specs -->

## Impact

- `src/App.tsx` (theme preference state, resolution, document sync), `src/themes.ts` (System option, resolver), `src/components/ThemeToggle.tsx` (System entry), `index.html` (boot script slot), `vite.config.ts` (+ `tsconfig.node.json` include) for generating the boot script from `themes.ts`.
- Persistence: `themeName` in `tvdash-settings` may now hold `"System"`; no migration needed.
- Tests: new unit tests for theme resolution / preference loading; new e2e spec (emulated `prefers-color-scheme`, live switch, saved theme honored, first paint).
- Docs: `CLAUDE.md` (Theme System, Styling, localStorage exceptions), `README.md`, `features.txt`.
- No new runtime dependencies.
