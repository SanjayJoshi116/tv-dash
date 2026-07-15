import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Col, Divider, Empty, Progress, Row, Statistic, Tag, Typography } from 'antd'
import {
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  StarFilled,
  StarOutlined,
  TagsOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { useTvDataContext } from '../context/TvDataContext'
import { useTheme } from '../ThemeContext'
import {
  avgRating,
  completionRate,
  formatRuntime,
  genreDistribution,
  recentFirst,
  statusDistribution,
  topByWatchTime,
  totalEpisodesWatched,
  totalHoursWatched,
} from '../utils/derive'
import { GENRE_COLORS, SECTION_GAP, STATUS_COLORS, completionColor, ratingColor } from '../constants/ui'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'

const { Title, Text } = Typography

export function DashboardPage() {
  const { data, loading, error, refetch } = useTvDataContext()
  const navigate = useNavigate()
  const theme = useTheme()

  const topShow = useMemo(() => topByWatchTime(data, 1)[0], [data])
  const totalEpisodes = useMemo(() => totalEpisodesWatched(data), [data])

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
  const statCards = [
    { title: 'Shows Watched', value: data.length, prefix: <VideoCameraOutlined />, color: theme.token.colorPrimary },
    { title: 'Hours Watched', value: totalHoursWatched(data), suffix: 'h', prefix: <ClockCircleOutlined />, color: STATUS_COLORS['Returning Series'] },
    { title: 'Avg Rating', value: avgRating(data), suffix: '/ 10', prefix: <StarOutlined />, color: ratingColor(rating) },
    { title: 'Episodes Watched', value: totalEpisodes.toLocaleString(), prefix: <PlayCircleOutlined />, color: STATUS_COLORS['Canceled'] },
    { title: 'Completion Rate', value: completion, suffix: '%', prefix: <CheckCircleOutlined />, color: completionColor(completion) },
  ]

  return (
    <>
      {/* Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: SECTION_GAP }}>
        {statCards.map(({ title, value, suffix, prefix, color }) => (
          <Col key={title} flex="1 1 180px">
            <Card size="small" style={{ borderLeft: `4px solid ${color}`, height: '100%' }}>
              <Statistic title={title} value={value} suffix={suffix} prefix={prefix} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Main 2-column layout */}
      <Row gutter={[16, 16]}>

        {/* LEFT: Continue Watching + Recently Watched */}
        <Col xs={24} lg={16}>

          {/* Most Watched spotlight */}
          {topShow && topShow.totalRuntimeWatched > 0 && (
            <Card
              hoverable
              onClick={() => navigate(`/shows/${topShow.tvId}`)}
              style={{ cursor: 'pointer', marginBottom: SECTION_GAP }}
              styles={{ body: { padding: 16 } }}
            >
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                {topShow.posterUrl ? (
                  <img
                    src={topShow.posterUrl}
                    alt={topShow.name}
                    loading="lazy"
                    style={{ width: 64, height: 96, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: 64, height: 96, borderRadius: 6, background: theme.posterFallbackBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 24 }}>📺</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Most Watched</Text>
                  <Title level={4} style={{ margin: '2px 0 6px' }} ellipsis>{topShow.name}</Title>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                    {topShow.genres.slice(0, 3).map(g => (
                      <Tag key={g} color={GENRE_COLORS[g] ?? 'default'} style={{ fontSize: 11, margin: 0 }}>{g}</Tag>
                    ))}
                    {topShow.voteAverage > 0 && (
                      <Text style={{ fontSize: 12, color: ratingColor(topShow.voteAverage) }}>
                        <StarFilled style={{ fontSize: 11 }} /> {topShow.voteAverage.toFixed(1)}
                      </Text>
                    )}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <ClockCircleOutlined /> {formatRuntime(topShow.totalRuntimeWatched)} watched
                  </Text>
                </div>
              </div>
            </Card>
          )}

          {/* Continue Watching */}
          {inProgress.length > 0 && (
            <div style={{ marginBottom: SECTION_GAP }}>
              <Title level={5} style={{ marginBottom: 10 }}>Continue Watching</Title>
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
                            <div style={{ width: 48, height: 72, borderRadius: 4, background: theme.posterFallbackBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>📺</div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text strong ellipsis style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>{series.name}</Text>
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
            <Title level={5} style={{ marginBottom: 10 }}>Recently Watched</Title>
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
                        <div style={{ width: 48, height: 72, borderRadius: 4, background: theme.posterFallbackBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>📺</div>
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

          {/* Top Genres */}
          <Card title={<><TagsOutlined style={{ marginRight: 6 }} />Top Genres</>} size="small" style={{ marginBottom: 12 }}>
            {topGenres.map(({ name, value }) => (
              <div key={name} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={{ fontSize: 13 }}>{name}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{value}</Text>
                </div>
                <Progress percent={Math.round((value / genreMax) * 100)} showInfo={false} size="small" strokeColor={theme.token.colorPrimary} />
              </div>
            ))}
          </Card>

          {/* Watch Status */}
          <Card title={<><BarChartOutlined style={{ marginRight: 6 }} />Watch Status</>} size="small" style={{ marginBottom: 12 }}>
            {statuses.map(({ name, value }) => (
              <div key={name} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={{ fontSize: 13 }}>{name}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{value}</Text>
                </div>
                <Progress percent={Math.round((value / statusTotal) * 100)} showInfo={false} size="small" strokeColor={STATUS_COLORS[name] ?? '#8c8c8c'} />
              </div>
            ))}
          </Card>

          {/* Not Started (compact list) */}
          {notStarted.length > 0 && (
            <Card title="Not Started" size="small">
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
                      <div style={{ width: 36, height: 54, borderRadius: 4, background: theme.posterFallbackBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>📺</div>
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
          )}
        </Col>
      </Row>
    </>
  )
}
