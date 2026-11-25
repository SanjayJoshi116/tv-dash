## 1. Settings reset

- [x] 1.1 `settings.ts`: export `SIDEBAR_KEY = 'tvdash-sidebar'` and `resetSettings()` (removes `tvdash-settings` and `SIDEBAR_KEY`, each storage call in its own `try`); `AppLayout` imports `SIDEBAR_KEY` instead of its literal
- [x] 1.2 Add `consumeResetParam(location, history)` (pure-ish helper: returns whether it reset; deletes only `reset`, keeps other params + hash, `replaceState`)
- [x] 1.3 Unit tests (jsdom): `resetSettings` clears both keys and leaves unrelated keys; survives throwing storage; `consumeResetParam` for `?reset`, `?reset&foo=1`, `?foo=1` (no-op), hash preserved

## 2. Root boundary

- [x] 2.1 New `src/components/RootErrorBoundary.tsx`: class boundary, `componentDidCatch` → `console.error`; fallback with heading, error message text, "Reload" (`location.reload()`) and "Reset saved settings" (`resetSettings()` then reload) — plain elements, inline styles, system colors, `color-scheme: light dark`
- [x] 2.2 `main.tsx`: call `consumeResetParam` before `createRoot`; render `<RootErrorBoundary><App /></RootErrorBoundary>` inside `StrictMode`
- [x] 2.3 jsdom test: a throwing child renders the fallback with the message; buttons call reload / reset (stub `location.reload`)

## 3. E2E

- [x] 3.1 Fixture option to allow expected console errors (pattern list), default empty
- [x] 3.2 New `e2e/recovery.spec.ts`: intercept `AppLayout.tsx` with a throwing module → recovery screen visible with message; "Reset saved settings" clears `tvdash-settings` / `tvdash-sidebar` (seeded first) and reloads; "Reload" keeps them
- [x] 3.3 `?reset`: seed a saved filter + theme, open `/shows?reset&foo=1` → defaults applied, URL is `/shows?foo=1`
- [x] 3.4 A page-level throw (intercept `ShowsPage.tsx`) still shows the in-layout `ErrorState`, not the recovery screen

## 4. Docs

- [x] 4.1 `CLAUDE.md`: provider stack diagram (`RootErrorBoundary` outermost), Routing / errors (root vs route boundary), localStorage (`resetSettings`, `SIDEBAR_KEY` defined in `settings.ts`, `?reset`), e2e fixture option, Tests list
- [x] 4.2 `README.md` (troubleshooting: `?reset`), `features.txt`, `IDEAS.md` (move Entry / root "Root safety net" to Completed), `CHANGELOG.md`
- [x] 4.3 Run `npm run lint`, `npm test`, `npm run build`, `npm run e2e`
