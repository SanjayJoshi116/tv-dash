# TV Dashboard

[![CI](https://github.com/SanjayJoshi116/tv-dash/actions/workflows/ci.yml/badge.svg)](https://github.com/SanjayJoshi116/tv-dash/actions/workflows/ci.yml)

A personal TV watch-history dashboard built with React, TypeScript, and Ant Design. Visualizes data from a `tv_series.csv` file with filtering, charts, and per-show detail views.

## Features

- **Stats bar** — total shows, hours watched, average rating, genres, completion rate, and more
- **Analytics** — collapsible charts: genre distribution, status breakdown, rating histogram, shows by year, top 10 by watch time, watch time by decade/year, completion by genre, rating vs popularity scatter, top actors/creators
- **Filter & search** — search by name/actor/keyword, filter by genre and status, sort by rating/popularity/year/watch time; filters persist across sessions
- **Poster grid** — responsive card grid (2–8 columns) with TMDB poster images, rating badges, genre tags, and pagination
- **Show detail** — full page per show: overview, cast, networks, creators, keywords, watch history, season tracker
- **5 themes** — Default Dark, Default Light, AMOLED, Dracula, Catppuccin; persists across sessions

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

> **Note:** The last rows in the CSV are treated as most recently watched (no timestamp field).

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
| Status | string | `Ended`, `Returning Series`, or `Canceled` |
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
- [React Router 7](https://reactrouter.com) — routing
- [Vite](https://vitejs.dev) — build tool

## Project Structure

```
src/
├── constants/ui.ts          # Shared colors, spacing, and color functions
├── types/series.ts          # TvSeries interface
├── themes.ts                # 5 theme definitions + Theme type
├── ThemeContext.tsx          # useTheme() hook
├── context/TvDataContext.tsx # CSV data context
├── hooks/useTvData.ts        # CSV fetch + parse hook
├── utils/
│   ├── derive.ts            # Stats and chart data helpers
│   └── settings.ts          # localStorage persistence utility
├── components/
│   ├── AppLayout.tsx        # Sider + Header + Content shell
│   ├── ChartsSection.tsx    # All Recharts charts in a Collapse panel
│   ├── ErrorState.tsx       # Shared error alert with retry
│   ├── FilterBar.tsx        # Search, genre, status, sort controls
│   ├── LoadingState.tsx     # Shared loading spinner
│   ├── ShowCard.tsx         # Individual show card
│   ├── ShowGrid.tsx         # Responsive CSS-grid of ShowCards
│   ├── StatsBar.tsx         # Row of stat cards
│   └── ThemeToggle.tsx      # Theme selector
└── pages/
    ├── DashboardPage.tsx    # Overview: stats, continue watching, recently watched
    ├── ShowsPage.tsx        # Filtered, paginated show grid
    ├── ShowDetailPage.tsx   # Full show detail
    └── StatisticsPage.tsx   # StatsBar + ChartsSection
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
