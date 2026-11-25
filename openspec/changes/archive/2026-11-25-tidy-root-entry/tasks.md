## 1. Test setup

- [x] 1.1 Delete `src/setupTests.ts`; remove `setupFiles` from `vitest.config.ts`
- [x] 1.2 Any jsdom test using DOM matchers (e.g. `App.test.tsx` from `add-root-smoke-test`, if present) imports `@testing-library/jest-dom/vitest` itself
- [x] 1.3 If nothing imports jest-dom: remove `@testing-library/jest-dom` from `devDependencies`, run `npx -y npm@10 install`, confirm `grep vitest/node_modules/esbuild package-lock.json` still matches

## 2. Mount error

- [x] 2.1 `main.tsx`: replace `getElementById('root')!` with an explicit check throwing `#root element missing in index.html`

## 3. Wrap-up

- [x] 3.1 `CLAUDE.md` Tests section (no global setup file; jest-dom per jsdom test via `@testing-library/jest-dom/vitest`), `IDEAS.md` (move both ideas to Completed), `CHANGELOG.md`
- [x] 3.2 Run `npm run lint`, `npm test`, `npm run build`, `npm run e2e`
