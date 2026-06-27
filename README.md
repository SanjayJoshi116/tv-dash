# TV Dashboard

[![CI](https://github.com/athishay/tv-dash/actions/workflows/ci.yml/badge.svg)](https://github.com/athishay/tv-dash/actions/workflows/ci.yml)

A personal TV watch-history dashboard built with React, TypeScript, and Ant Design. Visualizes data from a `tv_series.csv` file with filtering, charts, and per-show detail views.

## Features

- **Stats bar** — total shows, hours watched, average rating, unique genre count
- **Analytics** — collapsible charts: genre distribution, rating histogram, shows by year, top 10 by watch time
- **Filter & search** — search by name/actor/keyword, filter by genre and status, sort by rating/popularity/year/watch time
- **Poster grid** — responsive card grid with TMDB poster images, rating badges, and genre tags
- **Detail drawer** — click any show for full details: overview, cast, networks, creators, keywords, and watch stats
- **Themes** — 5 built-in themes including AMOLED, Dracula, and Catppuccin

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Production Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

To deploy, serve the contents of `dist/` from any static host (Vercel, Netlify, GitHub Pages, nginx, etc.).

## Data

Place your `tv_series.csv` in the `public/` directory. The app fetches it at runtime — swap it out without rebuilding. The file is not included in this repo; see the column schema below to create your own.

> **Note:** Screenshots not included — run the app locally with your own data to see it in action.

### Expected columns

| Column | Type | Notes |
|--------|------|-------|
| TV ID | number | Unique identifier |
| Name | string | |
| Language | string | ISO code, e.g. `ja` |
| Seasons | number | |
| Episode Runtime | number \| `N/A` | Minutes |
| First Air Year | number | |
| Genres | string | Comma-separated |
| Creators | string | Comma-separated |
| Networks | string | Comma-separated |
| Status | string | `Ended` or `Returning Series` |
| Total Episodes | number | |
| Last Episode Air Date | date | `YYYY-MM-DD` |
| Popularity | number | |
| Vote Count | number | |
| Vote Average | number | 0–10 scale |
| Actors/Actresses | string | Comma-separated |
| Keywords/Tags | string | Comma-separated |
| First Air Date | date | `YYYY-MM-DD` |
| Overview | string | |
| Tagline | string | |
| Poster URL | string | Full URL to poster image |
| Age Rating | string | e.g. `TV-14`, `TV-MA` |
| Seasons Watched | string | Comma-separated season numbers |
| Episodes Watched | number | |
| Total Runtime Watched (min) | number | |

## Stack

- [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Ant Design 5](https://ant.design) — UI components and theming
- [Recharts](https://recharts.org) — charts
- [PapaParse](https://www.papaparse.com) — CSV parsing
- [Vite](https://vitejs.dev) — build tool

## Project Structure

```
src/
├── types/series.ts          # TvSeries interface
├── hooks/useTvData.ts       # CSV fetch + parse hook
├── utils/derive.ts          # Stats and chart data helpers
└── components/
    ├── ThemeToggle.tsx
    ├── StatsBar.tsx
    ├── FilterBar.tsx
    ├── ShowCard.tsx
    ├── ShowGrid.tsx
    ├── ShowDetailModal.tsx
    └── ChartsSection.tsx
```
