import { Col, Input, Row, Select } from 'antd'
import type { TvSeries } from '../types/series'
import { uniqueGenres } from '../utils/derive'

export type SortKey = 'voteAverage' | 'popularity' | 'firstAirYear' | 'totalRuntimeWatched' | 'name'

export interface Filters {
  search: string
  genres: string[]
  status: string
  sortBy: SortKey
}

interface Props {
  data: TvSeries[]
  filters: Filters
  onChange: (f: Filters) => void
}

const STATUS_OPTIONS = ['', 'Ended', 'Returning Series', 'Canceled']

export function FilterBar({ data, filters, onChange }: Props) {
  const genres = uniqueGenres(data)

  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={8}>
        <Input.Search
          placeholder="Search shows..."
          aria-label="Search shows"
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          allowClear
        />
      </Col>
      <Col xs={24} sm={6}>
        <Select
          mode="multiple"
          placeholder="Filter by genre"
          aria-label="Filter by genre"
          style={{ width: '100%' }}
          value={filters.genres}
          onChange={genres => onChange({ ...filters, genres })}
          options={genres.map(g => ({ label: g, value: g }))}
          maxTagCount="responsive"
          allowClear
        />
      </Col>
      <Col xs={24} sm={6} md={5}>
        <Select
          placeholder="Status"
          aria-label="Filter by status"
          style={{ width: '100%' }}
          value={filters.status || undefined}
          onChange={status => onChange({ ...filters, status: status ?? '' })}
          allowClear
          options={STATUS_OPTIONS.filter(Boolean).map(s => ({ label: s, value: s }))}
        />
      </Col>
      <Col xs={24} sm={6} md={5}>
        <Select
          aria-label="Sort shows by"
          style={{ width: '100%' }}
          value={filters.sortBy}
          onChange={sortBy => onChange({ ...filters, sortBy })}
          options={[
            { label: 'Rating ↓', value: 'voteAverage' },
            { label: 'Popularity ↓', value: 'popularity' },
            { label: 'Year ↓', value: 'firstAirYear' },
            { label: 'Watch time ↓', value: 'totalRuntimeWatched' },
            { label: 'Name A–Z', value: 'name' },
          ]}
        />
      </Col>
    </Row>
  )
}
