import type { TvSeries } from './series'

// Shows-page filter state (FilterBar UI + ShowsPage filtering/persistence)

// TvSeries fields holding a number (or null = unknown)
type NumericField = { [K in keyof TvSeries]: TvSeries[K] extends number | null ? K : never }[keyof TvSeries]
type AssertNumeric<K extends NumericField> = K

// Sorted descending, nulls last — a rename or a non-numeric field fails to compile
export type NumericSortKey = AssertNumeric<'voteAverage' | 'popularity' | 'firstAirYear' | 'totalRuntimeWatched'>
export type SortKey = 'recentFirst' | 'name' | NumericSortKey

export interface Filters {
  search: string
  genres: TvSeries['genres']
  // '' = no status filter (not a real status), so not typed as TvSeries['status']
  status: string
  sortBy: SortKey
}
