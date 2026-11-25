## Why

The dashboard is a static app over one CSV and is already built mobile-first (bottom nav), but it can't be installed and shows nothing without a network. A service worker would also make deploys safer: today a stale tab whose hashed chunks were replaced fails on navigation (`RouteErrorBoundary` catches it), while precached chunks keep the running version complete. `IDEAS.md` → Entry / root P2 ("Installable PWA / offline").

## What Changes

- **Installable:** web app manifest (name, icons incl. maskable, standalone display, start URL `/`) so browsers offer "Install" / "Add to Home Screen".
- **Offline:** a service worker precaches the built app (HTML, JS, CSS, icons). `tv_series.csv` is fetched **network-first** with a short timeout, falling back to the last cached copy; when offline the app shows a small notice that it's displaying saved data.
- **Updates:** when a new version is deployed, an open app shows "New version available — Reload" instead of silently swapping code mid-session.
- **`<meta name="theme-color">`** follows the active theme (browser UI / installed-app title bar).
- Posters (TMDB images) are **not** cached offline in this change — offline cards use the existing poster fallback.
- Service worker is production-only; dev server behavior is unchanged.

## Capabilities

### New Capabilities
- `offline-support`: installability, what works without a network, CSV freshness rules, and how app updates are offered.

### Modified Capabilities
<!-- none in openspec/specs/ -->

## Impact

- New dev dependency `vite-plugin-pwa` (Workbox); `vite.config.ts` plugin config; app icons in `public/` (generated from `tv.svg`); update prompt component in the shell; theme effect sets `theme-color`.
- E2E: new Playwright project against `vite preview` (service workers don't run on the dev server here) — `playwright.config.ts` + CI job step.
- `.gitignore`: `dev-dist/` (plugin dev output).
- Privacy: the CSV is cached in the browser's Cache Storage (same machine/profile as localStorage today). `?reset` (from `add-root-error-safety-net`) clears settings only, not this cache — documented.
- Docs: `README.md` (install / offline), `CLAUDE.md`, `features.txt`, `IDEAS.md`, `CHANGELOG.md`.
