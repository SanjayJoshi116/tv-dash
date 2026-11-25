## Why

Two small rough edges in the root files. `src/setupTests.ts` loads `@testing-library/jest-dom` into every Vitest run although the default environment is `node` and no test uses a jest-dom matcher — dead setup that suggests DOM matchers are available everywhere. And `main.tsx` mounts with `document.getElementById('root')!`: if `#root` is ever missing (edited `index.html`, wrong template), React throws an opaque "Target container is not a DOM element" instead of saying what's wrong. `IDEAS.md` → Entry / root P3 ("`setupTests.ts` cleanup", "Clear mount error").

## What Changes

- Remove the global jest-dom setup: delete `src/setupTests.ts` and the `setupFiles` entry in `vitest.config.ts`. A jsdom test that wants DOM matchers imports `@testing-library/jest-dom/vitest` itself (documented next to the existing `// @vitest-environment jsdom` rule).
- Keep or drop the `@testing-library/jest-dom` devDependency depending on whether any test (incl. `add-root-smoke-test`, if applied) imports it; drop it if unused, regenerating the lock with `npx -y npm@10 install`.
- `main.tsx`: explicit check — `const el = document.getElementById('root'); if (!el) throw new Error('#root element missing in index.html')`.
- No user-visible behavior change (hence `skip_specs`).

## Capabilities

### New Capabilities
<!-- none: test tooling + a clearer developer error -->

### Modified Capabilities
<!-- none -->

## Impact

- `src/setupTests.ts` (deleted), `vitest.config.ts`, `src/main.tsx`; possibly `package.json` / `package-lock.json`.
- If `add-root-error-safety-net` is applied first, the explicit throw happens before any React root exists — it surfaces in the console / blank page; that's acceptable for a broken build artifact (not a runtime state a user can cause).
- Docs: `CLAUDE.md` (Tests: no global setup; jest-dom per file), `IDEAS.md`, `CHANGELOG.md`.
