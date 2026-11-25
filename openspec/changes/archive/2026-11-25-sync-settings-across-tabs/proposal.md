## Why

With two dashboard tabs open, changing the theme in one leaves the other on the old theme until it's reloaded — and its next unrelated save can't undo the change only because `saveSetting` re-reads storage before writing. Tabs should agree on shared preferences. `IDEAS.md` → Entry / root P2 ("Cross-tab sync").

## What Changes

- A theme change in one tab (including choosing System) applies to every other open dashboard tab immediately, without reload.
- `settings.ts` gains a subscription helper (`subscribeSettings`) built on the browser `storage` event, so future persisted settings can opt in the same way.
- Saved **Shows filters are deliberately not applied live** to a tab that has the Shows page open (it would overwrite what the user is typing); they are picked up the next time that page mounts, as today. Sidebar state stays per-tab-session as today.
- Corrupt or unknown values arriving from another tab are ignored (same validation as on load).

## Capabilities

### New Capabilities
- `settings-sync`: which saved preferences propagate between open tabs, when, and how invalid values are handled.

### Modified Capabilities
<!-- none in openspec/specs/ -->

## Impact

- `src/utils/settings.ts` (`subscribeSettings(listener)`), theme owner (`App` today, `AppThemeProvider` after `refactor-typed-theme-provider`).
- Tests: unit test for `subscribeSettings` (dispatching `StorageEvent` in jsdom); e2e with two pages in one browser context.
- Docs: `CLAUDE.md` localStorage section, `features.txt`, `IDEAS.md`, `CHANGELOG.md`.
