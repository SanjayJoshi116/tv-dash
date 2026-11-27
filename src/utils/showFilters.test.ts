import { describe, it, expect } from 'vitest'
import {
  buildFilterSets,
  buildSearchIndex,
  clearFilters,
  continueWatching,
  DEFAULT_FILTERS,
  DEFAULT_PAGE_SIZE,
  filterAndSortShows,
  filtersFromParams,
  filtersToParams,
  hasActiveFilters,
  parseFilters,
  progressOf,
  parsePage,
  parsePageSize,
  sanitizeFilters,
  withShowParams,
} from './showFilters'
import type { TvSeries } from '../types/series'
import { makeSeries as baseSeries } from './series.fixture'
import type { Filters, NumericSortKey } from '../types/filters'

// Empty name lists by default, so search / genre tests only match what they set
const makeSeries = (overrides: Partial<TvSeries> = {}): TvSeries =>
  baseSeries({ genres: [], creators: [], networks: [], actors: [], ...overrides })

const filters = (f: Partial<Filters> = {}): Filters => ({ ...DEFAULT_FILTERS, sortBy: 'name', ...f })
const run = (data: TvSeries[], f: Partial<Filters>) => filterAndSortShows(data, filters(f), buildSearchIndex(data))
const names = (rows: TvSeries[]) => rows.map(s => s.name)

describe('parseFilters', () => {
  it('returns the defaults for non-objects', () => {
    for (const raw of [undefined, null, 'x', 42, true]) expect(parseFilters(raw)).toBe(DEFAULT_FILTERS)
  })

  it('dedupes genres, keeping the first occurrence order', () => {
    expect(parseFilters({ genres: ['Drama', 'Crime', 'Drama'] }).genres).toEqual(['Drama', 'Crime'])
    expect(filtersFromParams(new URLSearchParams('genre=Drama&genre=Drama'))?.genres).toEqual(['Drama'])
  })

  it('keeps a valid saved value', () => {
    const saved = { search: 'bad', genres: ['Drama'], status: 'Ended', sortBy: 'popularity', progress: 'completed' }
    expect(parseFilters(saved)).toEqual(saved)
  })

  it('falls back field by field', () => {
    const valid = { search: 'bad', genres: ['Drama'], status: 'Ended', sortBy: 'name' }
    expect(parseFilters({ ...valid, search: 1 }).search).toBe('')
    expect(parseFilters({ ...valid, genres: 'Drama' }).genres).toEqual([])
    expect(parseFilters({ ...valid, genres: ['Drama', 3] }).genres).toEqual([])
    expect(parseFilters({ ...valid, status: null }).status).toBe('')
    expect(parseFilters({ ...valid, sortBy: 'nope' }).sortBy).toBe('recentFirst')
    expect(parseFilters({ ...valid, sortBy: 'constructor' }).sortBy).toBe('recentFirst')
    // other fields untouched
    expect(parseFilters({ ...valid, sortBy: 'nope' })).toMatchObject({ search: 'bad', genres: ['Drama'], status: 'Ended' })
  })
})

describe('search', () => {
  const data = [
    makeSeries({ tvId: 1, name: 'Alpha' }),
    makeSeries({ tvId: 2, name: 'Beta', actors: ['Jane Actor'] }),
    makeSeries({ tvId: 3, name: 'Gamma', keywords: ['heist'] }),
    makeSeries({ tvId: 4, name: 'Delta', genres: ['Mystery'] }),
    makeSeries({ tvId: 5, name: 'Epsilon', creators: ['Sam Maker'] }),
    makeSeries({ tvId: 6, name: 'Zeta', networks: ['HBO'] }),
  ]

  it('matches name, actor, keyword, genre, creator and network', () => {
    expect(names(run(data, { search: 'alp' }))).toEqual(['Alpha'])
    expect(names(run(data, { search: 'jane' }))).toEqual(['Beta'])
    expect(names(run(data, { search: 'heist' }))).toEqual(['Gamma'])
    expect(names(run(data, { search: 'mystery' }))).toEqual(['Delta'])
    expect(names(run(data, { search: 'maker' }))).toEqual(['Epsilon'])
    expect(names(run(data, { search: 'hbo' }))).toEqual(['Zeta'])
  })

  it('is case-insensitive', () => {
    expect(names(run(data, { search: 'JANE actor' }))).toEqual(['Beta'])
  })

  it("doesn't match across two fields", () => {
    // name 'Beta' + actor 'Jane Actor' joined would be 'beta\njane actor'
    expect(run(data, { search: 'betajane' })).toEqual([])
    expect(run(data, { search: 'beta jane' })).toEqual([])
  })
})

