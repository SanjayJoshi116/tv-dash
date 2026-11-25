## Context

Provider stack: `ThemeProvider → ConfigProvider → TvDataProvider → BrowserRouter → Routes → AppLayout → RouteErrorBoundary → Suspense → Pages`. `RouteErrorBoundary` (class, resets on pathname change) only wraps `<Outlet />`. Persistence: `tvdash-settings` via `settings.ts`, plus `tvdash-sidebar` read/written directly in `AppLayout` (intentional isolation). E2E fixtures fail any test that logs a console error. Requirements: `specs/app-recovery/spec.md`.

## Goals / Non-Goals

**Goals:** blank-page-proof shell; one function that knows every storage key to clear; recovery that works even if Ant Design or the theme is the thing that broke.

**Non-Goals:** error reporting/telemetry; auto-retry of the shell; replacing `RouteErrorBoundary` (pages keep in-layout errors); handling errors thrown in event handlers / async code (React boundaries don't catch those — unchanged).

## Decisions

1. **`RootErrorBoundary` wraps `<App />` in `main.tsx`** (inside `StrictMode`). Class component with `getDerivedStateFromError` + `componentDidCatch` (`console.error`). No reset-on-navigation — the router is inside it, so recovery is reload-based.
   *Alternative:* put it in `App` above `ThemeProvider` — would not catch errors in `App`'s own render (theme resolution, memo); rejected.

2. **Fallback uses plain elements + system colors.** `<main>` with inline styles using CSS system colors (`Canvas`, `CanvasText`, `ButtonFace`, `ButtonText`) and `color-scheme: light dark` on the container, so it follows the OS without the theme or antd. Native `<button>`s (keyboard + a11y for free). Error message rendered as React text (escaped), never as HTML.

3. **`resetSettings()` in `settings.ts`** removes `tvdash-settings` and `tvdash-sidebar` (each in its own `try`). The sidebar key name moves to an exported constant in `settings.ts` that `AppLayout` imports — `AppLayout` still reads/writes it directly (isolation kept), but the name has one definition.
   *Alternative:* `localStorage.clear()` — would wipe other apps on the same origin (e.g. `localhost:5199` during dev); rejected.

4. **`?reset` handled in `main.tsx` before `createRoot`**: `const url = new URL(location.href); if (url.searchParams.has('reset')) { resetSettings(); url.searchParams.delete('reset'); history.replaceState(history.state, '', url) }`. Runs before React and before the theme boot script would matter on the *next* load (the current page's boot script already ran — first paint may use the old theme once; acceptable, and with the System-theme change the React effect corrects it immediately).

5. **E2E forcing a crash without test hooks in app code:** Playwright `page.route('**/src/components/AppLayout.tsx*', …)` returns a module whose `AppLayout` throws. Vite dev serves source modules at those URLs, so no production code path exists for testing. The spec opts out of the console-error guard for the expected `console.error` (fixture option, e.g. `allowConsoleErrors: [/boom/]`).

## Risks / Trade-offs

- [Module interception depends on Vite dev URL shapes] → Pattern with trailing `*` covers `?t=`/`?v=` queries; if Vite changes, only this spec breaks (clear failure).
- [A crash in `main.tsx` itself or in module evaluation isn't caught by any React boundary] → Out of scope; `?reset` still works because it runs before render (unless the crash is in `settings.ts` itself).
- [Reset also clears the sidebar preference users didn't ask about] → Button label and spec say "all saved settings"; it's an escape hatch.
