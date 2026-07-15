import { memo, useCallback, useMemo, useState } from 'react'
import { Card, Col, Grid, Row, Tabs, Typography } from 'antd'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TvSeries } from '../types/series'
import {
  ageRatingDistribution,
  completionByGenre,
  genreDistribution,
  languageDistribution,
  networkDistribution,
  ratingBuckets,
  seasonsWatchedDepth,
  showsByYear,
  statusDistribution,
  topActors,
  topByWatchTime,
  topCreators,
  watchTimeByDecade,
  watchTimeByYear,
} from '../utils/derive'
import { completionColor } from '../constants/ui'
import { useTheme } from '../ThemeContext'

const { Text } = Typography

// Defined outside the component so recharts always gets the same component type —
// prevents remounting (and tooltip flicker) on every ChartsSection render.
interface ScatterPayload {
  payload: { x: number; y: number; name: string }
}
interface ScatterTooltipProps {
  payload?: ScatterPayload[]
  style?: React.CSSProperties
}
const ScatterTooltipContent = memo(function ScatterTooltipContent({ payload, style }: ScatterTooltipProps) {
  if (!payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={style}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.name}</div>
      <div>Rating: {d.x}</div>
      <div>Popularity: {Math.round(d.y)}</div>
    </div>
  )
})

interface Props {
  data: TvSeries[]
}

