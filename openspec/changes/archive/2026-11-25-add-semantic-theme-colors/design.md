## Context

`constants/ui.ts`: `tierColor(high, mid)` returns fixed hexes; `ratingColor(v: number | null): string | undefined`, `completionColor(v)`, `STAR_COLOR = '#faad14'`. Badges: `ShowCard` and Show Detail render white text on `ratingColor`. `Theme.areaFill` equals `token.colorPrimary` in all three themes. Requirements: `specs/semantic-colors/spec.md`.

Measured (contrast vs content background / vs white text):

| Color | on Light `#f5f5f7` | white text | black text |
|---|---|---|---|
| `#52c41a` | 2.08 | 2.27 | 9.27 |
| `#faad14` | 1.75 | 1.90 | 11.05 |
| `#f5222d` | 3.75 | 4.08 | 5.15 |
| `#237804` | 5.13 | 5.59 | — |
| `#ad6800` | 4.05 | 4.41 | — |
| `#cf1322` | 5.12 | 5.57 | — |

## Goals / Non-Goals

**Goals:** per-theme tier palette with tested contrast; badges readable.

**Non-Goals:** status colors (`STATUSES`, tied to antd Tag presets — separate idea); genre colors; colorblind-safe redesign of the tiers (Constants P2 — this change makes it a theme-data edit later); changing thresholds.

## Decisions

1. **Theme fields:** `tiers: { success: { fill, onFill }, warning: {...}, danger: {...} }` and `star`. Proposed values:
   - Default Dark: fills `#52c41a` / `#faad14` / `#f5222d`, `onFill` `#000000`-ish (`#141414`) for all three; star `#faad14`.
   - Default Light: `#237804` / `#ad6800` / `#cf1322`, `onFill` `#ffffff`; star `#ad6800`.
   - Dracula: `#50fa7b` / `#f1fa8c` / `#ff5555`, `onFill` `#21222c`; star `#f1fa8c`.
   Final values must pass the extended contract test (warning `#ad6800` + white = 4.41 < 4.5 → use `#a05e00`-ish or dark `onFill`; tune during task 1).

2. **API:** `tier(v, thresholds)` → `'success' | 'warning' | 'danger' | null` stays pure in `ui.ts`; colors resolved via `ratingColor(v, theme)` / `ratingOnColor(v, theme)` / `completionColor(v, theme)`. Callers already have `theme` from `useTheme()` (pages, `ShowCard`, `StatsBar`, `ChartsSection` call it). `STAR_COLOR` → `theme.star`.
   *Alternative:* a `useTierColors()` hook — fine for components, but `ui.ts` helpers stay testable as pure functions; the hook isn't needed.

3. **`areaFill` removal:** `ChartsSection` uses `theme.token.colorPrimary`. One field less for future themes.

4. **Contract test:** each tier fill ≥ 3:1 vs `contentBg`; each `onFill` ≥ 4.5:1 vs its fill; `star` ≥ 3:1 vs `contentBg` (it's a graphic).

## Risks / Trade-offs

- [Dark badge text changes the look users know (white → dark on green/amber)] → It's the readable option; red keeps meeting 4.5 with dark text too (`#f5222d` + black 5.15).
- [Many call sites change signature] → Mechanical; TypeScript lists them. `ui.test.ts` covers tier boundaries.
- [Completion colors in `Progress` strokes on Default Light become darker] → Intended (they were 1.75–2.08:1).
