## Context

Vite exposes `import.meta.env.BASE_URL` (`/` by default, `/<base>/` with `--base` / `base` config) and rewrites asset URLs in `index.html` and imports. `public/` files are served under the base. Today: `fetch('/tv_series.csv')` in `useTvData.ts`, `<BrowserRouter>` without `basename`, e2e intercepts `**/tv_series.csv`. Requirements: `specs/subpath-hosting/spec.md`.

## Goals / Non-Goals

**Goals:** one constant per URL; zero-config root deploys; a test that proves the sub-path build works.

**Non-Goals:** hash routing; runtime-configurable base (decided at build time); a GitHub Actions deploy workflow (doc only; can follow); changing `vite.config.ts` `base` default.

## Decisions

1. **`src/constants/paths.ts`:**
   ```ts
   export const BASE_PATH = import.meta.env.BASE_URL.replace(/\/+$/, '') // '' at root
   export const CSV_FILE = 'tv_series.csv'
   export const CSV_URL = `${import.meta.env.BASE_URL}${CSV_FILE}`
   ```
   `<BrowserRouter basename={BASE_PATH || undefined}>`. String concat rather than `new URL(..., BASE_URL)` — `BASE_URL` may be relative (`./`) for some builds and `new URL` needs an absolute base; Vite guarantees the trailing slash.
   *Alternative:* put `basename` / CSV URL in `vite.config.ts` `define` — redundant with `BASE_URL`.

2. **e2e keeps matching by glob** `**/${CSV_FILE}`. `CSV_FILE` lives in a tiny `src/constants/csvFile.ts` with no `import.meta.env` access (re-exported by `paths.ts`), so `e2e/fixtures.ts` can import it under Playwright, where `import.meta.env` is undefined.

3. **Sub-path verification:** an extra Playwright project `subpath` with its own `webServer`: `vite build --base=/sub/ --outDir dist-sub && vite preview --outDir dist-sub --port 5299 --base=/sub/`, running a small `e2e/subpath.spec.ts` (Dashboard loads, nav URL under `/sub/`, deep link to a show, unknown route → NotFound) with the synthetic CSV. Kept out of the default project so normal `npm run e2e` stays fast; CI runs it in the existing e2e job via `--project=subpath`. `vite preview` serves `index.html` for unknown paths, emulating the SPA fallback.

4. **GitHub Pages fallback** documented, plus optional `"build:pages": "vite build --base=/tv-dash/ && node scripts/copy-404.mjs"` (copies `dist/index.html` → `dist/404.html`). Script only — no Pages deployment in this change.

## Risks / Trade-offs

- [Another hardcoded absolute app URL appears later] → `CLAUDE.md` rule + the sub-path e2e catches it (a root request would 404 under preview).
- [`basename` with trailing-slash quirks: `/tv-dash` vs `/tv-dash/`] → React Router v7 matches both; spec scenario + e2e cover opening `/sub` and `/sub/`.
- [`useMatch('/shows/:id')` / `normalizedPath` in `AppLayout`] → Router hooks return basename-relative paths, so unchanged; covered by the nav-highlight assertion in the sub-path spec.
- [Extra build in CI adds time] → One build (~seconds); acceptable.
