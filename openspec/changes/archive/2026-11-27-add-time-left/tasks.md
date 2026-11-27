## 1. Helpers

- [x] 1.1 `derive.ts`: `episodesLeft`, `minutesLeft`, `nextSeason`, `compareAscNullsLast`
- [x] 1.2 `derive.test.ts`: 10 × 50min with 6 watched → 200 / 4; unknown runtime → `null`; over-watched → 0; next season with a gap, none watched → 1, all watched → `null`, unknown seasons → `null`; ascending nulls-last comparator

## 2. Show Detail

- [x] 2.1 Watch History card: "Time left" line (`formatRuntime(minutesLeft)` + episodes) and "Next" season line, each hidden per the spec

## 3. Dashboard

- [x] 3.1 Continue Watching: `Segmented` order toggle (Most watched default / Least time left), sort before slicing, ties by % watched; row text gains `· Xh Ym left` when known

## 4. Tests

- [x] 4.1 e2e: Show Detail time left + next season for a known `TEST_CSV` row, hidden for an unknown-runtime row and a finished row; Continue Watching toggle reorders (first row changes as expected), unknown-runtime row last; row text doesn't overflow at 375 / 768 / 1280px. Add `TEST_CSV` rows via `csv()` if needed

## 5. Verify & docs

- [x] 5.1 `npm run lint`, `npm test`, `npm run build`, `npm run e2e`
- [x] 5.2 `CLAUDE.md` (derive helpers / Tests), `IDEAS.md` (Pages P1 "Time left" → Completed — all Pages P1 done), `CHANGELOG.md`, `features.txt`, README if user-facing, version bump
