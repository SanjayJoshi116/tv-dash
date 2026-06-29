import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Card, Col, Descriptions, Grid, Progress, Row, Space, Statistic, Tag, Typography } from 'antd'
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  StarFilled,
  TrophyOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { useTvDataContext } from '../context/TvDataContext'
import { formatRuntime } from '../utils/derive'
import { useTheme } from '../ThemeContext'
import { GENRE_COLORS, SECTION_GAP, STATUS_TAG_COLORS, completionColor, ratingColor } from '../constants/ui'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'

const { Title, Text } = Typography

const formatDate = (iso: string) => iso
  ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : '–'

export function ShowDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useTvDataContext()
  const screens = Grid.useBreakpoint()
  const theme = useTheme()
  const [overviewExpanded, setOverviewExpanded] = useState(false)

  if (loading) return <LoadingState tip="Loading..." />
  if (error) return <ErrorState message="Failed to load data" description={error} onRetry={refetch} />

  const series = data.find(s => s.tvId === Number(id))

  if (!series) {
    return (
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/shows')}>
        Show not found — Back to Shows
      </Button>
    )
  }

  const color = ratingColor(series.voteAverage)
  const completion = series.totalEpisodes > 0 ? Math.round((series.episodesWatched / series.totalEpisodes) * 100) : 0
  const allSeasons = Array.from({ length: series.seasons }, (_, i) => i + 1)

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: SECTION_GAP / 2 }}
      >
        Back
      </Button>

      {/* Hero: poster left, all info + stat cards right */}
      <div style={{
        display: 'flex',
        gap: 24,
        marginBottom: SECTION_GAP,
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
            aspectRatio: '2/3',
            borderRadius: 12,
            background: theme.posterFallbackBg,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            flexShrink: 0,
            border: `1px solid ${theme.borderColor}`,
          }}>
            <VideoCameraOutlined style={{ fontSize: 48, opacity: 0.4 }} />
            <Text type="secondary" style={{ fontSize: 12, textAlign: 'center', padding: '0 12px' }}>
              No Poster
            </Text>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title + Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            <Title level={3} style={{ margin: 0, lineHeight: 1.2 }}>{series.name}</Title>
            <Tag color={STATUS_TAG_COLORS[series.status] ?? 'default'} style={{ fontSize: 12 }}>
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
                background: color,
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

          {/* Overview with expand/collapse */}
          <p style={{
            margin: '0 0 4px',
            lineHeight: 1.65,
            fontSize: 14,
            ...(overviewExpanded ? {} : {
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
            }),
          }}>
            {series.overview}
          </p>
          {series.overview.length > 200 && (
            <Button
              type="link"
              size="small"
              onClick={() => setOverviewExpanded(e => !e)}
              style={{ padding: '0 0 10px', height: 'auto' }}
            >
              {overviewExpanded ? 'Show less' : 'Show more'}
            </Button>
          )}
          {series.overview.length <= 200 && <div style={{ marginBottom: 10 }} />}

          {/* Genres */}
          <Space wrap size={6} style={{ marginBottom: 14 }}>
            {series.genres.map(g => (
              <Tag key={g} color={GENRE_COLORS[g] ?? 'default'}>{g}</Tag>
            ))}
          </Space>

          {/* Stat cards inline */}
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
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
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="Watch Time"
                  value={formatRuntime(series.totalRuntimeWatched)}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ fontSize: 20 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
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
            <Col xs={12} sm={6}>
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
      <Row gutter={[16, 16]} style={{ marginBottom: SECTION_GAP }}>
        <Col xs={24} md={12}>
          <Card title="Show Details" size="small" style={{ height: '100%' }}>
            <Descriptions column={2}>
              <Descriptions.Item label="Seasons">{series.seasons}</Descriptions.Item>
              <Descriptions.Item label="Total Episodes">{series.totalEpisodes}</Descriptions.Item>
              <Descriptions.Item label="Ep. Runtime">
                {series.episodeRuntime ? `${series.episodeRuntime} min` : '–'}
              </Descriptions.Item>
              <Descriptions.Item label="Popularity">{series.popularity.toFixed(1)}</Descriptions.Item>
              {series.voteCount > 0 && (
                <Descriptions.Item label="Vote Count">
                  {series.voteCount.toLocaleString()}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="First Air Date">{formatDate(series.firstAirDate)}</Descriptions.Item>
              <Descriptions.Item label="Last Air Date">{formatDate(series.lastEpisodeAirDate)}</Descriptions.Item>
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
              <Progress percent={completion} strokeColor={completionColor(completion)} showInfo={false} size="small" />
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
                        icon={watched ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
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
