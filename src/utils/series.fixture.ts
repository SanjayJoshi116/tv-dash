import type { TvSeries } from '../types/series'

// A complete TvSeries for unit tests — override only the fields a test is about
export function makeSeries(overrides: Partial<TvSeries> = {}): TvSeries {
  return {
    tvId: 1,
    name: 'Test Show',
    language: 'en',
    seasons: 1,
    episodeRuntime: 45,
    firstAirYear: 2020,
    genres: ['Drama'],
    creators: ['Creator A'],
    networks: ['Netflix'],
    status: 'Ended',
    totalEpisodes: 10,
    lastEpisodeAirDate: '2021-01-01',
    popularity: 100,
    voteCount: 500,
    voteAverage: 7.5,
    actors: ['Actor A'],
    keywords: [],
    firstAirDate: '2020-01-01',
    overview: '',
    tagline: '',
    posterUrl: '',
    ageRating: 'TV-14',
    seasonsWatched: [1],
    episodesWatched: 10,
    totalRuntimeWatched: 450,
    ...overrides,
  }
}
