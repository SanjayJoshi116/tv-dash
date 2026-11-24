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
  status: string
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
