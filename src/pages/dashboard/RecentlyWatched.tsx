import type { NavigateFunction } from 'react-router-dom'
import { Col, Row, Typography } from 'antd'
import { HistoryOutlined, StarFilled } from '@ant-design/icons'
import type { TvSeries } from '../../types/series'
import type { Theme } from '../../themes'
import { formatRating } from '../../utils/derive'
import { ShowRowCard } from './ShowRowCard'

const { Title, Text } = Typography

interface Props {
  shows: TvSeries[]
  theme: Theme
  navigate: NavigateFunction
}

export function RecentlyWatched({ shows, theme, navigate }: Props) {
  return (
    <div>
      <Title level={5} style={{ marginBottom: 10 }}><HistoryOutlined style={{ marginRight: 6 }} />Recently Watched</Title>
      <Row gutter={[10, 10]}>
        {shows.map(series => (
          <Col key={series.tvId} xs={24} sm={8}>
            <ShowRowCard series={series} bg={theme.posterFallbackBg} navigate={navigate}>
              <Text strong ellipsis style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>{series.name}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>{series.firstAirYear ?? '–'}</Text>
              {series.voteAverage != null && (
                <Text type="secondary" style={{ fontSize: 11 }}> · <StarFilled style={{ color: theme.star, fontSize: 10 }} /> {formatRating(series.voteAverage)}</Text>
              )}
              <Text type="secondary" style={{ display: 'block', fontSize: 11, marginTop: 2 }}>{series.episodesWatched}/{series.totalEpisodes} eps</Text>
            </ShowRowCard>
          </Col>
        ))}
      </Row>
    </div>
  )
}
