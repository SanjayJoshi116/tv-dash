import Papa from 'papaparse'
import type { TvSeries } from '../types/series'

// Pure CSV → TvSeries[] logic, kept out of the fetch hook so it's testable without fetch mocks.

// TV ID is required: it's the React key and the /shows/:id route param
const REQUIRED_COLUMNS = ['TV ID', 'Name', 'Vote Average', 'Genres', 'Status']

// Papa header mode without dynamicTyping yields strings; a short row leaves fields undefined
type RawRow = Record<string, string | undefined>

function splitList(val: string | undefined): string[] {
  return (val ?? '').split(',').map(s => s.trim()).filter(Boolean)
}

// Season numbers: unique positive integers only (a duplicate would inflate seasonsWatched.length)
function parseNumList(val: string | undefined): number[] {
  return [...new Set(splitList(val).map(Number))].filter(n => Number.isInteger(n) && n > 0)
}

// Blank or non-numeric → fallback (e.g. 'N/A' runtime → null)
function num<F>(val: string | undefined, fallback: F): number | F {
  const n = val == null || val.trim() === '' ? NaN : Number(val)
  return Number.isFinite(n) ? n : fallback
}

// Positive number or null — 0 means "unknown" for year / rating (TMDB's 0.0 = no votes) / runtime
function posNum(val: string | undefined): number | null {
  const n = num(val, null)
  return n != null && n > 0 ? n : null
}

// Season count drives an Array.from on the detail page — a fraction or a huge value
// ('1e7' from a hand edit) would render nonsense or freeze the tab, so treat it as unknown
const MAX_SEASONS = 1000
function seasonCount(val: string | undefined): number | null {
  const n = posNum(val)
  return n != null && Number.isInteger(n) && n <= MAX_SEASONS ? n : null
}

// Blank or 'N/A' → null
function optStr(val: string | undefined): string | null {
  const s = (val ?? '').trim()
  return s === '' || s.toUpperCase() === 'N/A' ? null : s
}

// null when the row has no usable TV ID (blank → would be 0, garbage → NaN:
// duplicate React keys / unreachable /shows/:id)
function toSeries(row: RawRow): TvSeries | null {
  const tvId = num(row['TV ID'], 0)
  if (!Number.isInteger(tvId) || tvId <= 0) return null
  const str = (k: string) => row[k] ?? ''
  return {
    tvId,
    name: str('Name'),
    language: optStr(row['Language']),
    seasons: seasonCount(row['Seasons']),
    episodeRuntime: posNum(row['Episode Runtime']),
    firstAirYear: posNum(row['First Air Year']),
    genres: splitList(row['Genres']),
    creators: splitList(row['Creators']),
    networks: splitList(row['Networks']),
    status: str('Status'),
    totalEpisodes: num(row['Total Episodes'], 0),
    lastEpisodeAirDate: str('Last Episode Air Date'),
    popularity: num(row['Popularity'], 0),
    voteCount: num(row['Vote Count'], 0),
    voteAverage: posNum(row['Vote Average']),
    actors: splitList(row['Actors/Actresses']),
    keywords: splitList(row['Keywords/Tags']),
    firstAirDate: str('First Air Date'),
    overview: str('Overview'),
    tagline: str('Tagline'),
    posterUrl: str('Poster URL'),
    ageRating: optStr(row['Age Rating']),
    seasonsWatched: parseNumList(row['Seasons Watched']),
    episodesWatched: num(row['Episodes Watched'], 0),
    totalRuntimeWatched: num(row['Total Runtime Watched (min)'], 0),
  }
}

/**
 * Parses tv_series.csv text. Throws on file-level problems: quote/delimiter errors, missing
 * required columns, or every data row skipped. Row-level problems (wrong field count, invalid
 * or duplicate TV ID) only drop that row and are reported in `warnings`, so one malformed line
 * doesn't take down every page. Warnings say "record N" (Nth data row), not a file line number:
 * quoted newlines in Overview and skipped blank lines make line numbers unreliable.
 */
export function parseSeriesCsv(text: string): { rows: TvSeries[]; warnings: string[] } {
  // Fixed delimiter: auto-detect fails on an empty file ("UndetectableDelimiter"), which
  // would show a parse error instead of the Dashboard's empty state
  const result = Papa.parse<RawRow>(text, { header: true, skipEmptyLines: true, delimiter: ',' })

  const warnings: string[] = []
  const badRows = new Set<number>()
  for (const e of result.errors) {
    // Only FieldMismatch is safely row-local. A bad quote makes Papa swallow every following
    // line into one field, and its `row` is off by one (counts the header) — so skipping
    // "that row" would keep the corrupted one and silently lose the rest of the file.
    if (e.type !== 'FieldMismatch' || e.row == null) throw new Error(`CSV parse error: ${e.message}`)
    badRows.add(e.row)
    warnings.push(`tv_series.csv: skipped record ${e.row + 1} — ${e.message}`)
  }

  const cols = result.meta.fields ?? []
  const missing = REQUIRED_COLUMNS.filter(c => !cols.includes(c))
  if (result.data.length > 0 && missing.length > 0) {
    throw new Error(`CSV missing required columns: ${missing.join(', ')}`)
  }

  const rows: TvSeries[] = []
  // Duplicate IDs → duplicate React keys, an unreachable second /shows/:id, double-counted stats
  const seenIds = new Set<number>()
  result.data.forEach((raw, i) => {
    if (badRows.has(i)) return
    const skip = (why: string) => warnings.push(`tv_series.csv: skipped record ${i + 1} (${raw['Name'] || 'unnamed'}) — ${why}`)
    const series = toSeries(raw)
    if (!series) return skip('invalid TV ID')
    if (seenIds.has(series.tvId)) return skip(`duplicate TV ID ${series.tvId}`)
    seenIds.add(series.tvId)
    rows.push(series)
  })

  // Every row skipped is a file-level problem (e.g. header/column-count drift), not row noise —
  // fail visibly instead of rendering the "no data" empty state
  if (result.data.length > 0 && rows.length === 0) {
    throw new Error(`CSV has no valid rows — all ${result.data.length} skipped. First: ${warnings[0]}`)
  }
  return { rows, warnings }
}
