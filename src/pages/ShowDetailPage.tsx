import { useEffect, useRef, useState } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { Button, Card, Col, Descriptions, Empty, Grid, Progress, Row, Space, Statistic, Tag, Typography } from 'antd'
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
import { useTvDataContext } from '../context/useTvDataContext'
import { completionRate, formatRuntime } from '../utils/derive'
import { useTheme } from '../ThemeContext'
import { SECTION_GAP, SPACING, cardStyle as baseCardStyle, completionColor, genreTagColor, ratingColor, statusTagColor } from '../constants/ui'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'

const { Title, Text } = Typography

// 'YYYY-MM-DD' parses as UTC midnight — format in UTC too, or it shows a day early west of UTC
const formatDate = (iso: string) => {
  const d = iso ? new Date(iso) : null
  return d && !isNaN(d.getTime())
    ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    : '–'
}

export function ShowDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { data, loading, error, refetch } = useTvDataContext()
  const screens = Grid.useBreakpoint()
  const theme = useTheme()
  const [overviewExpanded, setOverviewExpanded] = useState(false)
  // URL-keyed (like PosterThumb): a new show's poster gets a fresh attempt with no reset
  const [failedPosterUrl, setFailedPosterUrl] = useState<string | null>(null)
  const [overviewOverflows, setOverviewOverflows] = useState(false)
  const overviewRef = useRef<HTMLParagraphElement>(null)

  const series = data.find(s => s.tvId === Number(id))

  // Reset per-show UI state when navigating to a different show (the page
  // isn't remounted on /shows/1 → /shows/2). See AppLayout.tsx's identical
  // note: the "adjust state during render" alternative (avoids
  // react-hooks/set-state-in-effect) misbehaves under React.StrictMode in
  // this codebase — a plain effect is what's correct here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOverviewExpanded(false)
  }, [id])

  // Show "Show more" only when the 4-line clamp actually truncates — depends on
  // viewport width, not character count. ResizeObserver fires once on observe,
  // then on every width change. Skipped while expanded (clamp is off, so no overflow).
  useEffect(() => {
    const el = overviewRef.current
    if (!el || overviewExpanded) return
    const ro = new ResizeObserver(() => setOverviewOverflows(el.scrollHeight > el.clientHeight + 1))
    ro.observe(el)
    return () => ro.disconnect()
  }, [series?.overview, overviewExpanded])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message="Failed to load data" description={error} onRetry={refetch} />

  if (!series) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Empty
          description={
            <>
              <Text strong>Show not found</Text>
              <br />
              <Text type="secondary">No show matches this ID — it may have been removed from the CSV</Text>
            </>
          }
        />
        <Button icon={<ArrowLeftOutlined />} style={{ marginTop: 16 }} onClick={() => navigate('/shows')}>
          Back to Shows
        </Button>
      </div>
    )
  }

  const color = series.voteAverage == null ? undefined : ratingColor(series.voteAverage)
  const completion = completionRate([series])
  const allSeasons = Array.from({ length: series.seasons ?? 0 }, (_, i) => i + 1)
  const cardStyle = baseCardStyle(theme.isDark)
  const showPoster = series.posterUrl && failedPosterUrl !== series.posterUrl

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => location.key === 'default' ? navigate('/shows') : navigate(-1)}
        style={{ marginBottom: SECTION_GAP / 2 }}
      >
        Back
      </Button>

      {/* Hero: poster left, all info + stat cards right */}
      <div style={{
        display: 'flex',
        gap: SPACING.xl,
        marginBottom: SECTION_GAP,
        flexDirection: screens.md ? 'row' : 'column',
        alignItems: 'flex-start',
      }}>
        {showPoster ? (
          <img
            src={series.posterUrl}
            alt={series.name}
            onError={() => setFailedPosterUrl(series.posterUrl)}
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
            <Tag color={statusTagColor(series.status)} style={{ fontSize: 12 }}>
              {series.status}
            </Tag>
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            {series.voteAverage != null && (
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
            {series.firstAirYear != null && <Text type="secondary">{series.firstAirYear}</Text>}
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
          <p ref={overviewRef} style={{
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
          {overviewOverflows || overviewExpanded ? (
            <Button
              type="link"
              size="small"
              onClick={() => setOverviewExpanded(e => !e)}
              style={{ padding: '0 0 10px', height: 'auto' }}
            >
              {overviewExpanded ? 'Show less' : 'Show more'}
            </Button>
          ) : (
            <div style={{ marginBottom: 10 }} />
          )}

          {/* Genres */}
          <Space wrap size={6} style={{ marginBottom: 14 }}>
            {series.genres.map(g => (
              <Tag key={g} color={genreTagColor(g)}>{g}</Tag>
            ))}
          </Space>

          {/* Stat cards inline */}
          <Row gutter={[16, 16]}>
            {[
              { title: 'Episodes Watched', value: series.episodesWatched, suffix: `/ ${series.totalEpisodes}`, prefix: <PlayCircleOutlined /> },
              { title: 'Watch Time', value: formatRuntime(series.totalRuntimeWatched), prefix: <ClockCircleOutlined /> },
              { title: 'Seasons Watched', value: series.seasonsWatched.length, suffix: `/ ${series.seasons ?? '–'}`, prefix: <TrophyOutlined /> },
              // formatter skips Statistic's thousands separator ("2,019")
              { title: 'First Aired', value: series.firstAirYear ?? '–', prefix: <CalendarOutlined />, formatter: (v: string | number) => String(v) },
            ].map(({ title, value, suffix, prefix, formatter }) => (
              <Col key={title} xs={12} sm={6}>
                <Card size="small" style={cardStyle}>
                  <Statistic title={title} value={value} suffix={suffix} prefix={prefix} formatter={formatter} valueStyle={{ fontSize: 20 }} />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Show Details + Watch History */}
      <Row gutter={[16, 16]} style={{ marginBottom: SECTION_GAP }}>
        <Col xs={24} md={12}>
          <Card title="Show Details" size="small" style={{ ...cardStyle, height: '100%' }}>
            <Descriptions column={2}>
              <Descriptions.Item label="Seasons">{series.seasons ?? '–'}</Descriptions.Item>
              <Descriptions.Item label="Total Episodes">{series.totalEpisodes}</Descriptions.Item>
              <Descriptions.Item label="Ep. Runtime">
                {series.episodeRuntime != null ? `${series.episodeRuntime} min` : '–'}
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
          <Card title="Watch History" size="small" style={{ ...cardStyle, height: '100%' }}>
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

            {allSeasons.length > 0 && (
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
            <Card title="Cast" size="small" style={cardStyle}>
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
            <Card title="Keywords" size="small" style={cardStyle}>
              <Space wrap size={4}>
                {series.keywords.slice(0, 20).map(k => (
                  <Tag key={k} style={{ fontSize: 13 }}>{k}</Tag>
                ))}
              </Space>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  )
}
