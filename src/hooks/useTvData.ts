import { useCallback, useEffect, useState } from 'react'
import Papa from 'papaparse'
import type { TvSeries } from '../types/series'

const REQUIRED_COLUMNS = ['Name', 'Vote Average', 'Genres', 'Status']
const FETCH_TIMEOUT_MS = 10_000

function splitList(val: string | null | undefined): string[] {
  if (!val || String(val).trim() === '') return []
  return String(val).split(',').map(s => s.trim()).filter(Boolean)
}

function parseNumList(val: string | null | undefined): number[] {
  return splitList(val).map(Number).filter(n => !isNaN(n))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: Record<string, any>): TvSeries {
  const runtime = row['Episode Runtime']
  return {
    tvId: Number(row['TV ID']),
    name: String(row['Name'] ?? ''),
    language: String(row['Language'] ?? ''),
    seasons: Number(row['Seasons']) || 0,
    episodeRuntime: runtime && runtime !== 'N/A' ? Number(runtime) : null,
    firstAirYear: Number(row['First Air Year']) || 0,
    genres: splitList(row['Genres']),
    creators: splitList(row['Creators']),
    networks: splitList(row['Networks']),
    status: String(row['Status'] ?? ''),
    totalEpisodes: Number(row['Total Episodes']) || 0,
    lastEpisodeAirDate: String(row['Last Episode Air Date'] ?? ''),
    popularity: Number(row['Popularity']) || 0,
    voteCount: Number(row['Vote Count']) || 0,
    voteAverage: Number(row['Vote Average']) || 0,
    actors: splitList(row['Actors/Actresses']),
    keywords: splitList(row['Keywords/Tags']),
    firstAirDate: String(row['First Air Date'] ?? ''),
    overview: String(row['Overview'] ?? ''),
    tagline: String(row['Tagline'] ?? ''),
    posterUrl: String(row['Poster URL'] ?? ''),
    ageRating: String(row['Age Rating'] ?? ''),
    seasonsWatched: parseNumList(row['Seasons Watched']),
    episodesWatched: Number(row['Episodes Watched']) || 0,
    totalRuntimeWatched: Number(row['Total Runtime Watched (min)']) || 0,
  }
}

export function useTvData() {
  const [data, setData] = useState<TvSeries[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    fetch('/tv_series.csv', { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`)
        return r.text()
      })
      .then(text => {
        const result = Papa.parse<Record<string, unknown>>(text, {
          header: true,
          skipEmptyLines: true,
        })

        if (result.errors.length > 0 && result.data.length === 0) {
          throw new Error(`CSV parse error: ${result.errors[0].message}`)
        }

        if (result.data.length > 0) {
          const cols = Object.keys(result.data[0])
          const missing = REQUIRED_COLUMNS.filter(c => !cols.includes(c))
          if (missing.length > 0) {
            throw new Error(`CSV missing required columns: ${missing.join(', ')}`)
          }
        }

        setData(result.data.map(mapRow))
        setLoading(false)
      })
      .catch(err => {
        if ((err as Error).name === 'AbortError') {
          setError('Request timed out. Check that tv_series.csv is in the public/ folder.')
        } else {
          setError(String(err instanceof Error ? err.message : err))
        }
        setLoading(false)
      })
      .finally(() => clearTimeout(timeoutId))
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
