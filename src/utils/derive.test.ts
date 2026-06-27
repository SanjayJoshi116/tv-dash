import { describe, it, expect } from 'vitest'
import {
  avgRating,
  completionByGenre,
  completionRate,
  formatRuntime,
  genreDistribution,
  networkDistribution,
  ratingBuckets,
  showsByYear,
  statusDistribution,
  topActors,
  topByWatchTime,
  topCreators,
  topGenreByWatchTime,
  totalHoursWatched,
  uniqueGenres,
  watchTimeByDecade,
  watchTimeByYear,
} from './derive'
import type { TvSeries } from '../types/series'

function makeSeries(overrides: Partial<TvSeries> = {}): TvSeries {
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

describe('totalHoursWatched', () => {
  it('sums runtime and converts to hours', () => {
    const data = [makeSeries({ totalRuntimeWatched: 120 }), makeSeries({ totalRuntimeWatched: 60 })]
    expect(totalHoursWatched(data)).toBe(3)
  })

  it('returns 0 for empty array', () => {
    expect(totalHoursWatched([])).toBe(0)
  })
})

describe('avgRating', () => {
  it('averages vote averages', () => {
    const data = [makeSeries({ voteAverage: 8 }), makeSeries({ voteAverage: 6 })]
    expect(avgRating(data)).toBe('7.0')
  })

  it('ignores shows with 0 rating', () => {
    const data = [makeSeries({ voteAverage: 8 }), makeSeries({ voteAverage: 0 })]
    expect(avgRating(data)).toBe('8.0')
  })

  it('returns dash for empty array', () => {
    expect(avgRating([])).toBe('–')
  })
})

describe('uniqueGenres', () => {
  it('returns sorted unique genres', () => {
    const data = [
      makeSeries({ genres: ['Drama', 'Comedy'] }),
      makeSeries({ genres: ['Drama', 'Action'] }),
    ]
    expect(uniqueGenres(data)).toEqual(['Action', 'Comedy', 'Drama'])
  })

  it('returns empty for empty data', () => {
    expect(uniqueGenres([])).toEqual([])
  })
})

describe('genreDistribution', () => {
  it('counts genres across shows', () => {
    const data = [
      makeSeries({ genres: ['Drama', 'Comedy'] }),
      makeSeries({ genres: ['Drama'] }),
    ]
    const result = genreDistribution(data)
    expect(result[0]).toEqual({ name: 'Drama', value: 2 })
    expect(result[1]).toEqual({ name: 'Comedy', value: 1 })
  })

  it('returns empty for empty data', () => {
    expect(genreDistribution([])).toEqual([])
  })
})

describe('ratingBuckets', () => {
  it('places shows in correct bucket', () => {
    const data = [makeSeries({ voteAverage: 7.5 }), makeSeries({ voteAverage: 8.9 })]
    const buckets = ratingBuckets(data)
    expect(buckets[7].count).toBe(1)
    expect(buckets[8].count).toBe(1)
  })

  it('skips shows with 0 rating', () => {
    const data = [makeSeries({ voteAverage: 0 })]
    const buckets = ratingBuckets(data)
    expect(buckets.every(b => b.count === 0)).toBe(true)
  })

  it('returns 10 buckets', () => {
    expect(ratingBuckets([])).toHaveLength(10)
  })
})

describe('showsByYear', () => {
  it('groups by first air year', () => {
    const data = [
      makeSeries({ firstAirYear: 2020 }),
      makeSeries({ firstAirYear: 2021 }),
      makeSeries({ firstAirYear: 2020 }),
    ]
    const result = showsByYear(data)
    expect(result.find(r => r.year === 2020)?.count).toBe(2)
    expect(result.find(r => r.year === 2021)?.count).toBe(1)
  })

  it('sorts by year ascending', () => {
    const data = [makeSeries({ firstAirYear: 2022 }), makeSeries({ firstAirYear: 2018 })]
    const result = showsByYear(data)
    expect(result[0].year).toBe(2018)
  })
})

describe('topByWatchTime', () => {
  it('returns top n by runtime', () => {
    const data = [
      makeSeries({ totalRuntimeWatched: 100, name: 'A' }),
      makeSeries({ totalRuntimeWatched: 500, name: 'B' }),
      makeSeries({ totalRuntimeWatched: 300, name: 'C' }),
    ]
    const result = topByWatchTime(data, 2)
    expect(result[0].name).toBe('B')
    expect(result[1].name).toBe('C')
    expect(result).toHaveLength(2)
  })
})

describe('networkDistribution', () => {
  it('counts networks and slices to n', () => {
    const data = [
      makeSeries({ networks: ['Netflix', 'HBO'] }),
      makeSeries({ networks: ['Netflix'] }),
    ]
    const result = networkDistribution(data, 1)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ name: 'Netflix', value: 2 })
  })
})

