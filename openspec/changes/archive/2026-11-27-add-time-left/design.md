## Context

`TvSeries` has `totalEpisodes`, `episodesWatched`, `episodeRuntime: number | null` (`posNum`), `seasons: number | null` (integer ≤ 1000), `seasonsWatched` (deduped positive ints). `formatRuntime(mins)` in `derive.ts` already renders `45m` / `3h` / `3h 20m`. Dashboard's Continue Watching memo filters in-progress shows (via `progressOf` after `add-progress-filter`), sorts by % watched, takes 6. Show Detail's Watch History card has completion + season tags.

## Goals / Non-Goals

**Goals:** pure, null-aware helpers; no fake zeros (CLAUDE.md: unknown = `null`, render `'–'` or hide).

**Non-Goals:** a Shows sort by time left (`NumericSortKey` is descending-only — revisit with the P2 table view's asc / desc toggle); persisting the Continue Watching order; per-episode runtime accuracy (TMDB's runtime is an average).

## Decisions

- **Helpers in `derive.ts`:** `episodesLeft(s) = max(0, total − watched)`; `minutesLeft(s)` = `episodeRuntime == null ? null : episodesLeft × runtime`; `nextSeason(s)` = first `n` in `1..seasons` not in `seasonsWatched` (`Set`), `null` if `seasons == null` or none. All return `null` / `0` instead of throwing on odd rows.
- **Show Detail placement:** two lines in the Watch History card under the completion bar (`Time left · 3h 20m · 4 episodes`, `Next · Season 3`), not new `StatCard`s — the hero already holds 4 compact tiles and CLAUDE.md caps them for width.
- **Continue Watching order:** `useState<'mostWatched' | 'leastTime'>('mostWatched')`; antd `Segmented` (`size="small"`, options labelled "Most watched" / "Least time left") in the section header row next to "View all". The memo sorts **before** `.slice(0, 6)` so "least time left" picks the right six. Ties → % watched desc. New `compareAscNullsLast` next to `compareDescNullsLast` (tested) — negating values for the desc comparator would misplace `null`s.
- **Row text:** `4/10 eps · 40% · 3h 20m left` (time part omitted when `minutesLeft` is `null`). `Segmented` reads `usePrefersReducedMotion` implicitly via antd's `token.motion` — nothing extra.

## Risks / Trade-offs

- [`totalEpisodes` counts unaired / future episodes for returning shows] → time left can include episodes not out yet; acceptable, matches the existing completion %. The "New eps" tag already hints at this.
- [Row text overflow on narrow cards] → the line is `Text type="secondary"` with `ellipsis`; checked at `xs` / `sm` / `xl` breakpoints in e2e.
