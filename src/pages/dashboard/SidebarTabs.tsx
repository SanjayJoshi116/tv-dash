import { memo } from 'react'
import type { To } from 'react-router-dom'
import { Card, Progress, Tabs, Typography } from 'antd'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChartOutlined, StarOutlined, TagsOutlined } from '@ant-design/icons'
import type { NameValue } from '../../types/series'
import type { Theme } from '../../themes'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { cardStyle, statusHex } from '../../constants/ui'
import { showsLink } from '../../utils/showsLink'
import { FilterLink } from '../../components/FilterLink'

const { Text } = Typography

interface Props {
  topGenres: NameValue[]
  statuses: NameValue[]
  ratingDist: { range: string; count: number }[]
  theme: Theme
}

// Top Genres / Watch Status / Ratings — tabbed, keeps the sidebar height in check. memo: the
// Continue Watching order toggle re-renders the page; this (and its chart) doesn't need to follow.
export const SidebarTabs = memo(function SidebarTabs({ topGenres, statuses, ratingDist, theme }: Props) {
  const reducedMotion = usePrefersReducedMotion()
  const genreMax = topGenres[0]?.value ?? 1
  const statusTotal = statuses.reduce((s, d) => s + d.value, 0)

  // `link` (from showsLink): the whole row — name, count, bar — is one link, a big hit area on mobile
  const renderBar = (name: string, value: number, percent: number, strokeColor: string, link: { to: To; label: string }) => (
    <div key={name} style={{ marginBottom: 8 }}>
      <FilterLink to={link.to} ariaLabel={link.label} block>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <Text style={{ fontSize: 13 }}>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{value}</Text>
        </div>
        <Progress percent={percent} showInfo={false} size="small" strokeColor={strokeColor} />
      </FilterLink>
    </div>
  )

  return (
    <Card size="small" style={{ marginBottom: 12, ...cardStyle(theme.isDark) }} styles={{ body: { paddingTop: 0 } }}>
      <Tabs
        size="small"
        items={[
          {
            key: 'genres',
            label: <><TagsOutlined style={{ marginRight: 6 }} />Top Genres</>,
            children: topGenres.map(({ name, value }) => renderBar(name, value, Math.round((value / genreMax) * 100), theme.token.colorPrimary, { to: showsLink({ genre: name }), label: `${value} shows in genre ${name}` })),
          },
          {
            key: 'status',
            label: <><BarChartOutlined style={{ marginRight: 6 }} />Watch Status</>,
            children: statuses.map(({ name, value }, i) => renderBar(name, value, Math.round((value / statusTotal) * 100), statusHex(name, theme.chartColors[i % theme.chartColors.length]), { to: showsLink({ status: name }), label: `${value} shows with status ${name}` })),
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
  )
})
