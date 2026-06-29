# TV Dashboard

[![CI](https://github.com/SanjayJoshi116/tv-dash/actions/workflows/ci.yml/badge.svg)](https://github.com/SanjayJoshi116/tv-dash/actions/workflows/ci.yml)

A personal TV watch-history dashboard built with React, TypeScript, and Ant Design. Visualizes data from a `tv_series.csv` file with filtering, charts, and per-show detail views.

## Features

- **Stats bar** — total shows, hours/minutes/years watched, average rating, genres, completion rate, top genre, top network, episodes watched
- **Analytics** — 14 charts always visible: genre distribution, status breakdown, language breakdown, age rating distribution, rating histogram, shows by year, top networks, top 10 by watch time, watch time by decade/year, rating vs popularity scatter, completion by genre, seasons watched depth, top actors/creators
- **Filter & search** — search by title, actor, keyword, genre, creator, or network; filter by genre and status; sort by recently watched, rating, popularity, year, watch time; filters persist across sessions
- **Poster grid** — responsive card grid (2–8 columns) with TMDB poster images, rating badges, genre tags, and pagination
- **Show detail** — full page per show: expandable overview, vote count, formatted air dates, cast, networks, creators, keywords, watch history with icon-annotated season tracker
- **3 themes** — Default Dark, Default Light, Dracula; persists across sessions

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

## Generating the CSV

`series-search.py` is a Tkinter desktop app that builds and maintains `tv_series.csv` by querying the [TMDB API](https://www.themoviedb.org/documentation/api).

**Requirements:**

```bash
pip install requests
```

**Run:**

```bash
python series-search.py
```

**How it works:**

1. Search a TV series by name — results pulled from TMDB
2. Select a show from the results table
3. Pick which seasons you watched in the season panel
4. Click **Save to CSV** — appends a new row (or updates an existing one) in `tv_series.csv`

**Notes:**
- Re-adding a show with new seasons updates the existing row rather than duplicating it.
- Last row = most recently watched — row order is watch order (no timestamp field).
- Move the output `tv_series.csv` to `public/` before running the dashboard.

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
├── themes.ts                # 3 theme definitions + Theme type
├── ThemeContext.tsx          # useTheme() hook
├── context/TvDataContext.tsx # CSV data context
├── hooks/useTvData.ts        # CSV fetch + parse hook
├── utils/
│   ├── derive.ts            # Stats and chart data helpers
│   └── settings.ts          # localStorage persistence utility
├── components/
│   ├── AppLayout.tsx        # Sider + Header + Content shell
│   ├── ChartsSection.tsx    # All Recharts charts (always visible, no collapse)
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
