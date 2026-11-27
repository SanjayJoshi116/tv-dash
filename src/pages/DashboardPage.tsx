import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Col, Empty, Row, Typography } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, PlayCircleOutlined, StarOutlined, VideoCameraOutlined } from '@ant-design/icons'
import type { TvSeries } from '../types/series'
import { useTvDataContext } from '../context/useTvDataContext'
import { useTheme } from '../ThemeContext'
import {
  compareDescNullsLast,
  avgRating,
  maxBy,
  completionRate,
  formatRating,
  genreDistribution,
  ratingBuckets,
  recentFirst,
  statusDistribution,
  topByWatchTime,
  totalEpisodesWatched,
  totalHoursWatched,
} from '../utils/derive'
import { SECTION_GAP, cardShadow, completionColor, ratingColor } from '../constants/ui'
import { continueWatching, progressOf, type ContinueOrder } from '../utils/showFilters'
import { StatCard } from '../components/StatCard'
import { DataGate } from '../components/DataGate'
import { Highlights } from './dashboard/Highlights'
import { ContinueWatching } from './dashboard/ContinueWatching'
import { RecentlyWatched } from './dashboard/RecentlyWatched'
import { SidebarTabs } from './dashboard/SidebarTabs'
import { NotStartedList } from './dashboard/NotStartedList'
import { ExploreCards } from './dashboard/ExploreCards'

const { Text } = Typography

export function DashboardPage() {
  const tvData = useTvDataContext()
  return (
    <DataGate state={tvData}>
      {data => <DashboardContent data={data} refetch={tvData.refetch} />}
    </DataGate>
  )
}

// Rendered only with loaded data, so the memos never run during loading. Holds every derived list
// and the layout; the sections in ./dashboard/ only receive props.
function DashboardContent({ data, refetch }: { data: TvSeries[]; refetch: () => void }) {
  const navigate = useNavigate()
  const theme = useTheme()

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

  // Per visit, not saved. Sorted before slicing so "least time left" picks the right six.
  const [continueOrder, setContinueOrder] = useState<ContinueOrder>('mostWatched')
  const inProgress = useMemo(() => continueWatching(data, continueOrder, 6), [data, continueOrder])

  const notStarted = useMemo(
    () =>
      data
        .filter(s => progressOf(s) === 'notStarted')
        .sort((a, b) => compareDescNullsLast(a.voteAverage, b.voteAverage))
        .slice(0, 8),
    [data]
  )

  const topGenres = useMemo(() => genreDistribution(data).slice(0, 6), [data])
  const statuses = useMemo(() => statusDistribution(data), [data])

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
  const statCards = [
    { title: 'Shows Watched', value: data.length, prefix: <VideoCameraOutlined />, color: theme.chartColors[0] },
    { title: 'Hours Watched', value: hours, suffix: 'h', prefix: <ClockCircleOutlined />, color: theme.chartColors[3] },
    { title: 'Avg Rating', value: formatRating(avg), suffix: '/ 10', prefix: <StarOutlined />, color: ratingColor(avg, theme) ?? theme.chartText },
    { title: 'Episodes Watched', value: totalEpisodes.toLocaleString(), prefix: <PlayCircleOutlined />, color: theme.chartColors[5] },
    { title: 'Completion Rate', value: completion, suffix: '%', prefix: <CheckCircleOutlined />, color: completionColor(completion, theme) },
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
        {/* LEFT: Highlights + Continue Watching + Recently Watched */}
        <Col xs={24} lg={16}>
          <Highlights topShow={topShow} topRated={topRated} newestShow={newestShow} theme={theme} navigate={navigate} />
          {inProgress.length > 0 && (
            <ContinueWatching shows={inProgress} order={continueOrder} onOrderChange={setContinueOrder} theme={theme} navigate={navigate} />
          )}
          <RecentlyWatched shows={recentlyWatched} theme={theme} navigate={navigate} />
        </Col>

        {/* RIGHT: Sidebar */}
        <Col xs={24} lg={8}>
          <SidebarTabs topGenres={topGenres} statuses={statuses} ratingDist={ratingDist} theme={theme} />
          <NotStartedList shows={notStarted} theme={theme} navigate={navigate} />
        </Col>
      </Row>

      <ExploreCards theme={theme} navigate={navigate} />
    </>
  )
}
