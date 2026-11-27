import { useMemo } from 'react'
import { Button, Card, Col, Input, Row, Select, Tag, Typography } from 'antd'
import { CloseCircleOutlined } from '@ant-design/icons'
import type { TvSeries } from '../types/series'
import type { Filters } from '../types/filters'
import { uniqueGenres } from '../utils/derive'
import { PROGRESS_LABELS, PROGRESS_OPTIONS, SECTION_GAP, SORT_OPTIONS, cardStyle, sortStatuses } from '../constants/ui'
import { useTheme } from '../ThemeContext'
import { SHOWS_SEARCH_ID } from '../utils/searchFocus'
import { clearFilters, hasActiveFilters } from '../utils/showFilters'

const { Text } = Typography

// replace: update the current history entry instead of adding one (search typing)
export interface FilterChangeOptions {
  replace?: boolean
}

interface Props {
  data: TvSeries[]
  filters: Filters
  onChange: (f: Filters, options?: FilterChangeOptions) => void
  resultCount: number
}

export function FilterBar({ data, filters, onChange, resultCount }: Props) {
  const genreOptions = useMemo(() => uniqueGenres(data).map(g => ({ label: g, value: g })), [data])
  // From the loaded data (like genres): no options that always give 0 results, and unknown
  // statuses stay selectable
  const statusOptions = useMemo(
    () => sortStatuses(data.map(s => s.status).filter(Boolean)).map(s => ({ label: s, value: s })),
    [data]
  )
  const theme = useTheme()

  const filtersActive = hasActiveFilters(filters)

  return (
    <Card
      size="small"
      style={{ marginBottom: SECTION_GAP, ...cardStyle(theme.isDark) }}
    >
    <Row gutter={[16, 16]}>
      {/* sm–lg: 12 / 12, then 8 / 8 / 8; xl+: one row 6 / 6 / 4 / 4 / 4 (one row at md / lg truncated every label) */}
      <Col xs={24} sm={12} xl={6}>
        <Input.Search
          id={SHOWS_SEARCH_ID}
          name="search"
          placeholder="Search by title, person, genre, keyword…"
          aria-label="Search shows"
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value }, { replace: true })}
          allowClear
        />
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <Select
          id="shows-genre-filter"
          mode="multiple"
          placeholder="Filter by genre"
          aria-label="Filter by genre"
          style={{ width: '100%' }}
          value={filters.genres}
          onChange={genres => onChange({ ...filters, genres })}
          options={genreOptions}
          maxTagCount="responsive"
          allowClear
        />
      </Col>
      <Col xs={24} sm={8} xl={4}>
        <Select
          id="shows-status-filter"
          placeholder="Status"
          aria-label="Filter by status"
          style={{ width: '100%' }}
          value={filters.status || undefined}
          onChange={status => onChange({ ...filters, status: status ?? '' })}
          allowClear
          options={statusOptions}
        />
      </Col>
      <Col xs={24} sm={8} xl={4}>
        <Select
          id="shows-progress-filter"
          placeholder="Progress"
          aria-label="Filter by progress"
          style={{ width: '100%' }}
          value={filters.progress === 'all' ? undefined : filters.progress}
          onChange={progress => onChange({ ...filters, progress: progress ?? 'all' })}
          allowClear
          options={PROGRESS_OPTIONS}
        />
      </Col>
      <Col xs={24} sm={8} xl={4}>
        <Select
          id="shows-sort"
          aria-label="Sort shows by"
          style={{ width: '100%' }}
          value={filters.sortBy}
          onChange={sortBy => onChange({ ...filters, sortBy })}
          options={SORT_OPTIONS}
        />
      </Col>
    </Row>

    {(filtersActive || resultCount !== data.length) && (
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${theme.borderColor}` }}>
        <Text type="secondary" style={{ fontSize: 12 }}>{resultCount} of {data.length} shows</Text>

        {filters.search && (
          <Tag closable onClose={() => onChange({ ...filters, search: '' })} style={{ margin: 0 }}>
            Search: &quot;{filters.search}&quot;
          </Tag>
        )}
        {filters.genres.map(g => (
          <Tag key={g} closable onClose={() => onChange({ ...filters, genres: filters.genres.filter(x => x !== g) })} style={{ margin: 0 }}>
            {g}
          </Tag>
        ))}
        {filters.status && (
          <Tag closable onClose={() => onChange({ ...filters, status: '' })} style={{ margin: 0 }}>
            {filters.status}
          </Tag>
        )}
        {filters.progress !== 'all' && (
          <Tag closable onClose={() => onChange({ ...filters, progress: 'all' })} style={{ margin: 0 }}>
            {PROGRESS_LABELS[filters.progress]}
          </Tag>
        )}

        {filtersActive && (
          <Button
            type="link"
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => onChange(clearFilters(filters.sortBy))}
            style={{ padding: 0, marginLeft: 'auto' }}
          >
            Reset filters
          </Button>
        )}
      </div>
    )}
    </Card>
  )
}
