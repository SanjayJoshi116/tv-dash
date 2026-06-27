export interface TvSeries {
  tvId: number
  name: string
  language: string
  seasons: number
  episodeRuntime: number | null
  firstAirYear: number
  genres: string[]
  creators: string[]
  networks: string[]
  status: string
  totalEpisodes: number
  lastEpisodeAirDate: string
  popularity: number
  voteCount: number
  voteAverage: number
  actors: string[]
  keywords: string[]
  firstAirDate: string
  overview: string
  tagline: string
  posterUrl: string
  ageRating: string
  seasonsWatched: number[]
  episodesWatched: number
  totalRuntimeWatched: number
}
