import { describe, it, expect } from 'vitest'
import {
  ageRatingDistribution,
  avgRating,
  compareDescNullsLast,
  completionByGenre,
  completionRate,
  formatRating,
  formatRuntime,
  truncate,
  genreDistribution,
  languageDistribution,
  networkDistribution,
  ratingBuckets,
  seasonsWatchedDepth,
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
    expect(avgRating(data)).toBe(7)
  })

  it('ignores unrated (null) shows', () => {
    const data = [makeSeries({ voteAverage: 8 }), makeSeries({ voteAverage: null })]
    expect(avgRating(data)).toBe(8)
  })

  it('returns null when nothing is rated', () => {
    expect(avgRating([])).toBeNull()
    expect(avgRating([makeSeries({ voteAverage: null })])).toBeNull()
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

  it('skips unrated (null) shows', () => {
    const data = [makeSeries({ voteAverage: null })]
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

describe('languageDistribution', () => {
  it('maps known codes to display names', () => {
    const data = [makeSeries({ language: 'en' }), makeSeries({ language: 'ja' })]
    const result = languageDistribution(data)
    expect(result.find(r => r.name === 'English')?.value).toBe(1)
    expect(result.find(r => r.name === 'Japanese')?.value).toBe(1)
  })

  it('uppercases unknown codes', () => {
    const data = [makeSeries({ language: 'xx' })]
    expect(languageDistribution(data)).toEqual([{ name: 'XX', value: 1 }])
  })

  it('excludes unknown (null) language', () => {
    const data = [makeSeries({ language: null })]
    expect(languageDistribution(data)).toEqual([])
  })
})

describe('ageRatingDistribution', () => {
  it('counts age ratings', () => {
    const data = [makeSeries({ ageRating: 'TV-14' }), makeSeries({ ageRating: 'TV-MA' })]
    const result = ageRatingDistribution(data)
    expect(result.find(r => r.name === 'TV-14')?.value).toBe(1)
    expect(result.find(r => r.name === 'TV-MA')?.value).toBe(1)
  })

  it('excludes unknown (null) age rating', () => {
    const data = [makeSeries({ ageRating: null })]
    expect(ageRatingDistribution(data)).toEqual([])
  })
})

describe('seasonsWatchedDepth', () => {
  it('buckets shows by seasons watched count', () => {
    const data = [
      makeSeries({ seasonsWatched: [1] }),
      makeSeries({ seasonsWatched: [1, 2] }),
      makeSeries({ seasonsWatched: [1, 2, 3] }),
      makeSeries({ seasonsWatched: [1, 2, 3, 4, 5] }),
    ]
    const result = seasonsWatchedDepth(data)
    expect(result).toEqual([
      { depth: '1 season', count: 1 },
      { depth: '2 seasons', count: 1 },
      { depth: '3 seasons', count: 1 },
      { depth: '4+ seasons', count: 1 },
    ])
  })

  it('excludes shows with no seasons watched', () => {
    const data = [makeSeries({ seasonsWatched: [] })]
    const result = seasonsWatchedDepth(data)
    expect(result.every(b => b.count === 0)).toBe(true)
  })

  it('keeps fixed bucket order regardless of input order', () => {
    const data = [makeSeries({ seasonsWatched: [1, 2, 3, 4] }), makeSeries({ seasonsWatched: [1] })]
    const result = seasonsWatchedDepth(data)
    expect(result.map(b => b.depth)).toEqual(['1 season', '2 seasons', '3 seasons', '4+ seasons'])
  })
})

describe('formatRating', () => {
  it('formats one decimal, or a dash when unknown', () => {
    expect([formatRating(8), formatRating(7.25), formatRating(null)]).toEqual(['8.0', '7.3', '–'])
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

  it('rounds fractional minutes', () => {
    expect(formatRuntime(125.5)).toBe('2h 6m')
    expect(formatRuntime(119.6)).toBe('2h')
  })
})

describe('truncate', () => {
  it('leaves strings at or under max unchanged', () => {
    expect(truncate('Netflix', 20)).toBe('Netflix')
    expect(truncate('a'.repeat(20), 20)).toBe('a'.repeat(20))
  })
  it('cuts long strings to max-2 chars plus ellipsis', () => {
    expect(truncate('a'.repeat(25), 20)).toBe('a'.repeat(18) + '…')
    expect(truncate('a'.repeat(19), 18)).toBe('a'.repeat(16) + '…')
  })
  it('counts emoji as one character and never splits a surrogate pair', () => {
    expect(truncate('🤖'.repeat(5), 5)).toBe('🤖'.repeat(5))
    expect(truncate('ab🤖🤖cd', 5)).toBe('ab🤖…')
  })
  it('clamps max below 2 so the result is never longer than the input', () => {
    expect(truncate('abcdef', 1)).toBe('…')
    expect(truncate('abcdef', 0)).toBe('…')
  })
})

describe('count maps ignore Object.prototype keys', () => {
  it('counts a "constructor" status like any other', () => {
    expect(statusDistribution([makeSeries({ status: 'constructor' })])).toEqual([{ name: 'constructor', value: 1 }])
  })
  it('completionByGenre handles "constructor" / "__proto__" genres without touching prototypes', () => {
    const data = [makeSeries({ genres: ['constructor', '__proto__'], episodesWatched: 5, totalEpisodes: 10 })]
    expect(completionByGenre(data).map(d => d.genre).sort()).toEqual(['__proto__', 'constructor'])
    expect(({} as Record<string, unknown>).watched).toBeUndefined()
    expect((Object as unknown as Record<string, unknown>).watched).toBeUndefined()
  })
})

describe('compareDescNullsLast', () => {
  it('sorts descending with nulls last', () => {
    expect([3, null, 9, 1, null].sort(compareDescNullsLast)).toEqual([9, 3, 1, null, null])
  })
})

describe('languageDistribution own-key lookup', () => {
  it('does not resolve inherited keys as language names', () => {
    expect(languageDistribution([makeSeries({ language: 'constructor' })])).toEqual([{ name: 'CONSTRUCTOR', value: 1 }])
  })
})
