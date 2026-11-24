import { useMemo } from 'react'
import { Button, Card, Col, Input, Row, Select, Tag, Typography } from 'antd'
import { CloseCircleOutlined } from '@ant-design/icons'
import type { TvSeries } from '../types/series'
import type { Filters } from '../types/filters'
import { uniqueGenres } from '../utils/derive'
import { SECTION_GAP, SORT_OPTIONS, cardStyle, sortStatuses } from '../constants/ui'
import { useTheme } from '../ThemeContext'

const { Text } = Typography

interface Props {
  data: TvSeries[]
  filters: Filters
  onChange: (f: Filters) => void
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

  const hasActiveFilters = !!filters.search || filters.genres.length > 0 || !!filters.status

  return (
    <Card
      size="small"
      style={{ marginBottom: SECTION_GAP, ...cardStyle(theme.isDark) }}
    >
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={8}>
        <Input.Search
          id="shows-search"
          name="search"
          placeholder="Search by title, person, genre, keyword…"
          aria-label="Search shows"
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          allowClear
        />
      </Col>
      <Col xs={24} sm={6}>
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
      <Col xs={24} sm={6} md={5}>
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
      <Col xs={24} sm={6} md={5}>
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

    {(hasActiveFilters || resultCount !== data.length) && (
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

        {hasActiveFilters && (
          <Button
            type="link"
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => onChange({ ...filters, search: '', genres: [], status: '' })}
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
