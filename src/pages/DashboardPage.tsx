import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Col, Divider, Empty, Progress, Row, Statistic, Tabs, Tag, Typography } from 'antd'
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
import { useTvDataContext } from '../context/TvDataContext'
import { useTheme } from '../ThemeContext'
import {
  avgRating,
  completionRate,
  formatRuntime,
  genreDistribution,
  ratingBuckets,
  recentFirst,
  statusDistribution,
  topByWatchTime,
  totalEpisodesWatched,
  totalHoursWatched,
} from '../utils/derive'
import { SECTION_GAP, STATUS_COLORS, cardShadow, completionColor, ratingColor } from '../constants/ui'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'

const { Title, Text } = Typography

export function DashboardPage() {
  const { data, loading, error, refetch } = useTvDataContext()
  const navigate = useNavigate()
  const theme = useTheme()

  const topShow = useMemo(() => topByWatchTime(data, 1)[0], [data])
  const totalEpisodes = useMemo(() => totalEpisodesWatched(data), [data])

  const topRated = useMemo(
    () => [...data].filter(s => s.voteAverage > 0).sort((a, b) => b.voteAverage - a.voteAverage)[0],
    [data]
  )
  const newestShow = useMemo(
    () => [...data].filter(s => s.firstAirYear).sort((a, b) => b.firstAirYear - a.firstAirYear)[0],
    [data]
  )
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
        .sort((a, b) => b.voteAverage - a.voteAverage)
        .slice(0, 8),
    [data]
  )

  const topGenres = useMemo(() => genreDistribution(data).slice(0, 6), [data])
  const genreMax = topGenres[0]?.value ?? 1
  const statuses = useMemo(() => statusDistribution(data), [data])
  const statusTotal = statuses.reduce((s, d) => s + d.value, 0)

  if (loading) return <LoadingState tip="Loading..." />
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

  const completion = completionRate(data)
  const rating = parseFloat(avgRating(data))
  const shadow = cardShadow(theme.isDark)
  const statCards = [
    { title: 'Shows Watched', value: data.length, prefix: <VideoCameraOutlined />, color: theme.chartColors[0] },
    { title: 'Hours Watched', value: totalHoursWatched(data), suffix: 'h', prefix: <ClockCircleOutlined />, color: theme.chartColors[3] },
    { title: 'Avg Rating', value: avgRating(data), suffix: '/ 10', prefix: <StarOutlined />, color: ratingColor(rating) },
    { title: 'Episodes Watched', value: totalEpisodes.toLocaleString(), prefix: <PlayCircleOutlined />, color: theme.chartColors[5] },
    { title: 'Completion Rate', value: completion, suffix: '%', prefix: <CheckCircleOutlined />, color: completionColor(completion) },
  ]

  const renderHighlight = (label: string, icon: ReactNode, series: TvSeries | undefined, detail: ReactNode) => (
    <Card
      hoverable={!!series}
      onClick={series ? () => navigate(`/shows/${series.tvId}`) : undefined}
      size="small"
      style={{
        cursor: series ? 'pointer' : 'default',
        borderRadius: 10,
        borderTop: `3px solid ${theme.token.colorPrimary}`,
        boxShadow: shadow,
        height: '100%',
      }}
      styles={{ body: { padding: 14 } }}
    >
      <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        {icon}{label}
      </Text>
      {series ? (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {series.posterUrl ? (
            <img
              src={series.posterUrl}
              alt={series.name}
              loading="lazy"
              style={{ width: 44, height: 66, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: 44, height: 66, borderRadius: 4, background: theme.posterFallbackBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <VideoCameraOutlined style={{ fontSize: 16, opacity: 0.4 }} />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <Text strong ellipsis style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>{series.name}</Text>
            {detail}
          </div>
        </div>
      ) : (
        <Text type="secondary">No data</Text>
      )}
    </Card>
  )

  return (
    <>
      {/* Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: SECTION_GAP }}>
        {statCards.map(({ title, value, suffix, prefix, color }) => (
          <Col key={title} flex="1 1 180px">
            <Card
              size="small"
              style={{
                height: '100%',
                borderRadius: 10,
                border: `1px solid ${color}40`,
                borderTop: `3px solid ${color}`,
                boxShadow: shadow,
              }}
              styles={{ body: { display: 'flex', alignItems: 'center', gap: 12 } }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}22`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {prefix}
              </div>
              <Statistic title={title} value={value} suffix={suffix} valueStyle={{ color, fontWeight: 700 }} />
            </Card>
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
              <Col xs={24} sm={8}>
                {renderHighlight(
                  'Most Watched',
                  <PlayCircleOutlined />,
                  topShow && topShow.totalRuntimeWatched > 0 ? topShow : undefined,
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <ClockCircleOutlined /> {topShow ? formatRuntime(topShow.totalRuntimeWatched) : ''} watched
                  </Text>
                )}
              </Col>
              <Col xs={24} sm={8}>
                {renderHighlight(
                  'Top Rated',
                  <StarFilled />,
                  topRated,
                  <Text style={{ fontSize: 12, color: topRated ? ratingColor(topRated.voteAverage) : undefined }}>
                    <StarFilled style={{ fontSize: 11 }} /> {topRated?.voteAverage.toFixed(1)} rating
                  </Text>
                )}
              </Col>
              <Col xs={24} sm={8}>
                {renderHighlight(
                  'Newest Release',
                  <CalendarOutlined />,
                  newestShow,
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <CalendarOutlined /> {newestShow?.firstAirYear}
                  </Text>
                )}
              </Col>
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
                      <Card
                        hoverable
                        size="small"
                        onClick={() => navigate(`/shows/${series.tvId}`)}
                        style={{ cursor: 'pointer' }}
                        styles={{ body: { padding: 10 } }}
                      >
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          {series.posterUrl ? (
                            <img
                              src={series.posterUrl}
                              alt={series.name}
                              loading="lazy"
                              style={{ width: 48, height: 72, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: 48, height: 72, borderRadius: 4, background: theme.posterFallbackBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <VideoCameraOutlined style={{ fontSize: 18, opacity: 0.4 }} />
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <Text strong ellipsis style={{ display: 'block', fontSize: 13, flex: 1, minWidth: 0 }}>{series.name}</Text>
                              {series.status === 'Returning Series' && (
                                <Tag color="green" style={{ fontSize: 10, margin: 0, lineHeight: '16px', padding: '0 4px' }}>New eps</Tag>
                              )}
                            </div>
                            <Progress percent={pct} size="small" strokeColor={theme.token.colorPrimary} showInfo={false} style={{ marginBottom: 3 }} />
                            <Text type="secondary" style={{ fontSize: 11 }}>{series.episodesWatched}/{series.totalEpisodes} eps · {pct}%</Text>
                          </div>
                        </div>
                      </Card>
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
                  <Card
                    hoverable
                    size="small"
                    onClick={() => navigate(`/shows/${series.tvId}`)}
                    style={{ cursor: 'pointer' }}
                    styles={{ body: { padding: 10 } }}
                  >
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {series.posterUrl ? (
                        <img
                          src={series.posterUrl}
                          alt={series.name}
                          loading="lazy"
                          style={{ width: 48, height: 72, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: 48, height: 72, borderRadius: 4, background: theme.posterFallbackBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <VideoCameraOutlined style={{ fontSize: 18, opacity: 0.4 }} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong ellipsis style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>{series.name}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{series.firstAirYear}</Text>
                        {series.voteAverage > 0 && (
                          <Text type="secondary" style={{ fontSize: 11 }}> · <StarFilled style={{ color: '#faad14', fontSize: 10 }} /> {series.voteAverage.toFixed(1)}</Text>
                        )}
                        <Text type="secondary" style={{ display: 'block', fontSize: 11, marginTop: 2 }}>{series.episodesWatched}/{series.totalEpisodes} eps</Text>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </Col>

        {/* RIGHT: Sidebar */}
        <Col xs={24} lg={8}>

          {/* Top Genres / Watch Status (tabbed — keeps sidebar height in check) */}
          <Card size="small" style={{ marginBottom: 12, borderRadius: 10, boxShadow: shadow }} styles={{ body: { paddingTop: 0 } }}>
            <Tabs
              size="small"
              items={[
                {
                  key: 'genres',
                  label: <><TagsOutlined style={{ marginRight: 6 }} />Top Genres</>,
                  children: topGenres.map(({ name, value }) => (
                    <div key={name} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Text style={{ fontSize: 13 }}>{name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{value}</Text>
                      </div>
                      <Progress percent={Math.round((value / genreMax) * 100)} showInfo={false} size="small" strokeColor={theme.token.colorPrimary} />
                    </div>
                  )),
                },
                {
                  key: 'status',
                  label: <><BarChartOutlined style={{ marginRight: 6 }} />Watch Status</>,
                  children: statuses.map(({ name, value }) => (
                    <div key={name} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Text style={{ fontSize: 13 }}>{name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{value}</Text>
                      </div>
                      <Progress percent={Math.round((value / statusTotal) * 100)} showInfo={false} size="small" strokeColor={STATUS_COLORS[name] ?? '#8c8c8c'} />
                    </div>
                  )),
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
                        <Bar dataKey="count" name="Shows" fill={theme.token.colorPrimary} radius={[3, 3, 0, 0]} />
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
              style={{ borderRadius: 10, boxShadow: shadow }}
              extra={<Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate('/shows')}>View all</Button>}
            >
              {notStarted.map((series, i) => (
                <div key={series.tvId}>
                  {i > 0 && <Divider style={{ margin: '8px 0' }} />}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                    onClick={() => navigate(`/shows/${series.tvId}`)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/shows/${series.tvId}`) } }}
                    role="button"
                    tabIndex={0}
                    aria-label={series.name}
                  >
                    {series.posterUrl ? (
                      <img
                        src={series.posterUrl}
                        alt={series.name}
                        loading="lazy"
                        style={{ width: 36, height: 54, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{ width: 36, height: 54, borderRadius: 4, background: theme.posterFallbackBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <VideoCameraOutlined style={{ fontSize: 14, opacity: 0.4 }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text strong ellipsis style={{ display: 'block', fontSize: 13 }}>{series.name}</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {series.firstAirYear} · <StarFilled style={{ color: '#faad14', fontSize: 10 }} /> {series.voteAverage.toFixed(1)}
                      </Text>
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          ) : (
            <Card size="small" style={{ borderRadius: 10, boxShadow: shadow }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px 8px' }}>
                <CheckCircleOutlined style={{ fontSize: 28, color: STATUS_COLORS['Returning Series'], marginBottom: 8 }} />
                <Text strong style={{ fontSize: 13 }}>All caught up</Text>
                <Text type="secondary" style={{ fontSize: 12, marginTop: 2 }}>Every show in your list has been started</Text>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      {/* Explore More */}
      <Row gutter={[16, 16]} style={{ marginTop: SECTION_GAP }}>
        <Col xs={24} sm={12}>
          <Card size="small" style={{ borderRadius: 10, boxShadow: shadow, height: '100%' }} styles={{ body: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' } }}>
            <div>
              <Text strong style={{ fontSize: 14, display: 'block' }}>Browse the full catalogue</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>Search, filter, and sort every show</Text>
            </div>
            <Button type="primary" icon={<UnorderedListOutlined />} onClick={() => navigate('/shows')}>Go to Shows</Button>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card size="small" style={{ borderRadius: 10, boxShadow: shadow, height: '100%' }} styles={{ body: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' } }}>
            <div>
              <Text strong style={{ fontSize: 14, display: 'block' }}>Dive into the analytics</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>14 charts on genres, ratings, watch time, and more</Text>
            </div>
            <Button icon={<BarChartOutlined />} onClick={() => navigate('/stats')}>Go to Statistics</Button>
          </Card>
        </Col>
      </Row>
    </>
  )
}
