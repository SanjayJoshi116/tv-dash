## Context

Theme preference is loaded once in `App` (`loadThemeName()` → `getSettings().themeName`, later `loadThemePreference()` / `AppThemeProvider`). `handleThemeChange` sets state and calls `saveSetting`. `BrowserRouter` sits *inside* the theme state, so the initial read can't use router hooks. If `add-system-theme-and-color-scheme` is applied, a generated inline boot script sets first-paint colors from `tvdash-settings`. Requirements: `specs/theme-url-override/spec.md`.

## Goals / Non-Goals

**Goals:** pure, tested parse function shared by React and the boot script's logic; no persistence side effect.

**Non-Goals:** keeping `?theme=` in the URL across in-app navigation (links don't carry it; the in-memory override does the job); overriding other settings (filters, accent) via URL; a "copy link with theme" button.

## Decisions

1. **`readThemeOverride(search: string): ThemePreference | null`** — `new URLSearchParams(search).get('theme')`, trimmed, matched case-insensitively against the selector options (`THEME_OPTIONS` / `THEME_NAMES`), returning the canonical name. `URLSearchParams` already decodes `%20` and `+`. Lives in `themes.ts` (dependency-free).

2. **Initial state, not a separate layer.** Theme state init becomes `() => readThemeOverride(window.location.search) ?? loadThemePreference()`. Persistence already happens only in the selector handler, so "never saved" is satisfied with no flag — *as long as nothing else saves on mount*. A unit test guards that (`tvdash-settings` unchanged after mount with `?theme=`).
   *Alternative:* an `override` state that wins over the preference — needed only if the preference could change underneath (cross-tab sync). With `sync-settings-across-tabs`, the subscriber must skip applying synced themes while the override is active → keep a `fromUrl` ref set at init and cleared by the selector handler; documented in that change's consumer.

3. **Read at startup only.** `window.location.search` at module init time of the provider; in-app navigations don't re-read, so the override sticks (spec "lifetime"). A full reload with the parameter still in the address bar re-applies it — expected.

4. **Boot script:** before reading storage, `new URLSearchParams(location.search).get('theme')`, lowercase-match against the injected theme map's keys. Same logic as decision 1, duplicated in ~3 lines of generated JS (the script can't import modules); a unit test runs the generated script string in jsdom with sample URLs to keep them in sync.

5. **e2e fixture option** `theme?: string` — when set, the `page` fixture's first `goto` appends `?theme=`; tests use it instead of clicking the selector.

## Risks / Trade-offs

- [Users share a URL with `?theme=` and recipients see a theme they didn't choose] → Only for that visit, never saved; intended.
- [Cross-tab sync overwriting the override] → Handled per decision 2 when both changes exist.
- [Generated script and TS parser drift] → Covered by the jsdom test of the generated script.
