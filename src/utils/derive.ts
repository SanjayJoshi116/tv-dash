import type { NameCount, NameValue, TvSeries } from '../types/series'
import { lookup } from './lookup'

// The show a `/shows/:id` param points at — one lookup for Show Detail and the page title.
// Canonical ids only (TV IDs are positive integers): `0x1`, `1e0`, `01`, ` 1` are not show 1.
export function findShow(data: TvSeries[], id: string | undefined): TvSeries | undefined {
  if (id == null || !/^[1-9]\d*$/.test(id)) return undefined
  return data.find(s => s.tvId === Number(id))
}

// CSV rows have no timestamp field — last row = most recently watched.
export function recentFirst(data: TvSeries[]): TvSeries[] {
  return [...data].reverse()
}

export function totalHoursWatched(data: TvSeries[]): number {
  const mins = data.reduce((sum, s) => sum + s.totalRuntimeWatched, 0)
  return Math.round(mins / 60)
}

export function totalMinutesWatched(data: TvSeries[]): number {
  return Math.round(data.reduce((sum, s) => sum + s.totalRuntimeWatched, 0))
}

export function totalYearsWatched(data: TvSeries[]): number {
  const mins = data.reduce((sum, s) => sum + s.totalRuntimeWatched, 0)
  return mins / 525600
}

// One decimal, or '–' for an unknown rating (null)
export function formatRating(v: number | null): string {
  return v?.toFixed(1) ?? '–'
}

// null when no show is rated — callers format with formatRating and color with ratingColor
export function avgRating(data: TvSeries[]): number | null {
  const ratings = data.flatMap(s => (s.voteAverage != null ? [s.voteAverage] : []))
  if (!ratings.length) return null
  return ratings.reduce((sum, v) => sum + v, 0) / ratings.length
}

// Descending comparator with unknown (null) values last — for rating / year sorts
export function compareDescNullsLast(a: number | null, b: number | null): number {
  if (a == null || b == null) return (a == null ? 1 : 0) - (b == null ? 1 : 0)
  return b - a
}

// Row with the largest non-null `pick` value (first in data order on ties); undefined if none
export function maxBy(data: TvSeries[], pick: (s: TvSeries) => number | null): TvSeries | undefined {
  let best: TvSeries | undefined
  let bestVal = -Infinity
  for (const s of data) {
    const v = pick(s)
    if (v != null && v > bestVal) { best = s; bestVal = v }
  }
  return best
}

export function uniqueGenres(data: TvSeries[]): string[] {
  const set = new Set<string>()
  data.forEach(s => s.genres.forEach(g => set.add(g)))
  return Array.from(set).sort()
}

