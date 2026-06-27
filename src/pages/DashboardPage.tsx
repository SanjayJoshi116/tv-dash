import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Col, Divider, Progress, Row, Spin, Statistic, Typography } from 'antd'
import { ClockCircleOutlined, PlayCircleOutlined, StarFilled, StarOutlined, VideoCameraOutlined } from '@ant-design/icons'
import { useTvDataContext } from '../context/TvDataContext'
import { avgRating, genreDistribution, statusDistribution, totalHoursWatched } from '../utils/derive'

const { Title, Text } = Typography

const STAT_COLORS = ['#1677ff', '#52c41a', '#faad14', '#ff4d4f']

const STATUS_COLORS: Record<string, string> = {
  'Returning Series': '#52c41a',
  'Ended': '#8c8c8c',
  'Canceled': '#ff4d4f',
}

export function DashboardPage() {
  const { data, loading, error, refetch } = useTvDataContext()
  const navigate = useNavigate()

  const totalEpisodes = useMemo(
    () => data.reduce((sum, s) => sum + (s.episodesWatched || 0), 0),
    [data]
  )

  const recentlyWatched = useMemo(
    () => [...data].reverse().slice(0, 3),
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

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 64 }}><Spin size="large" tip="Loading..." /></div>
  }
  if (error) {
    return <Alert type="error" message="Failed to load data" description={error} showIcon action={<Button size="small" onClick={refetch}>Retry</Button>} />
  }

  const statCards = [
    { title: 'Shows Watched', value: data.length, prefix: <VideoCameraOutlined />, color: STAT_COLORS[0] },
    { title: 'Hours Watched', value: totalHoursWatched(data), suffix: 'h', prefix: <ClockCircleOutlined />, color: STAT_COLORS[1] },
    { title: 'Avg Rating', value: avgRating(data), suffix: '/ 10', prefix: <StarOutlined />, color: STAT_COLORS[2] },
    { title: 'Episodes Watched', value: totalEpisodes.toLocaleString(), prefix: <PlayCircleOutlined />, color: STAT_COLORS[3] },
  ]

  return (
    <>
      {/* Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {statCards.map(({ title, value, suffix, prefix, color }) => (
          <Col key={title} xs={12} sm={6}>
            <Card size="small" style={{ borderLeft: `4px solid ${color}`, height: '100%' }}>
              <Statistic title={title} value={value} suffix={suffix} prefix={prefix} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Main 2-column layout */}
      <Row gutter={[16, 16]}>

        {/* LEFT: Continue Watching + Top Rated */}
        <Col xs={24} lg={16}>

          {/* Continue Watching */}
          {inProgress.length > 0 && (
            <div style={{ marginBottom: 20 }}>
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
                              style={{ width: 48, height: 72, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: 48, height: 72, borderRadius: 4, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>📺</div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text strong ellipsis style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>{series.name}</Text>
                            <Progress percent={pct} size="small" strokeColor="#1677ff" showInfo={false} style={{ marginBottom: 3 }} />
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
                          style={{ width: 48, height: 72, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: 48, height: 72, borderRadius: 4, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>📺</div>
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
          <Card title="Top Genres" size="small" style={{ marginBottom: 12 }}>
            {topGenres.map(({ name, value }) => (
              <div key={name} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={{ fontSize: 13 }}>{name}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{value}</Text>
                </div>
                <Progress percent={Math.round((value / genreMax) * 100)} showInfo={false} size="small" strokeColor="#1677ff" />
              </div>
            ))}
          </Card>

          {/* Watch Status */}
          <Card title="Watch Status" size="small" style={{ marginBottom: 12 }}>
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
                  >
                    {series.posterUrl ? (
                      <img
                        src={series.posterUrl}
                        alt={series.name}
                        style={{ width: 36, height: 54, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{ width: 36, height: 54, borderRadius: 4, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>📺</div>
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
