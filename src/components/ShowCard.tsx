import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Card, Tag, Typography } from 'antd'
import { StarFilled } from '@ant-design/icons'
import type { TvSeries } from '../types/series'
import { genreTagColor, ratingTierColors, STATUSES } from '../constants/ui'
import { useTheme } from '../ThemeContext'
import { showLinkProps } from '../utils/showLink'
import { formatRating } from '../utils/derive'
import { PosterThumb } from './PosterThumb'

const { Text, Title } = Typography

interface Props {
  series: TvSeries
}

export const ShowCard = memo(function ShowCard({ series }: Props) {
  const navigate = useNavigate()
  const theme = useTheme()
  const badge = ratingTierColors(series.voteAverage, theme)

  return (
    <Card
      hoverable
      {...showLinkProps(series.tvId, navigate)}
      aria-label={series.name}
      style={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 10, overflow: 'hidden' }}
      styles={{ body: { padding: 12, display: 'flex', flexDirection: 'column', flex: 1 } }}
      cover={
        <div style={{ position: 'relative', paddingTop: '150%', overflow: 'hidden', background: theme.posterFallbackBg }}>
          <PosterThumb
            series={series}
            width="100%"
            height="100%"
            iconSize={40}
            bg={theme.posterFallbackBg}
            radius={0}
            style={{ position: 'absolute', inset: 0 }}
          />
          {series.voteAverage != null && (
            <Badge
              count={
                <span style={{ background: badge?.fill, color: badge?.onFill, borderRadius: 4, padding: '2px 6px', fontSize: 12, fontWeight: 700 }}>
                  <StarFilled style={{ marginRight: 3 }} />{formatRating(series.voteAverage)}
                </span>
              }
              style={{ position: 'absolute', top: 8, right: 8 }}
            />
          )}
          {series.status === 'Returning Series' && (
            <span style={{ position: 'absolute', top: 8, left: 8, background: STATUSES['Returning Series'].hex, color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 11 }}>
              Ongoing
            </span>
          )}
        </div>
      }
    >
      <Title level={5} ellipsis={{ rows: 2 }} style={{ marginBottom: 4, marginTop: 0 }}>
        {series.name}
      </Title>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {series.firstAirYear ?? '–'} · {series.episodesWatched} eps watched
      </Text>
      <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {series.genres.slice(0, 2).map(g => (
          <Tag key={g} color={genreTagColor(g)} style={{ fontSize: 11, margin: 0 }}>
            {g}
          </Tag>
        ))}
      </div>
    </Card>
  )
})
