import type { ReactNode } from 'react'
import { Card, Statistic } from 'antd'

interface Props {
  title: string
  value: string | number
  color: string
  prefix: ReactNode
  suffix?: string
  precision?: number
  shadow: string
  // compact: smaller icon badge + value, ellipsized — for dense grids (StatsBar)
  compact?: boolean
}

// Stat tile: tinted icon badge + colored top border + colored Statistic value
export function StatCard({ title, value, color, prefix, suffix, precision, shadow, compact }: Props) {
  const badge = compact ? 36 : 40
  return (
    <Card
      size="small"
      style={{ height: '100%', borderRadius: 10, border: `1px solid ${color}40`, borderTop: `3px solid ${color}`, boxShadow: shadow }}
      styles={{ body: { display: 'flex', alignItems: 'center', gap: 12 } }}
    >
      <div style={{ width: badge, height: badge, borderRadius: compact ? 8 : 10, background: `${color}22`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: compact ? 16 : 18, flexShrink: 0 }}>
        {prefix}
      </div>
      <Statistic
        title={title}
        value={value}
        suffix={suffix}
        precision={precision}
        valueStyle={compact
          ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color, fontWeight: 700, fontSize: 20 }
          : { color, fontWeight: 700 }}
      />
    </Card>
  )
}
