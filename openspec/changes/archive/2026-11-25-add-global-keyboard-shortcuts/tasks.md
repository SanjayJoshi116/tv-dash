## 1. Hotkey hook

- [x] 1.1 New `src/hooks/useHotkeys.ts`: single keys + `g x` sequences (1000 ms window), map in a ref, `enabled` option, `isTypingTarget` + modifier/`isComposing` suppression
- [x] 1.2 New `src/hooks/useHotkeys.test.ts` (`// @vitest-environment jsdom`, fake timers): single key fires; sequence fires; sequence times out; suppressed in input/textarea/contenteditable/combobox; suppressed with Ctrl/Meta/Alt; Shift+`?` fires; disabled → nothing; unmount removes listener

## 2. Shortcuts

- [x] 2.1 Export the shortcut list (`{ keys, label }[]`) from one module (e.g. `src/constants/shortcuts.ts`)
- [x] 2.2 `AppLayout`: register `g d` / `g s` / `g t` (navigate), `t` (next theme via the selector's setter), `?` (open help), `/` (focus or navigate with `state.focusSearch`)
- [x] 2.3 `ShowsPage` / `FilterBar`: focus `#shows-search` when mounted with `location.state.focusSearch`; `/` on Shows calls `preventDefault` before focusing
- [x] 2.4 New `src/components/ShortcutsHelp.tsx` (antd `Modal`, inline styles, theme colors only); hook disabled while open

## 3. Tests & docs

- [x] 3.1 New `e2e/shortcuts.spec.ts`: `g s` / `g t` / `g d` navigation; `/` from Dashboard focuses search with no `/` typed; typing "gst" in search doesn't navigate; `t` changes theme and persists; `?` opens and Escape closes the cheat sheet
- [x] 3.2 `CLAUDE.md` (Key Conventions: global keys go through `useHotkeys`; Tests list), `IDEAS.md` (move idea to Completed), `CHANGELOG.md`, `features.txt`
- [x] 3.3 Run `npm run lint`, `npm test`, `npm run build`, `npm run e2e`
