## Why

The root files (`main.tsx`, `App.tsx`, `ThemeContext.tsx`, `themes.ts`) have no unit coverage; only the e2e suite exercises them, and only through a real browser. The next P2 changes (typed themes + `AppThemeProvider` extraction, semantic colors, cross-tab sync, data router) all rewrite root code, so a fast jsdom safety net should exist **before** them. `IDEAS.md` → Entry / root P2 ("Root smoke test"), done first on purpose.

## What Changes

- A jsdom smoke test that renders the real `<App />` with a stubbed `fetch` (CSV from the shared fixtures) and asserts each route mounts its page: `/`, `/shows`, `/shows/:id`, `/stats`, an unknown URL.
- Assertions on saved-state handling at the root: a corrupt / unknown saved `themeName` falls back to the default preference (System after `add-system-theme-and-color-scheme`, Default Dark before it); a valid saved theme is applied.
- Test-only: no runtime code or behavior changes (hence no spec delta).
- `setupTests.ts` cleanup from Entry / root P3 folded in only if it's needed to make the jsdom test work — otherwise left alone.

## Capabilities

### New Capabilities
<!-- none: tests only -->

### Modified Capabilities
<!-- none -->

## Impact

- New `src/App.test.tsx` (jsdom). Possibly a tiny change in how `App` gets its router (see design) — no behavior change.
- `vitest.config.ts` unchanged (`include` already matches `src/**/*.test.tsx`).
- Docs: `CLAUDE.md` Tests list + count, `IDEAS.md`, `CHANGELOG.md`.
