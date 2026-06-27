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
  totalHoursWatched,
  totalMinutesWatched,
  totalYearsWatched,
  uniqueGenres,
} from '../utils/derive'

interface Props {
  data: TvSeries[]
}

export const StatsBar = memo(function StatsBar({ data }: Props) {
  const screens = Grid.useBreakpoint()

  const stats = useMemo(() => ({
    totalEpisodes: data.reduce((sum, s) => sum + (s.episodesWatched || 0), 0),
    topNetwork: networkDistribution(data, 1)[0]?.name ?? '–',
    hours: totalHoursWatched(data),
    rating: avgRating(data),
    genres: uniqueGenres(data).length,
    completion: completionRate(data),
    topGenre: topGenreByWatchTime(data),
    minutes: totalMinutesWatched(data),
    years: totalYearsWatched(data),
  }), [data])

  const cols = screens.xl ? 5 : screens.md ? 4 : 2

  const cards = [
    <Statistic title="Shows Watched" value={data.length} prefix={<VideoCameraOutlined />} />,
    <Statistic title="Hours Watched" value={stats.hours} suffix="h" prefix={<ClockCircleOutlined />} />,
    <Statistic title="Avg Rating" value={stats.rating} prefix={<StarOutlined />} suffix="/ 10" />,
    <Statistic title="Unique Genres" value={stats.genres} prefix={<TagsOutlined />} />,
    <Statistic title="Completion Rate" value={stats.completion} suffix="%" prefix={<TrophyOutlined />} />,
    <Statistic title="Episodes Watched" value={stats.totalEpisodes.toLocaleString()} prefix={<PlayCircleOutlined />} />,
    <Statistic title="Top Genre" value={stats.topGenre} prefix={<FireOutlined />} />,
    <Statistic title="Top Network" value={stats.topNetwork} prefix={<WifiOutlined />} />,
    <Statistic title="Minutes Watched" value={stats.minutes} suffix="m" prefix={<ClockCircleOutlined />} />,
    <Statistic title="Years Watched" value={stats.years} precision={2} suffix="y" prefix={<ClockCircleOutlined />} />,
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 16,
      marginBottom: 24,
    }}>
      {cards.map((card, i) => (
        <div key={i}>
          <Card style={{ height: '100%' }}>{card}</Card>
        </div>
      ))}
    </div>
  )
})
