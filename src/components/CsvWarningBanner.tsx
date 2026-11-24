import { useState } from 'react'
import { Alert } from 'antd'
import { SECTION_GAP } from '../constants/ui'

const MAX_LISTED = 3

interface Props {
  warnings: string[]
}

// Skipped CSV rows used to be console-only, so shows could silently vanish (e.g. series-search.py
// appending rows with a different column count). Dismissal is tied to the warnings array
// identity: a refetch produces a new array, so the banner reappears for fresh problems.
export function CsvWarningBanner({ warnings }: Props) {
  const [dismissed, setDismissed] = useState<string[] | null>(null)
  if (warnings.length === 0 || dismissed === warnings) return null

  const extra = warnings.length - MAX_LISTED
  return (
    <Alert
      type="warning"
      showIcon
      closable
      onClose={() => setDismissed(warnings)}
      style={{ marginBottom: SECTION_GAP }}
      message={`${warnings.length} ${warnings.length === 1 ? 'row' : 'rows'} in tv_series.csv skipped`}
      description={
        <>
          {warnings.slice(0, MAX_LISTED).map(w => <div key={w}>{w}</div>)}
          {extra > 0 && <div>…and {extra} more (see browser console)</div>}
        </>
      }
    />
  )
}