describe('genre and status filters', () => {
  const data = [
    makeSeries({ tvId: 1, name: 'A', genres: ['Drama', 'Crime'], status: 'Ended' }),
    makeSeries({ tvId: 2, name: 'B', genres: ['Drama'], status: 'Returning Series' }),
    makeSeries({ tvId: 3, name: 'C', genres: ['Crime'], status: 'Ended', actors: ['Zed'] }),
  ]

  it('requires every selected genre (AND)', () => {
    expect(names(run(data, { genres: ['Drama'] }))).toEqual(['A', 'B'])
    expect(names(run(data, { genres: ['Drama', 'Crime'] }))).toEqual(['A'])
  })

  it('filters by status', () => {
    expect(names(run(data, { status: 'Ended' }))).toEqual(['A', 'C'])
  })

  it('combines search, genres and status', () => {
    expect(names(run(data, { genres: ['Crime'], status: 'Ended', search: 'zed' }))).toEqual(['C'])
  })
})

describe('sanitizeFilters', () => {
  const data = [makeSeries({ genres: ['Drama'], status: 'Ended' })]
  const sets = buildFilterSets(data)

  it('drops genres and a status no longer in the data', () => {
    expect(sanitizeFilters(filters({ genres: ['Drama', 'Gone'], status: 'Canceled' }), sets)).toMatchObject({
      genres: ['Drama'],
      status: '',
    })
  })

  it('returns the same object when nothing is dropped', () => {
    const f = filters({ genres: ['Drama'], status: 'Ended' })
    expect(sanitizeFilters(f, sets)).toBe(f)
    const none = filters()
    expect(sanitizeFilters(none, sets)).toBe(none)
  })

  it('leaves filters untouched while there is no data', () => {
    const f = filters({ genres: ['Gone'], status: 'Canceled' })
    expect(sanitizeFilters(f, buildFilterSets([]))).toBe(f)
  })
})

describe('sorting', () => {
  const data = [
    makeSeries({ tvId: 1, name: 'Bravo', voteAverage: 8, popularity: 10, firstAirYear: null, totalRuntimeWatched: 30 }),
    makeSeries({ tvId: 2, name: 'alpha', voteAverage: null, popularity: 30, firstAirYear: 2010, totalRuntimeWatched: 10 }),
    makeSeries({ tvId: 3, name: 'Charlie', voteAverage: 9, popularity: 20, firstAirYear: 2020, totalRuntimeWatched: 20 }),
  ]

  it('recentFirst reverses the CSV order', () => {
    expect(names(run(data, { sortBy: 'recentFirst' }))).toEqual(['Charlie', 'alpha', 'Bravo'])
  })

  it('name uses localeCompare', () => {
    expect(names(run(data, { sortBy: 'name' }))).toEqual(['alpha', 'Bravo', 'Charlie'])
  })

  it.each<[NumericSortKey, string[]]>([
    ['voteAverage', ['Charlie', 'Bravo', 'alpha']],
    ['popularity', ['alpha', 'Charlie', 'Bravo']],
    ['firstAirYear', ['Charlie', 'alpha', 'Bravo']],
    ['totalRuntimeWatched', ['Bravo', 'Charlie', 'alpha']],
  ])('%s sorts descending, nulls last', (sortBy, expected) => {
    expect(names(run(data, { sortBy }))).toEqual(expected)
  })

  it('never mutates the input array', () => {
    const copy = [...data]
    for (const sortBy of ['recentFirst', 'name', 'voteAverage'] as const) run(data, { sortBy })
    run(data, { search: 'a' })
    expect(data).toEqual(copy)
    expect(data.map(s => s.tvId)).toEqual([1, 2, 3])
  })
})

