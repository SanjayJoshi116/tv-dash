## Context

`AppLayout` already owns `navigate`, the pathname and the theme callback (`onThemeChange` / `activeThemeName` props, or `useThemeSetting()` after `refactor-typed-theme-provider`). Shows search is `Input.Search id="shows-search"` inside `FilterBar` (rendered by `ShowsPage`). `Content` is the scroll container; antd `Select` / `Input` render real `<input>` elements. Requirements: `specs/keyboard-shortcuts/spec.md`.

## Goals / Non-Goals

**Goals:** one tiny, dependency-free hotkey hook reusable by later features; the six shortcuts; cheat sheet.

**Non-Goals:** user-configurable bindings; quick switcher / grid navigation (Components ideas — they only reuse the hook); shortcuts on mobile (no hardware keyboard assumed, but nothing breaks if one is attached).

## Decisions

1. **Own hook, no library.** `useHotkeys(map: Record<string, (e: KeyboardEvent) => void>, opts?: { enabled?: boolean })` with keys like `'/'`, `'t'`, `'?'`, `'g d'`. One `keydown` listener on `window`; the map is kept in a ref so callers can pass an inline object without re-subscribing. Sequence state = `{ prefix, at }` reset after 1000 ms or on any non-matching key. Matching on `e.key` (layout-aware: `?` and `/` are whatever the keyboard produces), never `e.code`.
   *Alternative:* `react-hotkeys-hook` / `tinykeys` — fine libraries, but ~40 lines of our own code avoids a dependency for six bindings.

2. **Suppression** in one `isTypingTarget(e.target)` helper: `input` (except `type` checkbox/radio/button), `textarea`, `select`, `[contenteditable]`, `[role="combobox"]`, `[role="textbox"]`; plus `e.ctrlKey || e.metaKey || e.altKey`, `e.isComposing`, `e.repeat` for sequences. Shift is allowed (`?` needs it).

3. **Registration in `AppLayout`** — the shell is mounted on every route and has everything needed. The hook is disabled (`enabled: false`) while the cheat-sheet modal is open; the modal's own Escape handling (antd) closes it and antd restores focus.

4. **`/` search handoff:** if already on `/shows`, `preventDefault()` then `document.getElementById('shows-search')?.focus()`. Otherwise `navigate('/shows', { state: { focusSearch: true } })`; `ShowsPage` reads `location.state?.focusSearch` once on mount and focuses the field (passes `autoFocus` to `FilterBar`'s search). Using router state, not a query param, keeps the URL clean and doesn't re-focus on reload.
   *Alternative:* a focus-request context — more plumbing for one consumer.

5. **Theme cycle** reads the selector's option list (`THEME_NAMES`, or the preference list incl. `System` if that change landed) and calls the same setter the selector uses, so persistence is shared.

6. **Cheat sheet** = `ShortcutsHelp` (antd `Modal` + `Descriptions` / table of `<kbd>`-styled keys, inline styles). The shortcut list is one exported array `{ keys, label }[]` used both by the modal and by `AppLayout`'s map labels, so docs and behavior can't drift.

## Risks / Trade-offs

- [`t` / `g` conflict with antd Select type-to-search] → Select's search input is an `<input>` / `role="combobox"` → suppressed.
- [Non-US layouts where `/` needs Shift] → Matching `e.key` handles this; Shift is not treated as a modifier.
- [Screen-reader single-key navigation (browse mode) uses letter keys] → Screen readers intercept keys in browse mode before the page sees them; in focus mode our keys apply only outside form fields. Accepted; documented in the cheat sheet.
- [StrictMode double effect] → Listener added/removed symmetrically in one effect; no state set in the effect body.
