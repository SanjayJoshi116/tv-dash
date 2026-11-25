## 1. Test harness

- [x] 1.1 Create `src/App.test.tsx` with `// @vitest-environment jsdom`; stub `fetch` (fixture CSV with two shows), `matchMedia`, `ResizeObserver`; clear `localStorage` and unstub globals in `afterEach`
- [x] 1.2 Helper `renderAt(path)` → `history.pushState` + `render(<App />)`

## 2. Route smoke tests

- [x] 2.1 `/` → Dashboard header + a show name from the fixture
- [x] 2.2 `/shows` and `/shows/` → Shows header + both show cards
- [x] 2.3 `/shows/<id>` → show name heading; `/shows/999999` → "Show not found"
- [x] 2.4 `/stats` → Statistics header + chart tab list
- [x] 2.5 Unknown URL → "Page not found"

## 3. Root saved-state tests

- [x] 3.1 Saved `themeName: 'Dracula'` → `#theme-select` shows Dracula
- [x] 3.2 Saved unknown name, non-string, and non-JSON `tvdash-settings` → default preference from `themes.ts`

## 4. Wrap-up

- [x] 4.1 Measure the suite (`npm test`): ~20–40s wall-clock for the file depending on machine load (mostly importing antd / Recharts / pages in jsdom); the other unit tests ~11s. Page modules preloaded in `beforeAll` after the first test timed out under a parallel full run. Accepted instead of the original "< 5s", which rendering the real `<App />` can't meet; cost noted in `CLAUDE.md`
- [x] 4.2 `CLAUDE.md` Tests section (new file + count), `IDEAS.md` (move "Root smoke test" to Completed), `CHANGELOG.md`
- [x] 4.3 Run `npm run lint`, `npm test`, `npm run build`
