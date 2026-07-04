import { memo, useMemo } from 'react'
import { Card, Grid, Statistic } from 'antd'
import {
  ClockCircleOutlined,
  FireOutlined,
  PlayCircleOutlined,
  StarOutlined,
  TagsOutlined,
  TrophyOutlined,
  VideoCameraOutlined,
  WifiOutlined,
} from '@ant-design/icons'
import type { TvSeries } from '../types/series'
import {
  avgRating,
  completionRate,
  networkDistribution,
  topGenreByWatchTime,
  totalEpisodesWatched,
  totalHoursWatched,
  totalMinutesWatched,
  totalYearsWatched,
  uniqueGenres,
} from '../utils/derive'
import { responsiveColumns } from '../constants/ui'

interface Props {
  data: TvSeries[]
}

export const StatsBar = memo(function StatsBar({ data }: Props) {
  const screens = Grid.useBreakpoint()

  const stats = useMemo(() => ({
    totalEpisodes: totalEpisodesWatched(data),
    topNetwork: networkDistribution(data, 1)[0]?.name ?? '–',
    hours: totalHoursWatched(data),
    rating: avgRating(data),
    genres: uniqueGenres(data).length,
    completion: completionRate(data),
    topGenre: topGenreByWatchTime(data),
    minutes: totalMinutesWatched(data),
    years: totalYearsWatched(data),
  }), [data])

  const cols = responsiveColumns(screens, { xl: 5, md: 4, base: 2 })

  const cards = [
    { key: 'shows-watched', title: 'Shows Watched', value: data.length, prefix: <VideoCameraOutlined /> },
    { key: 'avg-rating', title: 'Avg Rating', value: stats.rating, prefix: <StarOutlined />, suffix: '/ 10' },
    { key: 'unique-genres', title: 'Unique Genres', value: stats.genres, prefix: <TagsOutlined /> },
    { key: 'completion-rate', title: 'Completion Rate', value: stats.completion, prefix: <TrophyOutlined />, suffix: '%' },
    { key: 'episodes-watched', title: 'Episodes Watched', value: stats.totalEpisodes.toLocaleString(), prefix: <PlayCircleOutlined /> },
    { key: 'top-genre', title: 'Top Genre', value: stats.topGenre, prefix: <FireOutlined /> },
    { key: 'top-network', title: 'Top Network', value: stats.topNetwork, prefix: <WifiOutlined /> },
    { key: 'hours-watched', title: 'Hours Watched', value: stats.hours, prefix: <ClockCircleOutlined />, suffix: 'h' },
    { key: 'minutes-watched', title: 'Minutes Watched', value: stats.minutes, prefix: <ClockCircleOutlined />, suffix: 'm' },
    { key: 'years-watched', title: 'Years Watched', value: stats.years, precision: 2, prefix: <ClockCircleOutlined />, suffix: 'y' },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 16,
      marginBottom: 24,
    }}>
      {cards.map(card => (
        <div key={card.key} title={String(card.value)}>
          <Card style={{ height: '100%' }}>
            <Statistic
              title={card.title}
              value={card.value}
              prefix={card.prefix}
              suffix={card.suffix}
              precision={card.precision}
              valueStyle={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            />
          </Card>
        </div>
      ))}
    </div>
  )
})
