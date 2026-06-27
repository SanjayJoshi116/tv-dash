import { useParams, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Col, Descriptions, Grid, Progress, Row, Space, Spin, Statistic, Tag, Typography } from 'antd'
import { ArrowLeftOutlined, CalendarOutlined, ClockCircleOutlined, PlayCircleOutlined, StarFilled, TrophyOutlined } from '@ant-design/icons'
import { useTvDataContext } from '../context/TvDataContext'
import { formatRuntime } from '../utils/derive'
import { useTheme } from '../ThemeContext'

const { Title, Text } = Typography

const STATUS_COLOR: Record<string, string> = {
  'Returning Series': 'green',
  'Ended': 'default',
  'Canceled': 'red',
}

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

export function ShowDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading } = useTvDataContext()
  const screens = Grid.useBreakpoint()
  const theme = useTheme()

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 64 }}><Spin size="large" /></div>
  }

  const series = data.find(s => s.tvId === Number(id))

  if (!series) {
    return (
      <Alert
        type="error"
        message="Show not found"
        action={<Button onClick={() => navigate('/shows')}>Back to Shows</Button>}
      />
    )
  }

  const ratingColor = series.voteAverage >= 8 ? '#52c41a' : series.voteAverage >= 6 ? '#faad14' : '#f5222d'
  const completion = series.totalEpisodes > 0 ? Math.round((series.episodesWatched / series.totalEpisodes) * 100) : 0
  const completionColor = completion >= 75 ? '#52c41a' : completion >= 40 ? '#faad14' : '#f5222d'
  const allSeasons = Array.from({ length: series.seasons }, (_, i) => i + 1)

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        Back
      </Button>

      {/* Hero: poster left, all info + stat cards right */}
      <div style={{
        display: 'flex',
        gap: 24,
        marginBottom: 12,
        flexDirection: screens.md ? 'row' : 'column',
        alignItems: 'flex-start',
      }}>
        {series.posterUrl ? (
          <img
            src={series.posterUrl}
            alt={series.name}
            style={{
              width: screens.xl ? 260 : screens.md ? 200 : '100%',
              maxWidth: 280,
              borderRadius: 12,
              objectFit: 'cover',
              flexShrink: 0,
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            }}
          />
        ) : (
          <div style={{
            width: screens.md ? 200 : '100%',
            maxWidth: 280,
            height: 300,
            borderRadius: 12,
            background: theme.isDark ? '#1a1a2e' : '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 64,
            flexShrink: 0,
          }}>
            📺
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title + Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            <Title level={3} style={{ margin: 0, lineHeight: 1.2 }}>{series.name}</Title>
            <Tag color={STATUS_COLOR[series.status] ?? 'default'} style={{ fontSize: 12 }}>
              {series.status}
            </Tag>
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            {series.voteAverage > 0 && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: ratingColor,
                color: '#fff',
                padding: '3px 9px',
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 14,
              }}>
                <StarFilled />{series.voteAverage.toFixed(1)}
              </span>
            )}
            <Text type="secondary">{series.firstAirYear}</Text>
            {series.ageRating && <Tag>{series.ageRating}</Tag>}
            {series.language && (
              <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase' }}>
                {series.language}
              </Text>
            )}
          </div>

          {/* Tagline */}
          {series.tagline && (
            <Text italic type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
              &ldquo;{series.tagline}&rdquo;
            </Text>
          )}

          {/* Overview (3-line clamp) */}
          <p style={{
            margin: '0 0 10px',
            lineHeight: 1.65,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            fontSize: 14,
          }}>
            {series.overview}
          </p>

          {/* Genres */}
          <Space wrap size={6} style={{ marginBottom: 14 }}>
            {series.genres.map(g => (
              <Tag key={g} color={GENRE_COLORS[g] ?? 'default'}>{g}</Tag>
            ))}
          </Space>

          {/* Stat cards inline */}
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Episodes Watched"
                  value={series.episodesWatched}
                  suffix={`/ ${series.totalEpisodes}`}
                  prefix={<PlayCircleOutlined />}
                  valueStyle={{ fontSize: 20 }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Watch Time"
                  value={formatRuntime(series.totalRuntimeWatched)}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ fontSize: 20 }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Seasons Watched"
                  value={series.seasonsWatched.length}
                  suffix={`/ ${series.seasons}`}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ fontSize: 20 }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="First Aired"
                  value={series.firstAirYear}
                  formatter={v => String(v)}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ fontSize: 20 }}
                />
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* Show Details + Watch History */}
      <Row gutter={[16, 16]} style={{ marginBottom: 12 }}>
        <Col xs={24} md={12}>
          <Card title="Show Details" size="small" style={{ height: '100%' }}>
            <Descriptions column={2}>
              <Descriptions.Item label="Seasons">{series.seasons}</Descriptions.Item>
              <Descriptions.Item label="Total Episodes">{series.totalEpisodes}</Descriptions.Item>
              <Descriptions.Item label="Ep. Runtime">
                {series.episodeRuntime ? `${series.episodeRuntime} min` : '–'}
              </Descriptions.Item>
              <Descriptions.Item label="Popularity">{series.popularity.toFixed(1)}</Descriptions.Item>
              <Descriptions.Item label="Last Air Date">{series.lastEpisodeAirDate || '–'}</Descriptions.Item>
              {series.networks.length > 0 && (
                <Descriptions.Item label="Networks">
                  <Space wrap size={4}>{series.networks.map(n => <Tag key={n}>{n}</Tag>)}</Space>
                </Descriptions.Item>
              )}
              {series.creators.length > 0 && (
                <Descriptions.Item label="Creators" span={2}>
                  {series.creators.join(', ')}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Watch History" size="small" style={{ height: '100%' }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 14 }}>Episode Completion</Text>
                <Text strong style={{ fontSize: 14 }}>{completion}%</Text>
              </div>
              <Progress percent={completion} strokeColor={completionColor} showInfo={false} size="small" />
              <Text type="secondary" style={{ fontSize: 13 }}>
                {series.episodesWatched} of {series.totalEpisodes} episodes
              </Text>
            </div>

            {series.seasons > 0 && (
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>Seasons</Text>
                <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {allSeasons.map(s => {
                    const watched = series.seasonsWatched.includes(s)
                    return (
                      <Tag
                        key={s}
                        color={watched ? 'green' : 'default'}
                        style={{ borderStyle: watched ? 'solid' : 'dashed' }}
                      >
                        S{s}
                      </Tag>
                    )
                  })}
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Cast + Keywords side by side */}
      <Row gutter={[16, 16]}>
        {series.actors.length > 0 && (
          <Col xs={24} md={12}>
            <Card title="Cast" size="small">
              <Space wrap size={4}>
                {series.actors.slice(0, 15).map(a => <Tag key={a}>{a}</Tag>)}
                {series.actors.length > 15 && (
                  <Text type="secondary">+{series.actors.length - 15} more</Text>
                )}
              </Space>
            </Card>
          </Col>
        )}
        {series.keywords.length > 0 && (
          <Col xs={24} md={series.actors.length > 0 ? 12 : 24}>
            <Card title="Keywords" size="small">
              <Space wrap size={4}>
                {series.keywords.slice(0, 20).map(k => (
                  <Tag key={k} color="default" style={{ fontSize: 13 }}>{k}</Tag>
                ))}
              </Space>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  )
}
