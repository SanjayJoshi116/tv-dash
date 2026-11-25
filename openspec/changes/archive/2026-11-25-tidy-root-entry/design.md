## Context

`vitest.config.ts`: `environment: 'node'`, `globals: true`, `setupFiles: ['./src/setupTests.ts']`; `setupTests.ts` is one line, `import '@testing-library/jest-dom'` (the globals-based entry). Only `useTvData.test.ts` opts into jsdom, and it uses no jest-dom matcher. `add-root-smoke-test` (P2, unapplied) said it would fold this cleanup in only if needed.

## Goals / Non-Goals

**Goals:** no global test setup that does nothing; a self-explaining mount failure.

**Non-Goals:** switching the default environment to jsdom; adding a mount-time fallback UI for a missing `#root` (nothing to render into).

## Decisions

1. **Per-file opt-in** via `import '@testing-library/jest-dom/vitest'` (the Vitest-specific entry: extends Vitest's `expect` and its types without relying on `globals`).
   *Alternative:* keep `setupTests.ts` but guard with `typeof document !== 'undefined'` — still runs for every file and keeps the misleading global; rejected.

2. **Dependency:** decided at apply time by grep — if nothing imports jest-dom after the change, remove it from `devDependencies` and regenerate the lock with npm 10 (CLAUDE.md Lock File rule; check `vitest/node_modules/esbuild` is still in the lock).

3. **Mount check** throws a plain `Error` with the exact message `#root element missing in index.html`; no `!` assertion left in `main.tsx`.

## Risks / Trade-offs

- [`add-root-smoke-test` written assuming global matchers] → Its tasks get one import line; the order between the two changes doesn't matter.
- [Lock regeneration with the wrong npm breaks `npm ci`] → Use `npx -y npm@10 install` and the grep check.
