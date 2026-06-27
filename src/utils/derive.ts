import type { TvSeries } from '../types/series'

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

export function avgRating(data: TvSeries[]): string {
  const rated = data.filter(s => s.voteAverage > 0)
  if (!rated.length) return '–'
  const avg = rated.reduce((sum, s) => sum + s.voteAverage, 0) / rated.length
  return avg.toFixed(1)
}

export function uniqueGenres(data: TvSeries[]): string[] {
  const set = new Set<string>()
  data.forEach(s => s.genres.forEach(g => set.add(g)))
  return Array.from(set).sort()
}

export function genreDistribution(data: TvSeries[]): { name: string; value: number }[] {
  const counts: Record<string, number> = {}
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
    if (s.voteAverage > 0) {
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

export function formatRuntime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function statusDistribution(data: TvSeries[]): { name: string; value: number }[] {
  const counts: Record<string, number> = {}
  data.forEach(s => {
    if (s.status) counts[s.status] = (counts[s.status] || 0) + 1
  })
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export function networkDistribution(data: TvSeries[], n = 10): { name: string; value: number }[] {
  const counts: Record<string, number> = {}
  data.forEach(s => s.networks.forEach(net => { counts[net] = (counts[net] || 0) + 1 }))
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n)
}

export function watchTimeByDecade(data: TvSeries[]): { decade: string; hours: number }[] {
  const totals: Record<number, number> = {}
  data.forEach(s => {
    if (s.firstAirYear && s.totalRuntimeWatched > 0) {
      const decade = Math.floor(s.firstAirYear / 10) * 10
      totals[decade] = (totals[decade] || 0) + s.totalRuntimeWatched
    }
  })
  return Object.entries(totals)
    .map(([decade, mins]) => ({ decade: `${decade}s`, hours: Math.round(mins / 60) }))
    .sort((a, b) => a.decade.localeCompare(b.decade))
}

export function completionRate(data: TvSeries[]): number {
  const total = data.reduce((sum, s) => sum + (s.totalEpisodes || 0), 0)
  const watched = data.reduce((sum, s) => sum + (s.episodesWatched || 0), 0)
  if (!total) return 0
  return Math.round((watched / total) * 100)
}

export function topGenreByWatchTime(data: TvSeries[]): string {
  const totals: Record<string, number> = {}
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
    if (s.firstAirYear && s.totalRuntimeWatched > 0) {
      totals[s.firstAirYear] = (totals[s.firstAirYear] || 0) + s.totalRuntimeWatched
    }
  })
  return Object.entries(totals)
    .map(([year, mins]) => ({ year: Number(year), hours: Math.round(mins / 60) }))
    .sort((a, b) => a.year - b.year)
}

export function completionByGenre(data: TvSeries[]): { genre: string; pct: number }[] {
  const acc: Record<string, { watched: number; total: number }> = {}
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

export function topActors(data: TvSeries[], n = 10): { name: string; count: number }[] {
  const counts: Record<string, number> = {}
  data.forEach(s => s.actors.forEach(a => { counts[a] = (counts[a] || 0) + 1 }))
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
}

export function topCreators(data: TvSeries[], n = 10): { name: string; count: number }[] {
  const counts: Record<string, number> = {}
  data.forEach(s => s.creators.forEach(c => { counts[c] = (counts[c] || 0) + 1 }))
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
}
