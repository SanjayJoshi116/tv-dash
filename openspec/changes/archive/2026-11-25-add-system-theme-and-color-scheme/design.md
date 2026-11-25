## Context

- `App.tsx` owns `activeThemeName` (from `loadThemeName()` → `getSettings().themeName`, falling back to `DEFAULT_THEME_NAME = 'Default Dark'`) and passes it + `onThemeChange` through `AppLayout` to `ThemeToggle`. `THEMES` is `Record<string, Theme>`.
- `index.html` has exactly one CSS rule and no background; `Content` (not window) is the scroll container, so its scrollbar is the most visible native control.
- Conventions that constrain this: theme colors only from `Theme`; all localStorage via `settings.ts`; 100% inline styles (no CSS files in `src/`).
- Requirements: `specs/theming/spec.md`.

## Goals / Non-Goals

**Goals:**
- Separate the *preference* (`'System' | <theme name>`) from the *resolved* theme everywhere it matters.
- One source of truth for per-theme document colors, used by both the boot script and React.

**Non-Goals:**
- Mapping System to Dracula or letting the user pick which dark/light theme System uses (possible later).
- Moving theme state into a provider (`AppThemeProvider` is a separate P2 idea); this change keeps state in `App`.
- `<meta name="theme-color">` (comes with the PWA idea).

## Decisions

1. **Preference vs resolved theme.** `App` stores `themePreference: ThemePreference` (`'System' | string` validated against `THEMES`). The resolved theme is `resolveTheme(pref, prefersDark)` — a pure function in `themes.ts` (`'System'` → `prefersDark ? 'Default Dark' : 'Default Light'`, else the named theme). `ThemeToggle` shows and sets the preference; `ThemeProvider` / `ConfigProvider` get the resolved `Theme`.
   *Alternative:* store the resolved name and a separate `followSystem` flag — two fields that can disagree; rejected.

2. **OS preference as React state.** A small `useMediaQuery('(prefers-color-scheme: dark)')` built on `useSyncExternalStore` (`matchMedia(...).addEventListener('change')`) — no effect + setState, so it sidesteps the project's `set-state-in-effect` / StrictMode issues. The listener is always attached (cheap); resolution only uses it for `'System'`. It also serves the later reduced-motion change.

3. **Document sync in React.** One `useEffect` in `App` keyed on the resolved theme sets `document.documentElement.style.colorScheme` and `.backgroundColor` (`theme.isDark ? 'dark' : 'light'`, `theme.contentBg`). Side effect on the DOM only — no state, no lint suppression needed.

4. **Boot script generated from `themes.ts`.** A Vite plugin in `vite.config.ts` (`transformIndexHtml`, both dev and build) injects an inline `<script>` into `<head>` built from `THEMES`: a JSON map `{ name → [colorScheme, bg] }` plus ~10 lines that read `localStorage['tvdash-settings']`, pick `themeName`, resolve `'System'`/missing/invalid via `matchMedia`, and set the two style properties — all in `try/catch` so a storage error falls back to the OS resolution. `vite.config.ts` imports `src/themes.ts` (pure data, no React), so `tsconfig.node.json` adds it to `include`.
   *Alternatives:* hand-written map in `index.html` + a unit test comparing it to `THEMES` — two sources, drift caught only by tests; reading CSS variables — the project has no CSS layer. Generation keeps one source.

5. **`'System'` constant and selector order.** `SYSTEM_THEME = 'System'` exported from `themes.ts`; `THEME_OPTIONS = [SYSTEM_THEME, ...THEME_NAMES]` drives `ThemeToggle`. `DEFAULT_THEME_NAME` stays as the fallback *resolved* theme for `ThemeContext`'s default value; the default *preference* becomes `SYSTEM_THEME`.

6. **Documented exceptions.** `CLAUDE.md` Styling: `index.html` holds one CSS rule **and** one generated boot script. localStorage: the boot script reads `tvdash-settings` directly (runs before any module) — read-only, never writes.

## Risks / Trade-offs

- [Existing users who never picked a theme had Default Dark implicitly; on a light OS they now get Default Light] → Intended per spec; anyone who chose Default Dark explicitly has it saved and keeps it.
- [Boot script and React disagree for a frame (e.g. settings changed in another tab)] → React's effect overwrites on mount; at worst one repaint, no flash of the wrong *app* UI.
- [Inline script blocked by a future Content-Security-Policy] → None today; if a CSP is added, use a hash for the generated script (stable per build).
- [Plugin makes `vite.config.ts` import app source] → `themes.ts` is dependency-free data; keep it that way (comment at top of `themes.ts`).

## Migration Plan

No data migration: `themeName` values stay valid; `"System"` is just a new valid value. Rollback = revert; a saved `"System"` then fails validation and falls back to Default Dark (old behavior).