describe('statusDistribution', () => {
  it('counts statuses', () => {
    const data = [
      makeSeries({ status: 'Ended' }),
      makeSeries({ status: 'Ended' }),
      makeSeries({ status: 'Returning Series' }),
    ]
    const result = statusDistribution(data)
    expect(result[0]).toEqual({ name: 'Ended', value: 2 })
  })
})

describe('completionRate', () => {
  it('calculates percentage of episodes watched', () => {
    const data = [
      makeSeries({ totalEpisodes: 10, episodesWatched: 5 }),
      makeSeries({ totalEpisodes: 10, episodesWatched: 10 }),
    ]
    expect(completionRate(data)).toBe(75)
  })

  it('returns 0 when no episodes', () => {
    expect(completionRate([])).toBe(0)
  })
})

describe('topGenreByWatchTime', () => {
  it('returns genre with most watch time', () => {
    const data = [
      makeSeries({ genres: ['Drama'], totalRuntimeWatched: 500 }),
      makeSeries({ genres: ['Comedy'], totalRuntimeWatched: 100 }),
    ]
    expect(topGenreByWatchTime(data)).toBe('Drama')
  })

  it('returns dash for empty data', () => {
    expect(topGenreByWatchTime([])).toBe('–')
  })
})

describe('watchTimeByDecade', () => {
  it('groups by decade', () => {
    const data = [
      makeSeries({ firstAirYear: 1995, totalRuntimeWatched: 600 }),
      makeSeries({ firstAirYear: 1998, totalRuntimeWatched: 600 }),
      makeSeries({ firstAirYear: 2005, totalRuntimeWatched: 120 }),
    ]
    const result = watchTimeByDecade(data)
    expect(result.find(r => r.decade === '1990s')?.hours).toBe(20)
    expect(result.find(r => r.decade === '2000s')?.hours).toBe(2)
  })
})

describe('watchTimeByYear', () => {
  it('sums watch time per year', () => {
    const data = [
      makeSeries({ firstAirYear: 2020, totalRuntimeWatched: 120 }),
      makeSeries({ firstAirYear: 2020, totalRuntimeWatched: 60 }),
    ]
    const result = watchTimeByYear(data)
    expect(result.find(r => r.year === 2020)?.hours).toBe(3)
  })
})

describe('completionByGenre', () => {
  it('calculates per-genre completion rate', () => {
    const data = [
      makeSeries({ genres: ['Drama'], totalEpisodes: 10, episodesWatched: 5 }),
      makeSeries({ genres: ['Drama'], totalEpisodes: 10, episodesWatched: 10 }),
    ]
    const result = completionByGenre(data)
    expect(result.find(r => r.genre === 'Drama')?.pct).toBe(75)
  })
})

describe('topActors', () => {
  it('returns actors by show count', () => {
    const data = [
      makeSeries({ actors: ['Alice', 'Bob'] }),
      makeSeries({ actors: ['Alice'] }),
    ]
    const result = topActors(data, 1)
    expect(result[0]).toEqual({ name: 'Alice', count: 2 })
  })
})

describe('topCreators', () => {
  it('returns creators by show count', () => {
    const data = [
      makeSeries({ creators: ['Alice', 'Bob'] }),
      makeSeries({ creators: ['Alice'] }),
    ]
    const result = topCreators(data, 1)
    expect(result[0]).toEqual({ name: 'Alice', count: 2 })
  })
})

describe('formatRuntime', () => {
  it('formats hours and minutes', () => {
    expect(formatRuntime(90)).toBe('1h 30m')
  })

  it('formats hours only', () => {
    expect(formatRuntime(120)).toBe('2h')
  })

  it('formats minutes only', () => {
    expect(formatRuntime(45)).toBe('45m')
  })

  it('formats zero', () => {
    expect(formatRuntime(0)).toBe('0m')
  })
})
