import type { CSSProperties, ReactNode } from 'react'
import { Card } from 'antd'
import type { TvSeries } from '../../types/series'
import { showLinkProps } from '../../utils/showLink'
import { PosterThumb } from '../../components/PosterThumb'

interface ShowRowCardProps {
  series: TvSeries
  bg: string
  navigate: (to: string) => void
  children: ReactNode
  thumb?: { width: number; height: number; iconSize: number }
  header?: ReactNode
  ariaLabel?: string
  style?: CSSProperties
  padding?: number
}

const DEFAULT_THUMB = { width: 48, height: 72, iconSize: 18 }
export const HIGHLIGHT_THUMB = { width: 44, height: 66, iconSize: 16 }

// The Dashboard's clickable show card (Highlights, Continue Watching, Recently Watched)
export function ShowRowCard({ series, bg, navigate, children, thumb = DEFAULT_THUMB, header, ariaLabel, style, padding = 10 }: ShowRowCardProps) {
  return (
    <Card
      hoverable
      size="small"
      {...showLinkProps(series.tvId, navigate)}
      aria-label={ariaLabel ?? series.name}
      style={style}
      styles={{ body: { padding } }}
    >
      {header}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <PosterThumb series={series} {...thumb} bg={bg} />
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      </div>
    </Card>
  )
}
