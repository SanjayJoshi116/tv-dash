import type { NavigateFunction } from 'react-router-dom'
import { Button, Col, Progress, Row, Segmented, Tag, Typography } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'
import type { TvSeries } from '../../types/series'
import type { Theme } from '../../themes'
import { completionRate, formatRuntime, minutesLeft } from '../../utils/derive'
import type { ContinueOrder } from '../../utils/showFilters'
import { showsLink } from '../../utils/showsLink'
import { SECTION_GAP, STATUSES } from '../../constants/ui'
import { ShowRowCard } from './ShowRowCard'
import { CONTINUE_ORDER_OPTIONS } from './continueOrder'

const { Title, Text } = Typography

interface Props {
  // Already filtered, ordered and sliced by the page (the order picks which shows are listed)
  shows: TvSeries[]
  order: ContinueOrder
  onOrderChange: (order: ContinueOrder) => void
  theme: Theme
  navigate: NavigateFunction
}

export function ContinueWatching({ shows, order, onOrderChange, theme, navigate }: Props) {
  return (
    <div style={{ marginBottom: SECTION_GAP }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <Title level={5} style={{ margin: 0, marginRight: 'auto' }}><PlayCircleOutlined style={{ marginRight: 6 }} />Continue Watching</Title>
        <Segmented<ContinueOrder>
          size="small"
          aria-label="Continue Watching order"
          options={CONTINUE_ORDER_OPTIONS}
          value={order}
          onChange={onOrderChange}
        />
        <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate(showsLink({ progress: 'inProgress' }))}>View all</Button>
      </div>
      <Row gutter={[10, 10]}>
        {shows.map(series => {
          const pct = completionRate([series])
          const left = minutesLeft(series)
          return (
            <Col key={series.tvId} xs={24} sm={12} xl={8}>
              <ShowRowCard series={series} bg={theme.posterFallbackBg} navigate={navigate}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text strong ellipsis style={{ display: 'block', fontSize: 13, flex: 1, minWidth: 0 }}>{series.name}</Text>
                  {series.status === 'Returning Series' && (
                    <Tag color={STATUSES['Returning Series'].tag} style={{ fontSize: 10, margin: 0, lineHeight: '16px', padding: '0 4px' }}>New eps</Tag>
                  )}
                </div>
                <Progress percent={pct} size="small" strokeColor={theme.token.colorPrimary} showInfo={false} style={{ marginBottom: 3 }} />
                <Text type="secondary" ellipsis style={{ display: 'block', fontSize: 11 }}>{series.episodesWatched}/{series.totalEpisodes} eps · {pct}%{left != null && ` · ${formatRuntime(left)} left`}</Text>
              </ShowRowCard>
            </Col>
          )
        })}
      </Row>
    </div>
  )
}
