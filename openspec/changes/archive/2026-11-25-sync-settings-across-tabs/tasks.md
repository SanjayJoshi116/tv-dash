## 1. Subscription

- [x] 1.1 `settings.ts`: `subscribeSettings(listener)` on the `storage` event (key `tvdash-settings` or `null`), passes `getSettings()`, returns unsubscribe
- [x] 1.2 Unit tests (jsdom): fires on a matching `StorageEvent`, ignores other keys, unparseable / non-object value → listener not called (ignored), removed key (`newValue === null`) → listener gets `{}`, unsubscribe stops calls
- [x] 1.3 Unit test: `saveSetting('filters', …)` after an external `themeName` write keeps both

## 2. Theme wiring

- [x] 2.1 Theme owner (`App` or `AppThemeProvider`): subscribe on mount; apply a synced theme only when valid and different; invalid → ignore; empty settings → default preference
- [x] 2.2 Confirm ShowsPage is untouched (filters load on mount only) and document why in a comment next to `loadFilters`

## 3. E2E

- [x] 3.1 New `e2e/settings-sync.spec.ts`: two pages in one context; change theme in page A → page B's `#theme-select` and document color scheme update without reload
- [x] 3.2 Both on `/shows`; search in A → B's search box unchanged; navigate B away and back → B shows A's search
- [x] 3.3 Write corrupt `tvdash-settings` from page A via `evaluate` → page B keeps its theme, no console error

## 4. Docs

- [x] 4.1 `CLAUDE.md` localStorage (`subscribeSettings`, filters intentionally not live), Tests list
- [x] 4.2 `features.txt`, `IDEAS.md` (move "Cross-tab sync" to Completed), `CHANGELOG.md`
- [x] 4.3 Run `npm run lint`, `npm test`, `npm run build`, `npm run e2e`