export function genreDistribution(data: TvSeries[]): NameValue[] {
  const counts: Record<string, number> = Object.create(null)
  data.forEach(s => s.genres.forEach(g => { counts[g] = (counts[g] || 0) + 1 }))
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export function ratingBuckets(data: TvSeries[]): { range: string; count: number }[] {
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${i}-${i + 1}`,
    count: 0,
  }))
  data.forEach(s => {
    if (s.voteAverage != null) {
      const idx = Math.min(Math.floor(s.voteAverage), 9)
      buckets[idx].count++
    }
  })
  return buckets
}

export function showsByYear(data: TvSeries[]): { year: number; count: number }[] {
  const counts: Record<number, number> = {}
  data.forEach(s => {
    if (s.firstAirYear) counts[s.firstAirYear] = (counts[s.firstAirYear] || 0) + 1
  })
  return Object.entries(counts)
    .map(([year, count]) => ({ year: Number(year), count }))
    .sort((a, b) => a.year - b.year)
}

export function topByWatchTime(data: TvSeries[], n = 10): TvSeries[] {
  return [...data].sort((a, b) => b.totalRuntimeWatched - a.totalRuntimeWatched).slice(0, n)
}

// Chart-label truncation: strings longer than `max` characters are cut to max-2 + '…'.
// Counts code points (Array.from), not UTF-16 units, so an emoji is never split in half;
// max is clamped to 2 so the result is never longer than the input.
export function truncate(s: string, max = 20): string {
  const chars = Array.from(s)
  const limit = Math.max(max, 2)
  return chars.length > limit ? chars.slice(0, limit - 2).join('') + '…' : s
}

export function formatRuntime(mins: number): string {
  // CSV runtimes are Number()-parsed, so fractions can reach here
  const total = Math.round(mins)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function statusDistribution(data: TvSeries[]): NameValue[] {
  const counts: Record<string, number> = Object.create(null)
  data.forEach(s => {
    if (s.status) counts[s.status] = (counts[s.status] || 0) + 1
  })
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export function networkDistribution(data: TvSeries[], n = 10): NameValue[] {
  const counts: Record<string, number> = Object.create(null)
  data.forEach(s => s.networks.forEach(net => { counts[net] = (counts[net] || 0) + 1 }))
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n)
}

export function watchTimeByDecade(data: TvSeries[]): { decade: string; hours: number }[] {
  const totals: Record<number, number> = {}
  data.forEach(s => {
    if (s.firstAirYear != null && s.totalRuntimeWatched > 0) {
      const decade = Math.floor(s.firstAirYear / 10) * 10
      totals[decade] = (totals[decade] || 0) + s.totalRuntimeWatched
    }
  })
  return Object.entries(totals)
    .map(([decade, mins]) => ({ decade: `${decade}s`, hours: Math.round(mins / 60) }))
    .sort((a, b) => a.decade.localeCompare(b.decade))
}

export function totalEpisodesWatched(data: TvSeries[]): number {
  return data.reduce((sum, s) => sum + (s.episodesWatched || 0), 0)
}

export function completionRate(data: TvSeries[]): number {
  const total = data.reduce((sum, s) => sum + (s.totalEpisodes || 0), 0)
  const watched = totalEpisodesWatched(data)
  if (!total) return 0
  return Math.round((watched / total) * 100)
}

export function topGenreByWatchTime(data: TvSeries[]): string {
  const totals: Record<string, number> = Object.create(null)
  data.forEach(s => {
    if (s.totalRuntimeWatched > 0) {
      s.genres.forEach(g => { totals[g] = (totals[g] || 0) + s.totalRuntimeWatched })
    }
  })
  const entries = Object.entries(totals)
  if (!entries.length) return '–'
  return entries.sort((a, b) => b[1] - a[1])[0][0]
}

export function watchTimeByYear(data: TvSeries[]): { year: number; hours: number }[] {
  const totals: Record<number, number> = {}
  data.forEach(s => {
    if (s.firstAirYear != null && s.totalRuntimeWatched > 0) {
      totals[s.firstAirYear] = (totals[s.firstAirYear] || 0) + s.totalRuntimeWatched
    }
  })
  return Object.entries(totals)
    .map(([year, mins]) => ({ year: Number(year), hours: Math.round(mins / 60) }))
    .sort((a, b) => a.year - b.year)
}

export function completionByGenre(data: TvSeries[]): { genre: string; pct: number }[] {
  const acc: Record<string, { watched: number; total: number }> = Object.create(null)
  data.forEach(s => {
    if (!s.totalEpisodes) return
    s.genres.forEach(g => {
      if (!acc[g]) acc[g] = { watched: 0, total: 0 }
      acc[g].watched += s.episodesWatched || 0
      acc[g].total += s.totalEpisodes
    })
  })
  return Object.entries(acc)
    .filter(([, { total }]) => total > 0)
    .map(([genre, { watched, total }]) => ({ genre, pct: Math.round((watched / total) * 100) }))
    .sort((a, b) => b.pct - a.pct)
}

export function topActors(data: TvSeries[], n = 10): NameCount[] {
  const counts: Record<string, number> = Object.create(null)
  data.forEach(s => s.actors.forEach(a => { counts[a] = (counts[a] || 0) + 1 }))
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
}

export function topCreators(data: TvSeries[], n = 10): NameCount[] {
  const counts: Record<string, number> = Object.create(null)
  data.forEach(s => s.creators.forEach(c => { counts[c] = (counts[c] || 0) + 1 }))
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', ja: 'Japanese', ko: 'Korean', fr: 'French',
  de: 'German', es: 'Spanish', zh: 'Chinese', it: 'Italian',
  pt: 'Portuguese', hi: 'Hindi',
}

export function languageDistribution(data: TvSeries[], n = 10): NameValue[] {
  const counts: Record<string, number> = Object.create(null)
  data.forEach(s => {
    if (s.language == null) return
    const name = lookup(LANGUAGE_NAMES, s.language) ?? s.language.toUpperCase()
    counts[name] = (counts[name] || 0) + 1
  })
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n)
}

export function ageRatingDistribution(data: TvSeries[]): NameValue[] {
  const counts: Record<string, number> = Object.create(null)
  data.forEach(s => {
    if (s.ageRating == null) return
    counts[s.ageRating] = (counts[s.ageRating] || 0) + 1
  })
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export function seasonsWatchedDepth(data: TvSeries[]): { depth: string; count: number }[] {
  const buckets = [
    { depth: '1 season',   count: 0 },
    { depth: '2 seasons',  count: 0 },
    { depth: '3 seasons',  count: 0 },
    { depth: '4+ seasons', count: 0 },
  ]
  data.forEach(s => {
    const n = s.seasonsWatched.length
    if (n === 0) return
    if (n <= 3) buckets[n - 1].count++
    else buckets[3].count++
  })
  return buckets
}
