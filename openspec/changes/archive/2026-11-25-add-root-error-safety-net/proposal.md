## Why

`RouteErrorBoundary` sits inside `AppLayout`, so it only protects pages. A render error in `ThemeProvider`, `ConfigProvider`, `TvDataProvider`, the router or `AppLayout` itself unmounts everything and leaves a blank page with no way out — and the most likely trigger, bad saved state, survives a reload. `IDEAS.md` → Entry / root P1 ("Root safety net + settings reset").

## What Changes

- A top-level error boundary around the whole app. Its fallback is plain (no Ant Design, no theme context — those may be what crashed), readable in light and dark, and shows the error message as text.
- The fallback offers **Reload** and **Reset saved settings** (clears the dashboard's saved settings and sidebar state, then reloads).
- **`?reset` escape hatch:** opening any URL with `?reset` clears saved settings before the app starts, then removes the parameter from the address bar — usable even when the fallback itself can't be reached.
- Page-level errors keep going to the existing in-shell `RouteErrorBoundary` (unchanged).

## Capabilities

### New Capabilities
- `app-recovery`: what the user sees and can do when the app shell fails to render, and how saved state can be reset.

### Modified Capabilities
<!-- none -->

## Impact

- `src/main.tsx` (boundary + `?reset` handling before render), new `src/components/RootErrorBoundary.tsx`, `src/utils/settings.ts` (`resetSettings()` clearing `tvdash-settings` and `tvdash-sidebar`).
- The sidebar key stays owned by `AppLayout`; `settings.ts` only needs its name for the reset — documented in `CLAUDE.md`.
- Tests: unit tests for `resetSettings` / `?reset` handling; e2e that forces a shell crash (module interception) and exercises both buttons.
- Docs: `CLAUDE.md` (provider stack diagram, Routing / errors, localStorage), `features.txt`, `IDEAS.md`, `CHANGELOG.md`.
