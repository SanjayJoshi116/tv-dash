import { memo, useMemo } from 'react'
import { Grid } from 'antd'
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
  formatRating,
  networkDistribution,
  topGenreByWatchTime,
  totalEpisodesWatched,
  totalHoursWatched,
  totalMinutesWatched,
  totalYearsWatched,
  uniqueGenres,
} from '../utils/derive'
import { SECTION_GAP, SPACING, cardShadow, ratingColor, completionColor, responsiveColumns } from '../constants/ui'
import { StatCard } from './StatCard'
import { useTheme } from '../ThemeContext'

interface Props {
  data: TvSeries[]
}

export const StatsBar = memo(function StatsBar({ data }: Props) {
  const screens = Grid.useBreakpoint()
  const theme = useTheme()

  const stats = useMemo(() => {
    // Hours via totalHoursWatched (rounds the raw sum once) so it matches the Dashboard
    const minutes = totalMinutesWatched(data)
    return {
      totalEpisodes: totalEpisodesWatched(data),
      topNetwork: networkDistribution(data, 1)[0]?.name ?? '–',
      hours: totalHoursWatched(data),
      rating: avgRating(data),
      genres: uniqueGenres(data).length,
      completion: completionRate(data),
      topGenre: topGenreByWatchTime(data),
      minutes,
      years: totalYearsWatched(data),
    }
  }, [data])

  const cols = responsiveColumns(screens, { xl: 5, md: 4, base: 2 })
  const shadow = cardShadow(theme.isDark)
  const { chartColors } = theme

  const cards = [
    { key: 'shows-watched', title: 'Shows Watched', value: data.length, prefix: <VideoCameraOutlined />, color: chartColors[0] },
    { key: 'avg-rating', title: 'Avg Rating', value: formatRating(stats.rating), prefix: <StarOutlined />, suffix: '/ 10', color: ratingColor(stats.rating) ?? theme.chartText },
    { key: 'unique-genres', title: 'Unique Genres', value: stats.genres, prefix: <TagsOutlined />, color: chartColors[1] },
    { key: 'completion-rate', title: 'Completion Rate', value: stats.completion, prefix: <TrophyOutlined />, suffix: '%', color: completionColor(stats.completion) },
    { key: 'episodes-watched', title: 'Episodes Watched', value: stats.totalEpisodes.toLocaleString(), prefix: <PlayCircleOutlined />, color: chartColors[2] },
    { key: 'top-genre', title: 'Top Genre', value: stats.topGenre, prefix: <FireOutlined />, color: chartColors[3] },
    { key: 'top-network', title: 'Top Network', value: stats.topNetwork, prefix: <WifiOutlined />, color: chartColors[4] },
    { key: 'hours-watched', title: 'Hours Watched', value: stats.hours, prefix: <ClockCircleOutlined />, suffix: 'h', color: chartColors[5] },
    { key: 'minutes-watched', title: 'Minutes Watched', value: stats.minutes, prefix: <ClockCircleOutlined />, suffix: 'm', color: chartColors[6] },
    { key: 'years-watched', title: 'Years Watched', value: stats.years, precision: 2, prefix: <ClockCircleOutlined />, suffix: 'y', color: chartColors[7] },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: SPACING.lg,
      marginBottom: SECTION_GAP,
    }}>
      {cards.map(card => (
        <StatCard
          key={card.key}
          title={card.title}
          value={card.value}
          suffix={card.suffix}
          precision={card.precision}
          prefix={card.prefix}
          color={card.color}
          shadow={shadow}
          compact
        />
      ))}
    </div>
  )
})
