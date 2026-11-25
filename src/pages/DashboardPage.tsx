import type { CSSProperties, ReactNode } from 'react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Col, Divider, Empty, Progress, Row, Tabs, Tag, Typography } from 'antd'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  PlayCircleOutlined,
  StarFilled,
  StarOutlined,
  TagsOutlined,
  TrophyOutlined,
  UnorderedListOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import type { TvSeries } from '../types/series'
import { useTvDataContext } from '../context/useTvDataContext'
import { useTheme } from '../ThemeContext'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import {
  compareDescNullsLast,
  avgRating,
  maxBy,
  completionRate,
  formatRating,
  formatRuntime,
  genreDistribution,
  ratingBuckets,
  recentFirst,
  statusDistribution,
  topByWatchTime,
  totalEpisodesWatched,
  totalHoursWatched,
} from '../utils/derive'
import { SECTION_GAP, STATUSES, cardShadow, cardStyle, completionColor, ratingColor, statusHex } from '../constants/ui'
import { activateOnKey } from '../utils/a11y'
import { prefetchShowDetail } from '../routes/pageLoaders'
import { PosterThumb } from '../components/PosterThumb'
import { StatCard } from '../components/StatCard'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'

const { Title, Text } = Typography

interface ShowRowCardProps {
  series: TvSeries
  bg: string
  onClick: () => void
  children: ReactNode
  thumb?: { width: number; height: number; iconSize: number }
  header?: ReactNode
  ariaLabel?: string
  style?: CSSProperties
  padding?: number
}

const DEFAULT_THUMB = { width: 48, height: 72, iconSize: 18 }
const HIGHLIGHT_THUMB = { width: 44, height: 66, iconSize: 16 }

function ShowRowCard({ series, bg, onClick, children, thumb = DEFAULT_THUMB, header, ariaLabel, style, padding = 10 }: ShowRowCardProps) {
  return (
    <Card
      hoverable
      size="small"
      onClick={onClick}
      onKeyDown={activateOnKey(onClick)}
      onMouseEnter={prefetchShowDetail}
      onFocus={prefetchShowDetail}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel ?? series.name}
      style={style}
      styles={{ body: { padding } }}
    >
      {header}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <PosterThumb series={series} {...thumb} bg={bg} />
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      </div>
    </Card>
  )
}

