import { useState, type CSSProperties } from 'react'
import { VideoCameraOutlined } from '@ant-design/icons'
import type { TvSeries } from '../types/series'

interface Props {
  series: TvSeries
  width: number | string
  height: number | string
  iconSize: number
  bg: string
  radius?: number
  style?: CSSProperties
}

// Poster image with VideoCameraOutlined fallback for an empty OR broken/404 posterUrl
export function PosterThumb({ series, width, height, iconSize, bg, radius = 4, style }: Props) {
  const box: CSSProperties = { width, height, borderRadius: radius, flexShrink: 0, ...style }
  // Tracks which URL failed, so a different posterUrl gets a fresh attempt
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  return series.posterUrl && failedUrl !== series.posterUrl ? (
    <img src={series.posterUrl} alt={series.name} loading="lazy" onError={() => setFailedUrl(series.posterUrl)} style={{ ...box, objectFit: 'cover' }} />
  ) : (
    <div style={{ ...box, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <VideoCameraOutlined style={{ fontSize: iconSize, opacity: 0.4 }} />
    </div>
  )
}