export const ChartsSection = memo(function ChartsSection({ data }: Props) {
  const theme = useTheme()
  const screens = Grid.useBreakpoint()

  const { chartColors, chartGrid: gridColor, chartText: textColor, areaFill } = theme

  const chartHeight = screens.md ? 280 : 220
  const barHeight = screens.md ? 260 : 200
  const yAxisWidth = screens.md ? 110 : 70
  const [genresAnimDone, setGenresAnimDone] = useState(false)
  const [statusAnimDone, setStatusAnimDone] = useState(false)

  // All derive calls memoized on data — data is stable after CSV load, so these run once.
  const genres = useMemo(() => genreDistribution(data).slice(0, 10), [data])
  const ratings = useMemo(() => ratingBuckets(data), [data])
  const byYear = useMemo(() => showsByYear(data), [data])
  const topShows = useMemo(() => topByWatchTime(data, 10), [data])
  const statuses = useMemo(() => statusDistribution(data), [data])
  const networks = useMemo(() => networkDistribution(data, 10), [data])
  const decadeData = useMemo(() => watchTimeByDecade(data), [data])
  const yearWatchData = useMemo(() => watchTimeByYear(data), [data])
  const genreCompletion = useMemo(() => completionByGenre(data), [data])
  const actorsData = useMemo(() => topActors(data, 10), [data])
  const creatorsData = useMemo(() => topCreators(data, 10), [data])
  const languages = useMemo(() => languageDistribution(data), [data])
  const ageRatings = useMemo(() => ageRatingDistribution(data), [data])
  const depthData = useMemo(() => seasonsWatchedDepth(data), [data])
  const scatterData = useMemo(
    () => data.filter(s => s.voteAverage > 0 && s.popularity > 0).map(s => ({ x: s.voteAverage, y: s.popularity, name: s.name })),
    [data]
  )

  const tooltipBg = useMemo<React.CSSProperties>(() => ({
    background: theme.headerBg,
    border: `1px solid ${gridColor}`,
    padding: '8px 12px',
    borderRadius: 6,
    fontSize: 12,
    color: textColor,
  }), [theme.headerBg, gridColor, textColor])

  const scatterTooltipEl = useMemo(() => <ScatterTooltipContent style={tooltipBg} />, [tooltipBg])

  const genrePieLabel = ({ name, percent }: { name: string; percent: number }) =>
    `${name} ${(percent * 100).toFixed(0)}%`

  const peopleBarChart = useCallback((items: { name: string; count: number }[], color: string) => (
    <ResponsiveContainer width="100%" height={barHeight} debounce={200}>
      <BarChart
        data={items.map(a => ({ name: a.name.length > 20 ? a.name.slice(0, 18) + '…' : a.name, count: a.count }))}
        layout="vertical"
        margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis type="number" tick={{ fill: textColor, fontSize: 11 }} allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={yAxisWidth} tick={{ fill: textColor, fontSize: 11 }} />
        <Tooltip formatter={(v: number) => [`${v} shows`, 'Count']} />
        <Bar dataKey="count" name="Shows" fill={color} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  ), [barHeight, yAxisWidth, gridColor, textColor])

  return (
    <Row gutter={[16, 16]}>

            {/* Top Genres */}
            <Col xs={24} md={12}>
              <Card title="Top Genres" size="small">
                <ResponsiveContainer width="100%" height={chartHeight} debounce={200} aria-label="Top genres pie chart">
                  <PieChart>
                    <Pie
                      data={genres}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={screens.md ? 95 : 75}
                      label={screens.md ? genrePieLabel : false}
                      labelLine={false}
                      onAnimationEnd={() => setGenresAnimDone(true)}
                    >
                      {genres.map((_, i) => (
                        <Cell key={i} fill={chartColors[i % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number, name: string) => [`${v} shows`, name]} />
                    <Legend wrapperStyle={{ opacity: genresAnimDone ? 1 : 0, transition: 'opacity 0.3s' }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* Status Breakdown */}
            <Col xs={24} md={12}>
              <Card title="Status Breakdown" size="small">
                <ResponsiveContainer width="100%" height={chartHeight} debounce={200} aria-label="Show status breakdown donut chart">
                  <PieChart>
                    <Pie
                      data={statuses}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={screens.md ? 55 : 40}
                      outerRadius={screens.md ? 95 : 75}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      onAnimationEnd={() => setStatusAnimDone(true)}
                    >
                      {statuses.map((_, i) => (
                        <Cell key={i} fill={chartColors[i % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number, name: string) => [`${v} shows`, name]} />
                    <Legend wrapperStyle={{ opacity: statusAnimDone ? 1 : 0, transition: 'opacity 0.3s' }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* Language Breakdown */}
            <Col xs={24} md={12}>
              <Card title="Language Breakdown" size="small">
                <ResponsiveContainer width="100%" height={barHeight} debounce={200} aria-label="Language breakdown bar chart">
                  <BarChart
                    data={languages}
                    layout="vertical"
                    margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis type="number" tick={{ fill: textColor, fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={yAxisWidth} tick={{ fill: textColor, fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [`${v} shows`, 'Count']} />
                    <Bar dataKey="value" name="Shows" fill={chartColors[7]} radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* Age Rating Distribution */}
            <Col xs={24} md={12}>
              <Card title="Age Rating Distribution" size="small">
                <ResponsiveContainer width="100%" height={barHeight} debounce={200} aria-label="Age rating distribution bar chart">
                  <BarChart data={ageRatings} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="name" tick={{ fill: textColor, fontSize: 11 }} />
                    <YAxis tick={{ fill: textColor, fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={(v: number) => [`${v} shows`, 'Count']} />
                    <Bar dataKey="value" name="Shows" fill={chartColors[8]} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* Rating Distribution */}
            <Col xs={24} md={12}>
              <Card title="Rating Distribution" size="small">
                <ResponsiveContainer width="100%" height={barHeight} debounce={200}>
                  <BarChart data={ratings} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="range" tick={{ fill: textColor, fontSize: 11 }} />
                    <YAxis tick={{ fill: textColor, fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={(v: number) => [`${v} shows`, 'Count']} />
                    <Bar dataKey="count" name="Shows" fill={chartColors[0]} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* Shows by First Air Year */}
            <Col xs={24} md={12}>
              <Card title="Shows by First Air Year" size="small">
                <ResponsiveContainer width="100%" height={barHeight} debounce={200}>
                  <BarChart data={byYear} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="year" tick={{ fill: textColor, fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: textColor, fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={(v: number) => [`${v} shows`, 'Count']} />
                    <Bar dataKey="count" name="Shows" fill={chartColors[1]} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* Top Networks */}
            <Col xs={24} md={12}>
              <Card title="Top Networks" size="small">
                <ResponsiveContainer width="100%" height={barHeight} debounce={200} aria-label="Top networks bar chart">
                  <BarChart
                    data={networks.map(n => ({
                      name: n.name.length > 20 ? n.name.slice(0, 18) + '…' : n.name,
                      value: n.value,
                    }))}
                    layout="vertical"
                    margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis type="number" tick={{ fill: textColor, fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={yAxisWidth} tick={{ fill: textColor, fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [`${v} shows`, 'Count']} />
                    <Bar dataKey="value" name="Shows" fill={chartColors[2]} radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* Top 10 by Watch Time */}
            <Col xs={24} md={12}>
              <Card title="Top 10 by Watch Time" size="small">
                <ResponsiveContainer width="100%" height={barHeight} debounce={200}>
                  <BarChart
                    data={topShows.map(s => ({
                      name: s.name.length > 18 ? s.name.slice(0, 16) + '…' : s.name,
                      mins: s.totalRuntimeWatched,
                    }))}
                    layout="vertical"
                    margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis type="number" tick={{ fill: textColor, fontSize: 11 }} tickFormatter={v => `${Math.round(v / 60)}h`} />
                    <YAxis type="category" dataKey="name" width={yAxisWidth} tick={{ fill: textColor, fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [`${Math.round(v / 60)}h ${v % 60}m`, 'Watch time']} />
                    <Bar dataKey="mins" name="Watch time" fill={chartColors[4]} radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <Text type="secondary" style={{ fontSize: 11 }}>Sorted by total runtime watched</Text>
              </Card>
            </Col>

            {/* Watch Time by Decade */}
            <Col xs={24}>
              <Card title="Watch Time by Decade" size="small" extra={<Text type="secondary" style={{ fontSize: 11 }}>Hours watched, grouped by show era</Text>}>
                <ResponsiveContainer width="100%" height={chartHeight} debounce={200}>
                  <AreaChart data={decadeData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="decadeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={areaFill} stopOpacity={0.7} />
                        <stop offset="95%" stopColor={areaFill} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="decade" tick={{ fill: textColor, fontSize: 11 }} />
                    <YAxis tick={{ fill: textColor, fontSize: 11 }} tickFormatter={v => `${v}h`} />
                    <Tooltip formatter={(v: number) => [`${v}h`, 'Hours watched']} />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke={areaFill}
                      strokeWidth={2}
                      fill="url(#decadeGradient)"
                      dot={{ fill: areaFill, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* Watch Time by Release Year */}
            <Col xs={24} md={12}>
              <Card title="Watch Time by Release Year" size="small" extra={<Text type="secondary" style={{ fontSize: 11 }}>Hours watched per year</Text>}>
                <ResponsiveContainer width="100%" height={barHeight} debounce={200}>
                  <BarChart data={yearWatchData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="year" tick={{ fill: textColor, fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: textColor, fontSize: 11 }} tickFormatter={v => `${v}h`} />
                    <Tooltip formatter={(v: number) => [`${v}h`, 'Hours watched']} />
                    <Bar dataKey="hours" name="Hours" fill={chartColors[3]} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* Rating vs Popularity Scatter */}
            <Col xs={24} md={12}>
              <Card title="Rating vs Popularity" size="small" extra={<Text type="secondary" style={{ fontSize: 11 }}>Each dot is a show</Text>}>
                <ResponsiveContainer width="100%" height={barHeight} debounce={200}>
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="Rating"
                      domain={[0, 10]}
                      tick={{ fill: textColor, fontSize: 11 }}
                      label={{ value: 'Rating', position: 'insideBottom', offset: -10, fill: textColor, fontSize: 11 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="Popularity"
                      tick={{ fill: textColor, fontSize: 11 }}
                      tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
                    />
                    <Tooltip content={scatterTooltipEl} />
                    <Scatter data={scatterData} fill={chartColors[0]} opacity={0.65} />
                  </ScatterChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* Completion Rate by Genre */}
            <Col xs={24} md={12}>
              <Card title="Completion Rate by Genre" size="small" extra={<Text type="secondary" style={{ fontSize: 11 }}>% episodes watched</Text>}>
                <ResponsiveContainer width="100%" height={barHeight} debounce={200}>
                  <BarChart
                    data={genreCompletion.map(g => ({
                      name: g.genre.length > 18 ? g.genre.slice(0, 16) + '…' : g.genre,
                      pct: g.pct,
                    }))}
                    layout="vertical"
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: textColor, fontSize: 11 }} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="name" width={yAxisWidth} tick={{ fill: textColor, fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [`${v}%`, 'Completion']} />
                    <Bar dataKey="pct" name="Completion" radius={[0, 3, 3, 0]}>
                      {genreCompletion.map((entry, i) => (
                        <Cell key={i} fill={completionColor(entry.pct)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* Seasons Watched Depth */}
            <Col xs={24} md={12}>
              <Card title="Seasons Watched Depth" size="small" extra={<Text type="secondary" style={{ fontSize: 11 }}>Shows by seasons watched</Text>}>
                <ResponsiveContainer width="100%" height={barHeight} debounce={200}>
                  <BarChart data={depthData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="depth" tick={{ fill: textColor, fontSize: 11 }} />
                    <YAxis tick={{ fill: textColor, fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={(v: number) => [`${v} shows`, 'Count']} />
                    <Bar dataKey="count" name="Shows" fill={chartColors[9]} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* Top Actors & Creators */}
            <Col xs={24} md={12}>
              <Card title="Top Actors & Creators" size="small">
                <Tabs
                  size="small"
                  items={[
                    {
                      key: 'actors',
                      label: 'Actors',
                      children: actorsData.length ? peopleBarChart(actorsData, chartColors[5]) : <Text type="secondary">No actor data</Text>,
                    },
                    {
                      key: 'creators',
                      label: 'Creators',
                      children: creatorsData.length ? peopleBarChart(creatorsData, chartColors[6]) : <Text type="secondary">No creator data</Text>,
                    },
                  ]}
                />
              </Card>
            </Col>

    </Row>
  )
})