export function DashboardPage() {
  const { data, loading, error, refetch } = useTvDataContext()
  const navigate = useNavigate()
  const theme = useTheme()
  const reducedMotion = usePrefersReducedMotion()

  const topShow = useMemo(() => topByWatchTime(data, 1)[0], [data])
  const stats = useMemo(() => ({
    totalEpisodes: totalEpisodesWatched(data),
    completion: completionRate(data),
    avg: avgRating(data),
    hours: totalHoursWatched(data),
  }), [data])

  const topRated = useMemo(() => maxBy(data, s => s.voteAverage), [data])
  const newestShow = useMemo(() => maxBy(data, s => s.firstAirYear), [data])
  const ratingDist = useMemo(() => ratingBuckets(data), [data])

  const recentlyWatched = useMemo(
    () => recentFirst(data).slice(0, 3),
    [data]
  )

  const inProgress = useMemo(
    () =>
      data
        .filter(s => s.episodesWatched > 0 && s.episodesWatched < s.totalEpisodes)
        .sort((a, b) => b.episodesWatched / b.totalEpisodes - a.episodesWatched / a.totalEpisodes)
        .slice(0, 6),
    [data]
  )

  const notStarted = useMemo(
    () =>
      data
        .filter(s => s.episodesWatched === 0)
        .sort((a, b) => compareDescNullsLast(a.voteAverage, b.voteAverage))
        .slice(0, 8),
    [data]
  )

  const topGenres = useMemo(() => genreDistribution(data).slice(0, 6), [data])
  const genreMax = topGenres[0]?.value ?? 1
  const statuses = useMemo(() => statusDistribution(data), [data])
  const statusTotal = statuses.reduce((s, d) => s + d.value, 0)

  if (loading) return <LoadingState />
  if (error) return <ErrorState message="Failed to load data" description={error} onRetry={refetch} />

  if (data.length === 0) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Empty
          description={
            <>
              <Text strong>No shows yet</Text>
              <br />
              <Text type="secondary">Add rows to <code>public/tv_series.csv</code> to get started</Text>
            </>
          }
        />
        <Button style={{ marginTop: 16 }} onClick={refetch}>Refresh</Button>
      </div>
    )
  }

  const { totalEpisodes, completion, avg, hours } = stats
  const shadow = cardShadow(theme.isDark)
  const baseCard = cardStyle(theme.isDark)
  const statCards = [
    { title: 'Shows Watched', value: data.length, prefix: <VideoCameraOutlined />, color: theme.chartColors[0] },
    { title: 'Hours Watched', value: hours, suffix: 'h', prefix: <ClockCircleOutlined />, color: theme.chartColors[3] },
    { title: 'Avg Rating', value: formatRating(avg), suffix: '/ 10', prefix: <StarOutlined />, color: ratingColor(avg, theme) ?? theme.chartText },
    { title: 'Episodes Watched', value: totalEpisodes.toLocaleString(), prefix: <PlayCircleOutlined />, color: theme.chartColors[5] },
    { title: 'Completion Rate', value: completion, suffix: '%', prefix: <CheckCircleOutlined />, color: completionColor(completion, theme) },
  ]

  const goToShow = (s: TvSeries) => navigate(`/shows/${s.tvId}`)

  const highlights: { label: string; icon: ReactNode; series: TvSeries | undefined; detail: (s: TvSeries) => ReactNode }[] = [
    {
      label: 'Most Watched',
      icon: <PlayCircleOutlined />,
      series: topShow && topShow.totalRuntimeWatched > 0 ? topShow : undefined,
      detail: s => <Text type="secondary" style={{ fontSize: 12 }}><ClockCircleOutlined /> {formatRuntime(s.totalRuntimeWatched)} watched</Text>,
    },
    {
      label: 'Top Rated',
      icon: <StarFilled />,
      series: topRated,
      detail: s => s.voteAverage != null && <Text style={{ fontSize: 12, color: ratingColor(s.voteAverage, theme) }}><StarFilled style={{ fontSize: 11 }} /> {formatRating(s.voteAverage)} rating</Text>,
    },
    {
      label: 'Newest Release',
      icon: <CalendarOutlined />,
      series: newestShow,
      detail: s => <Text type="secondary" style={{ fontSize: 12 }}><CalendarOutlined /> {s.firstAirYear ?? '–'}</Text>,
    },
  ]

  const highlightStyle: CSSProperties = { ...baseCard, borderTop: `3px solid ${theme.token.colorPrimary}`, height: '100%' }
  const highlightHeader = (icon: ReactNode, label: string) => (
    <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
      {icon}{label}
    </Text>
  )

  const renderBar = (name: string, value: number, percent: number, strokeColor: string) => (
    <div key={name} style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <Text style={{ fontSize: 13 }}>{name}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>{value}</Text>
      </div>
      <Progress percent={percent} showInfo={false} size="small" strokeColor={strokeColor} />
    </div>
  )

  const exploreCards = [
    { title: 'Browse the full catalogue', subtitle: 'Search, filter, and sort every show', button: 'Go to Shows', icon: <UnorderedListOutlined />, to: '/shows', primary: true },
    { title: 'Dive into the analytics', subtitle: '14 charts on genres, ratings, watch time, and more', button: 'Go to Statistics', icon: <BarChartOutlined />, to: '/stats', primary: false },
  ]

  return (
    <>
      {/* Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: SECTION_GAP }}>
        {statCards.map(({ title, value, suffix, prefix, color }) => (
          <Col key={title} flex="1 1 180px">
            <StatCard title={title} value={value} suffix={suffix} prefix={prefix} color={color} shadow={shadow} />
          </Col>
        ))}
      </Row>

      {/* Main 2-column layout */}
      <Row gutter={[16, 16]}>

        {/* LEFT: Continue Watching + Recently Watched */}
        <Col xs={24} lg={16}>

          {/* Highlights */}
          <div style={{ marginBottom: SECTION_GAP }}>
            <Title level={5} style={{ marginBottom: 10 }}><TrophyOutlined style={{ marginRight: 6 }} />Highlights</Title>
            <Row gutter={[10, 10]}>
              {highlights.map(({ label, icon, series, detail }) => (
                <Col key={label} xs={24} sm={8}>
                  {series ? (
                    <ShowRowCard
                      series={series}
                      bg={theme.posterFallbackBg}
                      onClick={() => goToShow(series)}
                      thumb={HIGHLIGHT_THUMB}
                      header={highlightHeader(icon, label)}
                      ariaLabel={`${label}: ${series.name}`}
                      style={highlightStyle}
                      padding={14}
                    >
                      <Text strong ellipsis style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>{series.name}</Text>
                      {detail(series)}
                    </ShowRowCard>
                  ) : (
                    <Card size="small" style={highlightStyle} styles={{ body: { padding: 14 } }}>
                      {highlightHeader(icon, label)}
                      <Text type="secondary">No data</Text>
                    </Card>
                  )}
                </Col>
              ))}
            </Row>
          </div>

          {/* Continue Watching */}
          {inProgress.length > 0 && (
            <div style={{ marginBottom: SECTION_GAP }}>
              <Title level={5} style={{ marginBottom: 10 }}><PlayCircleOutlined style={{ marginRight: 6 }} />Continue Watching</Title>
              <Row gutter={[10, 10]}>
                {inProgress.map(series => {
                  const pct = Math.round((series.episodesWatched / series.totalEpisodes) * 100)
                  return (
                    <Col key={series.tvId} xs={24} sm={12} xl={8}>
                      <ShowRowCard series={series} bg={theme.posterFallbackBg} onClick={() => goToShow(series)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Text strong ellipsis style={{ display: 'block', fontSize: 13, flex: 1, minWidth: 0 }}>{series.name}</Text>
                          {series.status === 'Returning Series' && (
                            <Tag color={STATUSES['Returning Series'].tag} style={{ fontSize: 10, margin: 0, lineHeight: '16px', padding: '0 4px' }}>New eps</Tag>
                          )}
                        </div>
                        <Progress percent={pct} size="small" strokeColor={theme.token.colorPrimary} showInfo={false} style={{ marginBottom: 3 }} />
                        <Text type="secondary" style={{ fontSize: 11 }}>{series.episodesWatched}/{series.totalEpisodes} eps · {pct}%</Text>
                      </ShowRowCard>
                    </Col>
                  )
                })}
              </Row>
            </div>
          )}

          {/* Recently Watched */}
          <div>
            <Title level={5} style={{ marginBottom: 10 }}><HistoryOutlined style={{ marginRight: 6 }} />Recently Watched</Title>
            <Row gutter={[10, 10]}>
              {recentlyWatched.map(series => (
                <Col key={series.tvId} xs={24} sm={8}>
                  <ShowRowCard series={series} bg={theme.posterFallbackBg} onClick={() => goToShow(series)}>
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
        </Col>

        {/* RIGHT: Sidebar */}
        <Col xs={24} lg={8}>

          {/* Top Genres / Watch Status (tabbed — keeps sidebar height in check) */}
          <Card size="small" style={{ marginBottom: 12, ...baseCard }} styles={{ body: { paddingTop: 0 } }}>
            <Tabs
              size="small"
              items={[
                {
                  key: 'genres',
                  label: <><TagsOutlined style={{ marginRight: 6 }} />Top Genres</>,
                  children: topGenres.map(({ name, value }) => renderBar(name, value, Math.round((value / genreMax) * 100), theme.token.colorPrimary)),
                },
                {
                  key: 'status',
                  label: <><BarChartOutlined style={{ marginRight: 6 }} />Watch Status</>,
                  children: statuses.map(({ name, value }, i) => renderBar(name, value, Math.round((value / statusTotal) * 100), statusHex(name, theme.chartColors[i % theme.chartColors.length]))),
                },
                {
                  key: 'ratings',
                  label: <><StarOutlined style={{ marginRight: 6 }} />Ratings</>,
                  children: (
                    <ResponsiveContainer width="100%" height={180} debounce={200}>
                      <BarChart data={ratingDist} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                        <XAxis dataKey="range" tick={{ fill: theme.chartText, fontSize: 11 }} />
                        <YAxis tick={{ fill: theme.chartText, fontSize: 11 }} allowDecimals={false} />
                        <Tooltip formatter={(v: number) => [`${v} shows`, 'Count']} />
                        <Bar isAnimationActive={!reducedMotion} dataKey="count" name="Shows" fill={theme.token.colorPrimary} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ),
                },
              ]}
            />
          </Card>

          {/* Not Started (compact list) */}
          {notStarted.length > 0 ? (
            <Card
              title="Not Started"
              size="small"
              style={baseCard}
              extra={<Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate('/shows')}>View all</Button>}
            >
              {notStarted.map((series, i) => (
                <div key={series.tvId}>
                  {i > 0 && <Divider style={{ margin: '8px 0' }} />}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                    onClick={() => goToShow(series)}
                    onKeyDown={activateOnKey(() => goToShow(series))}
                    onMouseEnter={prefetchShowDetail}
                    onFocus={prefetchShowDetail}
                    role="button"
                    tabIndex={0}
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
          ) : (
            <Card size="small" style={baseCard}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px 8px' }}>
                <CheckCircleOutlined style={{ fontSize: 28, color: STATUSES['Returning Series'].hex, marginBottom: 8 }} />
                <Text strong style={{ fontSize: 13 }}>All caught up</Text>
                <Text type="secondary" style={{ fontSize: 12, marginTop: 2 }}>Every show in your list has been started</Text>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      {/* Explore More */}
      <Row gutter={[16, 16]} style={{ marginTop: SECTION_GAP }}>
        {exploreCards.map(({ title, subtitle, button, icon, to, primary }) => (
          <Col key={to} xs={24} sm={12}>
            <Card size="small" style={{ ...baseCard, height: '100%' }} styles={{ body: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' } }}>
              <div>
                <Text strong style={{ fontSize: 14, display: 'block' }}>{title}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{subtitle}</Text>
              </div>
              <Button type={primary ? 'primary' : 'default'} icon={icon} onClick={() => navigate(to)}>{button}</Button>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  )
}
