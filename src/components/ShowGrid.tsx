import { memo, useEffect, useRef, useState } from 'react'
import { Empty } from 'antd'
import type { TvSeries } from '../types/series'
import { ShowCard } from './ShowCard'

interface Props {
  data: TvSeries[]
}

function getColumnCount(width: number): number {
  if (width >= 1600) return 8
  if (width >= 992) return 6
  if (width >= 768) return 4
  if (width >= 576) return 3
  return 2
}

export const ShowGrid = memo(function ShowGrid({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [columnCount, setColumnCount] = useState(6)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setColumnCount(getColumnCount(el.getBoundingClientRect().width))
    const ro = new ResizeObserver(entries => {
      setColumnCount(getColumnCount(entries[0].contentRect.width))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (!data.length) {
    return <Empty description="No shows match your filters" style={{ marginTop: 48 }} />
  }

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
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