describe('URL codec', () => {
  const sp = (s: string) => new URLSearchParams(s)

  it('returns null when no filter param is present', () => {
    expect(filtersFromParams(sp(''))).toBeNull()
    expect(filtersFromParams(sp('page=2&size=48&theme=dracula'))).toBeNull()
  })

  it('omits defaults', () => {
    expect(filtersToParams(DEFAULT_FILTERS, 1, DEFAULT_PAGE_SIZE).toString()).toBe('')
    expect(filtersToParams({ ...DEFAULT_FILTERS, genres: ['Drama'], sortBy: 'voteAverage' }, 1, DEFAULT_PAGE_SIZE).toString())
      .toBe('genre=Drama&sort=voteAverage')
  })

  it('round-trips every field, genres repeated in selection order and encoded', () => {
    const f: Filters = { search: 'breaking bad', genres: ['Sci-Fi & Fantasy', 'Crime'], status: 'Returning Series', sortBy: 'name', progress: 'inProgress' }
    const params = filtersToParams(f, 3, 48)
    expect(params.toString()).toBe('q=breaking+bad&genre=Sci-Fi+%26+Fantasy&genre=Crime&status=Returning+Series&progress=inProgress&sort=name&page=3&size=48')
    const back = sp(params.toString())
    expect(filtersFromParams(back)).toEqual(f)
    expect(parsePage(back.get('page'))).toBe(3)
    expect(parsePageSize(back.get('size'))).toBe(48)
  })

  it('falls back on an unknown or inherited-key sort', () => {
    expect(filtersFromParams(sp('sort=nope'))?.sortBy).toBe('recentFirst')
    expect(filtersFromParams(sp('sort=constructor'))?.sortBy).toBe('recentFirst')
    expect(filtersFromParams(sp('genre=constructor'))?.genres).toEqual(['constructor']) // dropped by sanitizeFilters once data loads
  })

  it('accepts only canonical positive integer pages', () => {
    for (const raw of [null, '', '0', '-1', '1.5', 'abc', '01', '1e2', 'constructor']) expect(parsePage(raw)).toBe(1)
    expect(parsePage('7')).toBe(7)
  })

  it('accepts only supported page sizes', () => {
    for (const raw of [null, '', '25', '0', '-12', '12.0', 'constructor']) expect(parsePageSize(raw)).toBe(DEFAULT_PAGE_SIZE)
    expect(parsePageSize('96')).toBe(96)
  })

  it('replaces only Shows params, keeping others', () => {
    const merged = withShowParams(sp('theme=dracula&genre=Old&page=4'), filtersToParams({ ...DEFAULT_FILTERS, genres: ['New'] }, 1, DEFAULT_PAGE_SIZE))
    expect(merged.toString()).toBe('theme=dracula&genre=New')
  })
})

