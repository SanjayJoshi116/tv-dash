## Why

The build only works at a domain root: `BrowserRouter` has no `basename` and the CSV is fetched from the absolute `/tv_series.csv`. Hosting under a sub-path — the common free option, GitHub Pages at `/<repo>/` — loads a blank "not found" page and a 404 for the data. A build-time base path (`vite build --base=/tv-dash/`) should be the only thing that changes. `IDEAS.md` → Entry / root P3 ("Base path from `import.meta.env.BASE_URL`").

## What Changes

- Router `basename` comes from `import.meta.env.BASE_URL` (trailing slash stripped; `/` at root → no change for current deployments).
- The CSV URL is built from `BASE_URL` once, in one exported constant (`CSV_URL`), used by `useTvData`; the e2e route interception keeps matching it (glob already path-agnostic) and imports the file name from the same module.
- Static asset links in `index.html` (`/tv.svg`) are already rewritten by Vite for `base`; verified, not changed. Poster URLs are absolute TMDB URLs — unaffected.
- Docs: how to build for a sub-path (`npm run build -- --base=/repo/`) and the GitHub Pages deep-link fallback (`404.html` = copy of `index.html`), with an optional `build:pages` script that does the copy.
- No behavior change when served at `/`.

## Capabilities

### New Capabilities
- `subpath-hosting`: the built app works identically whether served from the domain root or a configured sub-path.

### Modified Capabilities
<!-- none -->

## Impact

- `src/App.tsx` (`basename`), new `src/constants/paths.ts` (`BASE_PATH`, `CSV_FILE`, `CSV_URL`), `src/hooks/useTvData.ts` (+ its test: expects `CSV_URL`), `e2e/fixtures.ts` (imports `CSV_FILE`).
- If `add-pwa-offline` is applied: its manifest `start_url` / `scope` and runtime-caching URL pattern must use the same base (that plugin reads Vite's `base`, so mostly automatic — verify).
- New e2e project or CI step building with `--base=/sub/` and running a smoke test with `vite preview` (see design).
- Docs: README (deploying under a sub-path, GitHub Pages `404.html`), `CLAUDE.md` (CSV path constant; never hardcode `/…` app URLs), `IDEAS.md`, `CHANGELOG.md`.
