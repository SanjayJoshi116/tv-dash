## 1. Paths

- [x] 1.1 New `src/constants/csvFile.ts` (`CSV_FILE`, no env access) and `src/constants/paths.ts` (`BASE_PATH`, `CSV_URL`, re-export `CSV_FILE`)
- [x] 1.2 `useTvData.ts`: fetch `CSV_URL`; update `useTvData.test.ts` expectation
- [x] 1.3 `App.tsx`: `<BrowserRouter basename={BASE_PATH || undefined}>`
- [x] 1.4 `e2e/fixtures.ts`: route glob from `CSV_FILE`; grep `src/` for other absolute `'/…'` fetch/asset URLs (none expected besides `index.html`, which Vite rewrites)

## 2. Sub-path test

- [x] 2.1 `playwright.config.ts`: `subpath` project + second `webServer` (build `--base=/sub/` to `dist-sub`, `vite preview` on 5299); default project unchanged
- [x] 2.2 New `e2e/subpath.spec.ts`: Dashboard loads data, CSV request URL under `/sub/`, nav → `/sub/shows`, deep link `/sub/shows/1`, `/sub/nope` → NotFound, `/sub` without slash works
- [x] 2.3 CI e2e job runs `--project=subpath` too; add `dist-sub/` to `.gitignore`
- [x] 2.4 If `add-pwa-offline` is applied: check manifest `start_url` / `scope` / SW cache patterns under `/sub/`

## 3. Docs

- [x] 3.1 README: deploying under a sub-path, GitHub Pages `404.html` fallback; optional `build:pages` script + `scripts/copy-404.mjs`
- [x] 3.2 `CLAUDE.md` (Architecture: CSV URL from `paths.ts`, never hardcode absolute app URLs; Tests: subpath project), `IDEAS.md`, `CHANGELOG.md`
- [x] 3.3 Run `npm run lint`, `npm test`, `npm run build`, `npm run e2e` (both projects)