describe('progress', () => {
  const at = (episodesWatched: number, totalEpisodes: number) => makeSeries({ episodesWatched, totalEpisodes })

  it('progressOf: not started / in progress / completed', () => {
    expect(progressOf(at(0, 10))).toBe('notStarted')
    expect(progressOf(at(0, 0))).toBe('notStarted')
    expect(progressOf(at(3, 10))).toBe('inProgress')
    expect(progressOf(at(10, 10))).toBe('completed')
    expect(progressOf(at(12, 10))).toBe('completed') // over-watched (TMDB count shrank)
    expect(progressOf(at(5, 0))).toBe('completed') // total unknown (0) but watched — never "in progress"
    expect(progressOf(at(-1, 0))).toBe('notStarted') // hand-edited negative count — never "in progress" (no 0 total)
    expect(progressOf(at(-1, 10))).toBe('notStarted')
  })

  it('filters by progress, combined with a genre', () => {
    const data = [
      makeSeries({ tvId: 1, name: 'A', genres: ['Drama'], episodesWatched: 10, totalEpisodes: 10 }),
      makeSeries({ tvId: 2, name: 'B', genres: ['Comedy'], episodesWatched: 10, totalEpisodes: 10 }),
      makeSeries({ tvId: 3, name: 'C', genres: ['Drama'], episodesWatched: 2, totalEpisodes: 10 }),
      makeSeries({ tvId: 4, name: 'D', genres: ['Drama'], episodesWatched: 0, totalEpisodes: 10 }),
    ]
    expect(names(run(data, { progress: 'completed' }))).toEqual(['A', 'B'])
    expect(names(run(data, { progress: 'completed', genres: ['Drama'] }))).toEqual(['A'])
    expect(names(run(data, { progress: 'inProgress' }))).toEqual(['C'])
    expect(names(run(data, { progress: 'notStarted' }))).toEqual(['D'])
    expect(names(run(data, { progress: 'all' }))).toEqual(['A', 'B', 'C', 'D'])
  })

  it('parseFilters: missing (older saved filters) or unknown progress → all, other fields kept', () => {
    const old = { search: 'x', genres: ['Drama'], status: 'Ended', sortBy: 'name' }
    expect(parseFilters(old)).toEqual({ ...old, progress: 'all' })
    expect(parseFilters({ ...old, progress: 'halfway' }).progress).toBe('all')
    expect(parseFilters({ ...old, progress: 'constructor' }).progress).toBe('all')
  })

  it('URL: progress alone counts as a filter param; all is omitted; unknown → all', () => {
    const sp = (q: string) => new URLSearchParams(q)
    expect(filtersFromParams(sp('progress=notStarted'))).toEqual({ ...DEFAULT_FILTERS, progress: 'notStarted' })
    expect(filtersFromParams(sp('progress=nope'))?.progress).toBe('all')
    expect(filtersToParams({ ...DEFAULT_FILTERS, progress: 'all' }, 1, DEFAULT_PAGE_SIZE).toString()).toBe('')
    expect(filtersToParams({ ...DEFAULT_FILTERS, progress: 'completed' }, 1, DEFAULT_PAGE_SIZE).toString()).toBe('progress=completed')
  })
})

describe('hasActiveFilters / clearFilters', () => {
  it('counts every filter field but not the sort', () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false)
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, sortBy: 'name' })).toBe(false)
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, search: 'x' })).toBe(true)
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, genres: ['Drama'] })).toBe(true)
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, status: 'Ended' })).toBe(true)
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, progress: 'completed' })).toBe(true)
  })

  it('clears every filter and keeps the sort', () => {
    expect(clearFilters('name')).toEqual({ ...DEFAULT_FILTERS, sortBy: 'name' })
    expect(hasActiveFilters(clearFilters('popularity'))).toBe(false)
  })
})

describe('continueWatching', () => {
  // 10 episodes each; watched share 0.2 / 0.5 / 0.8; runtime 60 / unknown / 10 per episode
  const a = makeSeries({ tvId: 1, totalEpisodes: 10, episodesWatched: 2, episodeRuntime: 60 }) // 480 min left
  const b = makeSeries({ tvId: 2, totalEpisodes: 10, episodesWatched: 5, episodeRuntime: null }) // unknown
  const c = makeSeries({ tvId: 3, totalEpisodes: 10, episodesWatched: 8, episodeRuntime: 10 }) // 20 min left
  const notStarted = makeSeries({ tvId: 4, episodesWatched: 0 })
  const done = makeSeries({ tvId: 5, episodesWatched: 10 })
  const negative = makeSeries({ tvId: 7, episodesWatched: -1, totalEpisodes: 0 }) // hand-edited row
  const data = [a, notStarted, b, done, c, negative]
  const ids = (list: TvSeries[]) => list.map(s => s.tvId)

  it('lists only in-progress shows, most watched first', () => {
    expect(ids(continueWatching(data, 'mostWatched', 6))).toEqual([3, 2, 1])
  })

  it('leastTime: least time left first, unknown runtime last', () => {
    expect(ids(continueWatching(data, 'leastTime', 6))).toEqual([3, 1, 2])
  })

  it('sorts before slicing, ties by share watched, never mutates', () => {
    const tie = makeSeries({ tvId: 6, totalEpisodes: 4, episodesWatched: 2, episodeRuntime: 10 }) // 20 min, share 0.5
    const input = [...data, tie]
    expect(ids(continueWatching(input, 'leastTime', 2))).toEqual([3, 6])
    expect(ids(input)).toEqual([1, 4, 2, 5, 3, 7, 6])
  })
})
