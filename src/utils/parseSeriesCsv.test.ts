import { describe, it, expect } from 'vitest'
import { parseSeriesCsv } from './parseSeriesCsv'
import { VALID_CSV, VALID_ROW, csv, withId } from './parseSeriesCsv.fixture'

describe('parseSeriesCsv', () => {
  it('maps a valid row', () => {
    const { rows, warnings } = parseSeriesCsv(VALID_CSV)
    expect(warnings).toEqual([])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      tvId: 1, name: 'Breaking Bad', voteAverage: 9.5, episodeRuntime: 47,
      genres: ['Drama', 'Crime'], seasonsWatched: [1], totalRuntimeWatched: 2914,
    })
  })

  it('throws when required columns are missing', () => {
    expect(() => parseSeriesCsv('ID,Title\n1,Show A')).toThrow('CSV missing required columns')
  })

  it('skips a malformed row with a warning instead of failing the whole file', () => {
    const { rows, warnings } = parseSeriesCsv(csv(VALID_ROW, '2,Broken Row,en'))
    expect(rows.map(s => s.name)).toEqual(['Breaking Bad'])
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('record 2')
  })

  it('treats a broken quote as fatal instead of silently swallowing later rows', () => {
    expect(() => parseSeriesCsv(csv(VALID_ROW.replace('"Drama,Crime"', '"Drama,Crime'), withId('2'))))
      .toThrow('CSV parse error')
  })

  it('skips rows with a blank or invalid TV ID', () => {
    const { rows, warnings } = parseSeriesCsv(csv(VALID_ROW, withId(''), withId('abc')))
    expect(rows.map(s => s.tvId)).toEqual([1])
    expect(warnings).toHaveLength(2)
    expect(warnings[0]).toContain('invalid TV ID')
  })

  it('numbers records by data row, not file line, when an earlier field spans lines', () => {
    const multiline = VALID_ROW.replace('A chemistry teacher', '"A chemistry\nteacher"')
    const { rows, warnings } = parseSeriesCsv(csv(multiline, '2,Broken Row,en'))
    expect(rows[0].overview).toBe('A chemistry\nteacher')
    expect(warnings[0]).toContain('record 2')
  })

  it('skips duplicate TV IDs, keeping the first', () => {
    const { rows, warnings } = parseSeriesCsv(csv(VALID_ROW, VALID_ROW.replace('Breaking Bad', 'Dupe')))
    expect(rows.map(s => s.name)).toEqual(['Breaking Bad'])
    expect(warnings).toEqual([expect.stringContaining('duplicate TV ID 1')])
  })

  it('throws when every data row is skipped', () => {
    expect(() => parseSeriesCsv(csv('2,Broken Row,en', '3,Also Broken,en'))).toThrow('CSV has no valid rows — all 2 skipped')
  })

  it('returns no rows (not an error) for an empty or header-only file', () => {
    expect(parseSeriesCsv('')).toEqual({ rows: [], warnings: [] })
    expect(parseSeriesCsv(csv())).toEqual({ rows: [], warnings: [] })
  })

  it('maps blank / 0 year, rating and seasons to null', () => {
    // VALID_ROW: seasons=5 (field 4), year=2008 (field 6), vote average=9.5 (field 15)
    const fields = VALID_ROW.replace('"Drama,Crime"', 'Drama').split(',')
    fields[3] = ''; fields[5] = '0'; fields[14] = '0'
    const [s] = parseSeriesCsv(csv(fields.join(','))).rows
    expect([s.seasons, s.firstAirYear, s.voteAverage]).toEqual([null, null, null])
  })

  it('maps a fractional or absurd season count to null', () => {
    const { rows } = parseSeriesCsv(csv(
      VALID_ROW.replace(',en,5,', ',en,2.5,'),
      withId('2', VALID_ROW.replace(',en,5,', ',en,1e7,')),
      withId('3', VALID_ROW.replace(',en,5,', ',en,1000,')),
    ))
    expect(rows.map(r => r.seasons)).toEqual([null, null, 1000])
  })

  it('maps a zero or negative episode runtime to null', () => {
    const { rows } = parseSeriesCsv(csv(VALID_ROW.replace(',47,', ',0,'), withId('2', VALID_ROW.replace(',47,', ',-5,'))))
    expect(rows.map(r => r.episodeRuntime)).toEqual([null, null])
  })

  it('maps blank or N/A language / age rating to null', () => {
    const fields = VALID_ROW.replace('"Drama,Crime"', 'Drama').split(',')
    fields[2] = 'N/A'; fields[21] = ''
    const [s] = parseSeriesCsv(csv(fields.join(','))).rows
    expect([s.language, s.ageRating]).toEqual([null, null])
  })

  it('dedupes seasons watched and keeps only positive integers', () => {
    const [s] = parseSeriesCsv(csv(VALID_ROW.replace(',TV-MA,1,', ',TV-MA,"2,1,2,0,-1,1.5",'))).rows
    expect(s.seasonsWatched).toEqual([2, 1])
  })

  it('maps N/A or garbage runtime to null and keeps fractional numbers', () => {
    const row = (runtime: string, watched: string) => VALID_ROW.replace(',47,', `,${runtime},`).replace(/,2914$/, `,${watched}`)
    const { rows } = parseSeriesCsv(csv(row('N/A', '125.5'), withId('2', row('abc', 'x'))))
    expect(rows[0].episodeRuntime).toBeNull()
    expect(rows[0].totalRuntimeWatched).toBe(125.5)
    expect(rows[1].episodeRuntime).toBeNull()
    expect(rows[1].totalRuntimeWatched).toBe(0)
  })
})
