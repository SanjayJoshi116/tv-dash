import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Card, Tag, Typography } from 'antd'
import { StarFilled } from '@ant-design/icons'
import type { TvSeries } from '../types/series'

const { Text, Title } = Typography

const GENRE_COLORS: Record<string, string> = {
  Animation: 'purple',
  Action: 'red',
  'Action & Adventure': 'red',
  Comedy: 'gold',
  Drama: 'blue',
  Fantasy: 'geekblue',
  'Sci-Fi & Fantasy': 'geekblue',
  Mystery: 'cyan',
  Thriller: 'volcano',
  Romance: 'pink',
  Horror: 'magenta',
  Adventure: 'orange',
}

interface Props {
  series: TvSeries
}

export const ShowCard = memo(function ShowCard({ series }: Props) {
  const navigate = useNavigate()
  const ratingColor =
    series.voteAverage >= 8 ? '#52c41a' : series.voteAverage >= 6 ? '#faad14' : '#f5222d'

  const handleSelect = () => navigate(`/shows/${series.tvId}`)

  return (
    <Card
      hoverable
      onClick={handleSelect}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect() } }}
      tabIndex={0}
      role="button"
      aria-label={series.name}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { padding: 12, display: 'flex', flexDirection: 'column', flex: 1 } }}
      cover={
        <div style={{ position: 'relative', paddingTop: '150%', overflow: 'hidden', background: '#1a1a2e' }}>
          {series.posterUrl ? (
            <img
              src={series.posterUrl}
              alt={series.name}
              loading="lazy"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
              📺
            </div>
          )}
          {series.voteAverage > 0 && (
            <Badge
              count={
                <span style={{ background: ratingColor, color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 12, fontWeight: 700 }}>
                  <StarFilled style={{ marginRight: 3 }} />{series.voteAverage.toFixed(1)}
                </span>
              }
              style={{ position: 'absolute', top: 8, right: 8 }}
            />
          )}
          {series.status === 'Returning Series' && (
            <span style={{ position: 'absolute', top: 8, left: 8, background: '#52c41a', color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 11 }}>
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
        {series.firstAirYear} · {series.episodesWatched} eps watched
      </Text>
      <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {series.genres.slice(0, 2).map(g => (
          <Tag key={g} color={GENRE_COLORS[g] ?? 'default'} style={{ fontSize: 11, margin: 0 }}>
            {g}
          </Tag>
        ))}
      </div>
    </Card>
  )
})
