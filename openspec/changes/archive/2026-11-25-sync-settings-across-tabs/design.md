## Context

`settings.ts`: `getSettings()` (always a plain object) and `saveSetting(key, value)` (read-merge-write, swallows errors). Theme preference lives in `App` (or `AppThemeProvider` after the refactor change); ShowsPage loads filters once on mount (`loadFilters`) and debounces saves. Browsers fire `storage` only in *other* documents of the same origin. Requirements: `specs/settings-sync/spec.md`.

## Goals / Non-Goals

**Goals:** a generic, tested subscription in `settings.ts`; theme wired to it.

**Non-Goals:** live filter sync (spec explains why); `BroadcastChannel`; syncing the separate `tvdash-sidebar` key; sync across devices.

## Decisions

1. **`subscribeSettings(listener: (settings) => void): () => void`** in `settings.ts` — adds a `storage` listener filtered to `e.key === 'tvdash-settings'` (and `e.key === null` for `localStorage.clear()` / `resetSettings`), then calls the listener with the parsed `newValue` — `{}` when the key was removed (`newValue === null`, i.e. a reset), and **not at all** when the new value is unparseable or not a plain object (spec: corrupt values are ignored, so they must not look like a reset). `getSettings()` and the subscription share one parser. Returns the unsubscribe function. All storage access stays in `settings.ts` (convention).
   *Alternative:* `BroadcastChannel` — needs explicit posting on every save and doesn't see external edits; `storage` is free and exact for localStorage.

2. **Theme consumer** validates with the same function used on load (`loadThemePreference` / `isThemeName`) and only sets state when the value is valid **and** different. Implemented with `useEffect(() => subscribeSettings(...), [])`; the setState happens in an event callback, not in the effect body, so `react-hooks/set-state-in-effect` doesn't apply.

3. **Requirement 4 is already met** by `saveSetting`'s read-merge-write; covered by a unit test rather than new code.

## Risks / Trade-offs

- [Rapid toggling in two tabs] → Last write wins (storage is the source of truth); no loop, because a tab never receives its own `storage` events and applying a synced value doesn't re-save it.
- [`?reset` / `resetSettings()` in one tab] → Others receive `key === 'tvdash-settings'` with `newValue === null` → `getSettings()` → `{}`. That is "no saved theme" (not an invalid value), so they switch to the default preference — a reset propagates, matching user intent. Only *invalid* values are ignored.
