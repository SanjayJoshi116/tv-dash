// TMDB statuses the UI knows (order = display order, e.g. FilterBar / sortStatuses). Colors per
// status live in constants/ui.ts STATUSES, keyed off this list.
export const KNOWN_STATUSES = ['Returning Series', 'Ended', 'Canceled', 'In Production', 'Planned', 'Pilot'] as const
export type KnownStatus = (typeof KNOWN_STATUSES)[number]

// Missing values are normalized once in parseSeriesCsv: `null` means "unknown" (blank, 0 or
// 'N/A' in the CSV) — consumers check `!= null`, never `> 0` or `=== 'N/A'`
export interface TvSeries {
  tvId: number
  name: string
  language: string | null
  seasons: number | null
  episodeRuntime: number | null
  firstAirYear: number | null
  genres: string[]
  creators: string[]
  networks: string[]
  // Known TMDB statuses autocomplete; any other CSV value is still accepted
  // (`string & {}` stops TS collapsing the union to plain `string`)
  status: KnownStatus | (string & {})
  totalEpisodes: number
  lastEpisodeAirDate: string
  popularity: number
  voteCount: number
  voteAverage: number | null
  actors: string[]
  keywords: string[]
  firstAirDate: string
  overview: string
  tagline: string
  posterUrl: string
  ageRating: string | null
  // Unique positive season numbers (deduped at parse time) — .length is the count watched
  seasonsWatched: number[]
  episodesWatched: number
  totalRuntimeWatched: number
}

// Shared { name, value } / { name, count } rows for derive.ts distributions and AnimatedPie.
// Bucketed helpers (ratingBuckets, showsByYear, …) keep their own field names.
export interface NameValue {
  name: string
  value: number
}

export interface NameCount {
  name: string
  count: number
}
