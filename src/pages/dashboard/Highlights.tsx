import type { CSSProperties, ReactNode } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import { Card, Col, Row, Typography } from 'antd'
import { CalendarOutlined, ClockCircleOutlined, PlayCircleOutlined, StarFilled, TrophyOutlined } from '@ant-design/icons'
import type { TvSeries } from '../../types/series'
import type { Theme } from '../../themes'
import { formatRating, formatRuntime } from '../../utils/derive'
import { SECTION_GAP, cardStyle, ratingColor } from '../../constants/ui'
import { HIGHLIGHT_THUMB, ShowRowCard } from './ShowRowCard'

const { Title, Text } = Typography

interface Props {
  topShow: TvSeries | undefined
  topRated: TvSeries | undefined
  newestShow: TvSeries | undefined
  theme: Theme
  navigate: NavigateFunction
}

export function Highlights({ topShow, topRated, newestShow, theme, navigate }: Props) {
  const highlights: { label: string; icon: ReactNode; series: TvSeries | undefined; detail: (s: TvSeries) => ReactNode }[] = [
    {
      label: 'Most Watched',
      icon: <PlayCircleOutlined />,
      series: topShow && topShow.totalRuntimeWatched > 0 ? topShow : undefined,
      detail: s => <Text type="secondary" style={{ fontSize: 12 }}><ClockCircleOutlined /> {formatRuntime(s.totalRuntimeWatched)} watched</Text>,
    },
    {
      label: 'Top Rated',
      icon: <StarFilled />,
      series: topRated,
      detail: s => s.voteAverage != null && <Text style={{ fontSize: 12, color: ratingColor(s.voteAverage, theme) }}><StarFilled style={{ fontSize: 11 }} /> {formatRating(s.voteAverage)} rating</Text>,
    },
    {
      label: 'Newest Release',
      icon: <CalendarOutlined />,
      series: newestShow,
      detail: s => <Text type="secondary" style={{ fontSize: 12 }}><CalendarOutlined /> {s.firstAirYear ?? '–'}</Text>,
    },
  ]

  const highlightStyle: CSSProperties = { ...cardStyle(theme.isDark), borderTop: `3px solid ${theme.token.colorPrimary}`, height: '100%' }
  const highlightHeader = (icon: ReactNode, label: string) => (
    <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
      {icon}{label}
    </Text>
  )

  return (
    <div style={{ marginBottom: SECTION_GAP }}>
      <Title level={5} style={{ marginBottom: 10 }}><TrophyOutlined style={{ marginRight: 6 }} />Highlights</Title>
      <Row gutter={[10, 10]}>
        {highlights.map(({ label, icon, series, detail }) => (
          <Col key={label} xs={24} sm={8}>
            {series ? (
              <ShowRowCard
                series={series}
                bg={theme.posterFallbackBg}
                navigate={navigate}
                thumb={HIGHLIGHT_THUMB}
                header={highlightHeader(icon, label)}
                ariaLabel={`${label}: ${series.name}`}
                style={highlightStyle}
                padding={14}
              >
                <Text strong ellipsis style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>{series.name}</Text>
                {detail(series)}
              </ShowRowCard>
            ) : (
              <Card size="small" style={highlightStyle} styles={{ body: { padding: 14 } }}>
                {highlightHeader(icon, label)}
                <Text type="secondary">No data</Text>
              </Card>
            )}
          </Col>
        ))}
      </Row>
    </div>
  )
}
