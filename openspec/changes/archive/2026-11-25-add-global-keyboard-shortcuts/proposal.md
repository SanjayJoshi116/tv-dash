## Why

Everything in the dashboard is mouse- or touch-driven: switching pages means reaching for the sidebar, searching means clicking the Shows search box, and the theme sits in a small header select. Keyboard users and power users have no fast path, and the planned Components ideas (quick switcher, grid arrow-key navigation) would each need their own key handling. `IDEAS.md` → Entry / root P3 ("Global keyboard shortcuts").

## What Changes

- Global shortcuts, active on every page: `g d` → Dashboard, `g s` → Shows, `g t` → Statistics, `/` → focus Shows search (navigating to Shows first if needed), `t` → cycle to the next theme, `?` → open a cheat-sheet dialog listing all shortcuts.
- Shortcuts are ignored while the user types in a text field / select / editable element, and when Ctrl / Meta / Alt is held (browser and OS shortcuts keep working).
- One reusable `useHotkeys(map)` hook (single-key and two-key `g x` sequences) so later features (quick switcher, grid navigation — Components) reuse it instead of adding listeners.
- A cheat-sheet modal (antd `Modal`) opened by `?`; the `?` shortcut itself is listed in the README and `features.txt`.
- No change to existing mouse/touch behavior.

## Capabilities

### New Capabilities
- `keyboard-shortcuts`: global navigation / search / theme shortcuts, typing-safe suppression, and the shortcut cheat sheet.

### Modified Capabilities
<!-- none -->

## Impact

- New `src/hooks/useHotkeys.ts` (+ `useHotkeys.test.ts`, jsdom), new `src/components/ShortcutsHelp.tsx` (modal), `src/components/AppLayout.tsx` (registers the map — it already has `navigate` and the theme callback), `src/pages/ShowsPage.tsx` / `FilterBar.tsx` (focus target `#shows-search`, possibly via a `?focus=search` handoff).
- Theme cycling uses `THEME_NAMES` order; if `add-system-theme-and-color-scheme` / `refactor-typed-theme-provider` land first, it cycles the preference list through `useThemeSetting()` instead of props.
- New e2e spec `e2e/shortcuts.spec.ts`.
- Docs: `CLAUDE.md` (Key Conventions: hotkeys go through `useHotkeys`), `IDEAS.md`, `CHANGELOG.md`, `features.txt`.
