import { memo, useMemo, useState } from 'react'
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
import type { NameValue, TvSeries } from '../types/series'
import {
  ageRatingDistribution,
  completionByGenre,
  formatRuntime,
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
  truncate,
  watchTimeByDecade,
  watchTimeByYear,
} from '../utils/derive'
import { cardStyle as baseCardStyle, completionColor, statusHex } from '../constants/ui'
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

// Pie + legend that fades in after the slice animation. The anim-done flag lives here,
// not in ChartsSection, so it resets whenever the tab pane remounts (destroyOnHidden) —
// otherwise the legend would be fully visible while the pie replays its entry animation.
interface AnimatedPieProps {
  data: NameValue[]
  colors: string[]
  height: number
  ariaLabel: string
  innerRadius?: number
  outerRadius: number
  label: PieLabel
}
type PieLabel = false | ((p: { name: string; percent: number }) => string)
function AnimatedPie({ data, colors, height, ariaLabel, innerRadius, outerRadius, label }: AnimatedPieProps) {
  const [animDone, setAnimDone] = useState(false)
  return (
    <ResponsiveContainer width="100%" height={height} debounce={200} aria-label={ariaLabel}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          label={label}
          labelLine={false}
          onAnimationEnd={() => setAnimDone(true)}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number, name: string) => [`${v} shows`, name]} />
        <Legend wrapperStyle={{ opacity: animDone ? 1 : 0, transition: 'opacity 0.3s' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

interface Props {
  data: TvSeries[]
}

export const ChartsSection = memo(function ChartsSection({ data }: Props) {
  const theme = useTheme()
  const screens = Grid.useBreakpoint()

  const { chartColors, chartGrid: gridColor, chartText: textColor, areaFill } = theme
  const cardStyle = baseCardStyle(theme.isDark)

  const chartHeight = screens.md ? 280 : 220
  const barHeight = screens.md ? 260 : 200
  const yAxisWidth = screens.md ? 110 : 70

  // All derive calls memoized on data — data is stable after CSV load, so these run once.
  const genres = useMemo(() => genreDistribution(data).slice(0, 10), [data])
  const ratings = useMemo(() => ratingBuckets(data), [data])
  const byYear = useMemo(() => showsByYear(data), [data])
  // Label truncation happens inside the memos so each chart gets a stable `data`
  // reference — recharts re-lays-out (and replays the bar animation) on a new array.
  const topShows = useMemo(
    () => topByWatchTime(data, 10).map(s => ({ name: truncate(s.name, 18), mins: s.totalRuntimeWatched })),
    [data]
  )
  const statuses = useMemo(() => statusDistribution(data), [data])
  const genreColors = useMemo(() => genres.map((_, i) => chartColors[i % chartColors.length]), [genres, chartColors])
  const statusColors = useMemo(
    () => statuses.map((s, i) => statusHex(s.name, chartColors[i % chartColors.length])),
    [statuses, chartColors]
  )
  const networks = useMemo(() => networkDistribution(data, 10).map(n => ({ ...n, name: truncate(n.name) })), [data])
  const decadeData = useMemo(() => watchTimeByDecade(data), [data])
  const yearWatchData = useMemo(() => watchTimeByYear(data), [data])
  const genreCompletion = useMemo(() => completionByGenre(data).map(g => ({ name: truncate(g.genre, 18), pct: g.pct })), [data])
  const actorsData = useMemo(() => topActors(data, 10).map(a => ({ ...a, name: truncate(a.name) })), [data])
  const creatorsData = useMemo(() => topCreators(data, 10).map(c => ({ ...c, name: truncate(c.name) })), [data])
  const languages = useMemo(() => languageDistribution(data), [data])
  const ageRatings = useMemo(() => ageRatingDistribution(data), [data])
  const depthData = useMemo(() => seasonsWatchedDepth(data), [data])
  const scatterData = useMemo(
    () => data.flatMap(s => (s.voteAverage != null && s.popularity > 0 ? [{ x: s.voteAverage, y: s.popularity, name: s.name }] : [])),
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

  const statusPieLabel = ({ percent }: { percent: number }) => `${(percent * 100).toFixed(0)}%`

  const axisTick = { fill: textColor, fontSize: 11 }

  // Horizontal "N shows per name" bar chart — Languages, Networks, Actors, Creators
  const countBarChart = (items: { name: string }[], dataKey: string, color: string, ariaLabel?: string) => (
    <ResponsiveContainer width="100%" height={barHeight} debounce={200} aria-label={ariaLabel}>
      <BarChart data={items} layout="vertical" margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis type="number" tick={axisTick} allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={yAxisWidth} tick={axisTick} />
        <Tooltip formatter={(v: number) => [`${v} shows`, 'Count']} />
        <Bar dataKey={dataKey} name="Shows" fill={color} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )

  const overviewCharts = (
    <Row gutter={[16, 16]}>
      {/* Top Genres */}
      <Col xs={24} md={12}>
        <Card title="Top Genres" size="small" style={cardStyle}>
          <AnimatedPie
            data={genres}
            colors={genreColors}
            height={chartHeight}
            ariaLabel="Top genres pie chart"
            outerRadius={screens.md ? 95 : 75}
            label={screens.md ? genrePieLabel : false}
          />
        </Card>
      </Col>

      {/* Status Breakdown */}
      <Col xs={24} md={12}>
        <Card title="Status Breakdown" size="small" style={cardStyle}>
          <AnimatedPie
            data={statuses}
            colors={statusColors}
            height={chartHeight}
            ariaLabel="Show status breakdown donut chart"
            innerRadius={screens.md ? 55 : 40}
            outerRadius={screens.md ? 95 : 75}
            label={statusPieLabel}
          />
        </Card>
      </Col>

      {/* Language Breakdown */}
      <Col xs={24} md={12}>
        <Card title="Language Breakdown" size="small" style={cardStyle}>
          {countBarChart(languages, 'value', chartColors[7], 'Language breakdown bar chart')}
        </Card>
      </Col>

      {/* Age Rating Distribution */}
      <Col xs={24} md={12}>
        <Card title="Age Rating Distribution" size="small" style={cardStyle}>
          <ResponsiveContainer width="100%" height={barHeight} debounce={200} aria-label="Age rating distribution bar chart">
            <BarChart data={ageRatings} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" tick={axisTick} />
              <YAxis tick={axisTick} allowDecimals={false} />
              <Tooltip formatter={(v: number) => [`${v} shows`, 'Count']} />
              <Bar dataKey="value" name="Shows" fill={chartColors[8]} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>

      {/* Shows by First Air Year */}
      <Col xs={24}>
        <Card title="Shows by First Air Year" size="small" style={cardStyle}>
          <ResponsiveContainer width="100%" height={barHeight} debounce={200}>
            <BarChart data={byYear} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="year" tick={axisTick} interval="preserveStartEnd" />
              <YAxis tick={axisTick} allowDecimals={false} />
              <Tooltip formatter={(v: number) => [`${v} shows`, 'Count']} />
              <Bar dataKey="count" name="Shows" fill={chartColors[1]} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>
    </Row>
  )

  const watchTimeCharts = (
    <Row gutter={[16, 16]}>
      {/* Top 10 by Watch Time */}
      <Col xs={24} md={12}>
        <Card title="Top 10 by Watch Time" size="small" style={cardStyle}>
          <ResponsiveContainer width="100%" height={barHeight} debounce={200}>
            <BarChart
              data={topShows}
              layout="vertical"
              margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis type="number" tick={axisTick} tickFormatter={v => `${Math.round(v / 60)}h`} />
              <YAxis type="category" dataKey="name" width={yAxisWidth} tick={axisTick} />
              <Tooltip formatter={(v: number) => [formatRuntime(v), 'Watch time']} />
              <Bar dataKey="mins" name="Watch time" fill={chartColors[4]} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <Text type="secondary" style={{ fontSize: 11 }}>Sorted by total runtime watched</Text>
        </Card>
      </Col>

      {/* Seasons Watched Depth */}
      <Col xs={24} md={12}>
        <Card title="Seasons Watched Depth" size="small" style={cardStyle} extra={<Text type="secondary" style={{ fontSize: 11 }}>Shows by seasons watched</Text>}>
          <ResponsiveContainer width="100%" height={barHeight} debounce={200}>
            <BarChart data={depthData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="depth" tick={axisTick} />
              <YAxis tick={axisTick} allowDecimals={false} />
              <Tooltip formatter={(v: number) => [`${v} shows`, 'Count']} />
              <Bar dataKey="count" name="Shows" fill={chartColors[9]} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>

      {/* Watch Time by Decade */}
      <Col xs={24}>
        <Card title="Watch Time by Decade" size="small" style={cardStyle} extra={<Text type="secondary" style={{ fontSize: 11 }}>Hours watched, grouped by show era</Text>}>
          <ResponsiveContainer width="100%" height={chartHeight} debounce={200}>
            <AreaChart data={decadeData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="decadeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={areaFill} stopOpacity={0.7} />
                  <stop offset="95%" stopColor={areaFill} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="decade" tick={axisTick} />
              <YAxis tick={axisTick} tickFormatter={v => `${v}h`} />
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
      <Col xs={24}>
        <Card title="Watch Time by Release Year" size="small" style={cardStyle} extra={<Text type="secondary" style={{ fontSize: 11 }}>Hours watched per year</Text>}>
          <ResponsiveContainer width="100%" height={barHeight} debounce={200}>
            <BarChart data={yearWatchData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="year" tick={axisTick} interval="preserveStartEnd" />
              <YAxis tick={axisTick} tickFormatter={v => `${v}h`} />
              <Tooltip formatter={(v: number) => [`${v}h`, 'Hours watched']} />
              <Bar dataKey="hours" name="Hours" fill={chartColors[3]} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>
    </Row>
  )

  const ratingsCharts = (
    <Row gutter={[16, 16]}>
      {/* Rating Distribution */}
      <Col xs={24} md={12}>
        <Card title="Rating Distribution" size="small" style={cardStyle}>
          <ResponsiveContainer width="100%" height={barHeight} debounce={200}>
            <BarChart data={ratings} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="range" tick={axisTick} />
              <YAxis tick={axisTick} allowDecimals={false} />
              <Tooltip formatter={(v: number) => [`${v} shows`, 'Count']} />
              <Bar dataKey="count" name="Shows" fill={chartColors[0]} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>

      {/* Rating vs Popularity Scatter */}
      <Col xs={24} md={12}>
        <Card title="Rating vs Popularity" size="small" style={cardStyle} extra={<Text type="secondary" style={{ fontSize: 11 }}>Each dot is a show</Text>}>
          <ResponsiveContainer width="100%" height={barHeight} debounce={200}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                type="number"
                dataKey="x"
                name="Rating"
                domain={[0, 10]}
                tick={axisTick}
                label={{ value: 'Rating', position: 'insideBottom', offset: -10, fill: textColor, fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Popularity"
                tick={axisTick}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
              />
              <Tooltip content={scatterTooltipEl} />
              <Scatter data={scatterData} fill={chartColors[0]} opacity={0.65} />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      </Col>

      {/* Completion Rate by Genre */}
      <Col xs={24}>
        <Card title="Completion Rate by Genre" size="small" style={cardStyle} extra={<Text type="secondary" style={{ fontSize: 11 }}>% episodes watched</Text>}>
          <ResponsiveContainer width="100%" height={barHeight} debounce={200}>
            <BarChart
              data={genreCompletion}
              layout="vertical"
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis type="number" domain={[0, 100]} tick={axisTick} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" width={yAxisWidth} tick={axisTick} />
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
    </Row>
  )

  const peopleCharts = (
    <Row gutter={[16, 16]}>
      {/* Top Networks */}
      <Col xs={24} md={12}>
        <Card title="Top Networks" size="small" style={cardStyle}>
          {countBarChart(networks, 'value', chartColors[2], 'Top networks bar chart')}
        </Card>
      </Col>

      {/* Top Actors & Creators */}
      <Col xs={24} md={12}>
        <Card title="Top Actors & Creators" size="small" style={cardStyle}>
          <Tabs
            size="small"
            destroyOnHidden
            items={[
              {
                key: 'actors',
                label: 'Actors',
                children: actorsData.length ? countBarChart(actorsData, 'count', chartColors[5]) : <Text type="secondary">No actor data</Text>,
              },
              {
                key: 'creators',
                label: 'Creators',
                children: creatorsData.length ? countBarChart(creatorsData, 'count', chartColors[6]) : <Text type="secondary">No creator data</Text>,
              },
            ]}
          />
        </Card>
      </Col>
    </Row>
  )

  return (
    // destroyOnHidden: antd keeps visited panes mounted by default — without it,
    // every chart ever opened re-renders on each theme/breakpoint change.
    <Tabs
      destroyOnHidden
      items={[
        { key: 'overview', label: 'Overview', children: overviewCharts },
        { key: 'watchtime', label: screens.sm ? 'Watch Time' : 'Time', children: watchTimeCharts },
        { key: 'ratings', label: 'Ratings', children: ratingsCharts },
        { key: 'people', label: screens.sm ? 'People & Networks' : 'People', children: peopleCharts },
      ]}
    />
  )
})
