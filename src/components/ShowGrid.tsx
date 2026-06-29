import { memo } from 'react'
import { Empty, Grid } from 'antd'
import type { TvSeries } from '../types/series'
import { ShowCard } from './ShowCard'

interface Props {
  data: TvSeries[]
}

export const ShowGrid = memo(function ShowGrid({ data }: Props) {
  const screens = Grid.useBreakpoint()
  const columnCount = screens.xxl ? 8 : screens.xl ? 6 : screens.lg ? 6 : screens.md ? 4 : screens.sm ? 3 : 2

  if (!data.length) {
    return <Empty description="No shows match your filters" style={{ marginTop: 48 }} />
  }

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
          gap: 16,
          paddingBottom: 16,
        }}
      >
        {data.map(series => (
          <ShowCard key={series.tvId} series={series} />
        ))}
      </div>
    </div>
  )
})
