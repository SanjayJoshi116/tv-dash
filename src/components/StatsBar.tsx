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
import { cardShadow, completionColor, ratingColor, responsiveColumns } from '../constants/ui'
import { useTheme } from '../ThemeContext'

interface Props {
  data: TvSeries[]
}

export const StatsBar = memo(function StatsBar({ data }: Props) {
  const screens = Grid.useBreakpoint()
  const theme = useTheme()

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
  const shadow = cardShadow(theme.isDark)
  const { chartColors } = theme

  const cards = [
    { key: 'shows-watched', title: 'Shows Watched', value: data.length, prefix: <VideoCameraOutlined />, color: chartColors[0] },
    { key: 'avg-rating', title: 'Avg Rating', value: stats.rating, prefix: <StarOutlined />, suffix: '/ 10', color: ratingColor(parseFloat(stats.rating)) },
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
      gap: 16,
      marginBottom: 24,
    }}>
      {cards.map(card => (
        <div key={card.key} title={String(card.value)}>
          <Card
            size="small"
            style={{
              height: '100%',
              borderRadius: 10,
              border: `1px solid ${card.color}40`,
              borderTop: `3px solid ${card.color}`,
              boxShadow: shadow,
            }}
            styles={{ body: { display: 'flex', alignItems: 'center', gap: 12 } }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${card.color}22`, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              {card.prefix}
            </div>
            <Statistic
              title={card.title}
              value={card.value}
              suffix={card.suffix}
              precision={card.precision}
              valueStyle={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: card.color, fontWeight: 700, fontSize: 20 }}
            />
          </Card>
        </div>
      ))}
    </div>
  )
})
