import type { NavigateFunction } from 'react-router-dom'
import { Button, Card, Divider, Typography } from 'antd'
import { CheckCircleOutlined, StarFilled } from '@ant-design/icons'
import type { TvSeries } from '../../types/series'
import type { Theme } from '../../themes'
import { formatRating } from '../../utils/derive'
import { STATUSES, cardStyle } from '../../constants/ui'
import { showLinkProps } from '../../utils/showLink'
import { showsLink } from '../../utils/showsLink'
import { PosterThumb } from '../../components/PosterThumb'

const { Text } = Typography

interface Props {
  shows: TvSeries[]
  theme: Theme
  navigate: NavigateFunction
}

// Compact list of unstarted shows, or "All caught up" when there are none
export function NotStartedList({ shows, theme, navigate }: Props) {
  const baseCard = cardStyle(theme.isDark)
  if (shows.length === 0) {
    return (
      <Card size="small" style={baseCard}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px 8px' }}>
          <CheckCircleOutlined style={{ fontSize: 28, color: STATUSES['Returning Series'].hex, marginBottom: 8 }} />
          <Text strong style={{ fontSize: 13 }}>All caught up</Text>
          <Text type="secondary" style={{ fontSize: 12, marginTop: 2 }}>Every show in your list has been started</Text>
        </div>
      </Card>
    )
  }

  return (
    <Card
      title="Not Started"
      size="small"
      style={baseCard}
      extra={<Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate(showsLink({ progress: 'notStarted' }))}>View all</Button>}
    >
      {shows.map((series, i) => (
        <div key={series.tvId}>
          {i > 0 && <Divider style={{ margin: '8px 0' }} />}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            {...showLinkProps(series.tvId, navigate)}
            aria-label={series.name}
          >
            <PosterThumb series={series} width={36} height={54} iconSize={14} bg={theme.posterFallbackBg} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text strong ellipsis style={{ display: 'block', fontSize: 13 }}>{series.name}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {series.firstAirYear ?? '–'}
                {series.voteAverage != null && <> · <StarFilled style={{ color: theme.star, fontSize: 10 }} /> {formatRating(series.voteAverage)}</>}
              </Text>
            </div>
          </div>
        </div>
      ))}
    </Card>
  )
}
