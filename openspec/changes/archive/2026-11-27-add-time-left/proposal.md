## Why

The dashboard says how much has been watched, never how much is left. "Can I finish this tonight?" and "which season is next?" are the questions a viewer has mid-series, and the data already answers them: `(totalEpisodes − episodesWatched) × episodeRuntime` and the first season not in `seasonsWatched`. `IDEAS.md` → Pages P1 ("Time left" on Show Detail + Continue Watching).

## What Changes

- Show Detail → Watch History card: "Time left" (e.g. `3h 20m · 4 episodes`) and "Next season" (e.g. `Season 3`). Time left is hidden when the episode runtime is unknown or nothing is left; Next season is hidden when the season count is unknown or every season is watched.
- Dashboard → Continue Watching: each row shows its time left next to the episode count, and a small toggle orders the section by **Most watched** (today's % order, default) or **Least time left** ("finish tonight"); shows with unknown runtime go last in that order. The toggle is per-visit (not saved).

## Capabilities

### New Capabilities
- `time-left`: remaining watch time and next season — definitions, when they're hidden, and the Continue Watching ordering.

### Modified Capabilities
<!-- none -->

## Impact

- `src/utils/derive.ts`: `episodesLeft(s)`, `minutesLeft(s): number | null`, `nextSeason(s): number | null` (pure, tested); display via existing `formatRuntime`.
- `src/pages/ShowDetailPage.tsx` (Watch History card), `src/pages/DashboardPage.tsx` (Continue Watching rows + `Segmented` toggle; uses `progressOf` from `add-progress-filter`).
- No new dependencies, no storage / URL change.
- Last of the five sequential Pages changes (uses `progressOf` from `add-progress-filter`).
- Docs: `CLAUDE.md` (derive list / Tests), `IDEAS.md`, `CHANGELOG.md`, `features.txt`.
