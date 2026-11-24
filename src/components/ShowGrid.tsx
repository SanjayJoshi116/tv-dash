import { memo } from 'react'
import { Empty, Grid } from 'antd'
import type { TvSeries } from '../types/series'
import { SPACING, responsiveColumns } from '../constants/ui'
import { ShowCard } from './ShowCard'

interface Props {
  data: TvSeries[]
}

export const ShowGrid = memo(function ShowGrid({ data }: Props) {
  const screens = Grid.useBreakpoint()
  const columnCount = responsiveColumns(screens, { xxl: 8, xl: 6, lg: 6, md: 4, sm: 3, base: 2 })

  if (!data.length) {
    return <Empty description="No shows match your filters" style={{ marginTop: 48 }} />
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        gap: SPACING.lg,
        paddingBottom: SPACING.lg,
      }}
    >
      {data.map(series => (
        <ShowCard key={series.tvId} series={series} />
      ))}
    </div>
  )
})
