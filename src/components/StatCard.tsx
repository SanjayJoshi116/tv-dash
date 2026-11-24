import type { ReactNode } from 'react'
import { Card, Statistic, type StatisticProps } from 'antd'

interface Props {
  title: string
  value: string | number
  color: string
  prefix: ReactNode
  suffix?: string
  precision?: number
  // e.g. String to skip Statistic's thousands separator for a year ("2,019")
  formatter?: StatisticProps['formatter']
  shadow: string
  // compact: smaller icon badge + value, ellipsized (full value on hover) — for dense grids
  compact?: boolean
}

// Hover text matching what the tile renders (precision + suffix), not the raw float
function hoverText(value: string | number, precision?: number, suffix?: string): string {
  const v = typeof value === 'number' && precision != null ? value.toFixed(precision) : String(value)
  return suffix ? `${v} ${suffix}` : v
}

// Stat tile: tinted icon badge + colored top border + colored Statistic value
export function StatCard({ title, value, color, prefix, suffix, precision, formatter, shadow, compact }: Props) {
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
      {/* minWidth 0: a flex child won't shrink below its content otherwise, so the compact
          value's ellipsis would never kick in and the text would overflow the card */}
      <div style={{ flex: 1, minWidth: 0 }} title={compact ? hoverText(value, precision, suffix) : undefined}>
        <Statistic
          title={title}
          value={value}
          suffix={suffix}
          precision={precision}
          formatter={formatter}
          valueStyle={compact
            ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color, fontWeight: 700, fontSize: 20 }
            : { color, fontWeight: 700 }}
        />
      </div>
    </Card>
  )
}
