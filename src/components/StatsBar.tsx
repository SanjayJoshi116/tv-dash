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

export function StatsBar({ data }: Props) {
  const screens = Grid.useBreakpoint()
  const totalEpisodes = data.reduce((sum, s) => sum + (s.episodesWatched || 0), 0)
  const topNetwork = networkDistribution(data, 1)[0]?.name ?? '–'
  const cols = screens.xl ? 5 : screens.md ? 4 : 2

  const cards = [
    <Statistic title="Shows Watched" value={data.length} prefix={<VideoCameraOutlined />} />,
    <Statistic title="Hours Watched" value={totalHoursWatched(data)} suffix="h" prefix={<ClockCircleOutlined />} />,
    <Statistic title="Avg Rating" value={avgRating(data)} prefix={<StarOutlined />} suffix="/ 10" />,
    <Statistic title="Unique Genres" value={uniqueGenres(data).length} prefix={<TagsOutlined />} />,
    <Statistic title="Completion Rate" value={completionRate(data)} suffix="%" prefix={<TrophyOutlined />} />,
    <Statistic title="Episodes Watched" value={totalEpisodes.toLocaleString()} prefix={<PlayCircleOutlined />} />,
    <Statistic title="Top Genre" value={topGenreByWatchTime(data)} prefix={<FireOutlined />} />,
    <Statistic title="Top Network" value={topNetwork} prefix={<WifiOutlined />} />,
    <Statistic title="Minutes Watched" value={totalMinutesWatched(data)} suffix="m" prefix={<ClockCircleOutlined />} />,
    <Statistic title="Years Watched" value={totalYearsWatched(data)} precision={2} suffix="y" prefix={<ClockCircleOutlined />} />,
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
}
