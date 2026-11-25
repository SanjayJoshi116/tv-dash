import { Alert } from 'antd'
import { SECTION_GAP } from '../constants/ui'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

interface Props {
  // Whether shows are loaded — only then is "showing saved data" true (offline first visit,
  // evicted cache or the dev server have none)
  hasData: boolean
}

// Shell-level notice while the browser reports offline (navigator.onLine). Own component so an
// online/offline flip re-renders only this, not AppLayout.
export function OfflineNotice({ hasData }: Props) {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <Alert
      type="info"
      showIcon
      role="status"
      style={{ marginBottom: SECTION_GAP }}
      message={hasData ? 'Offline — showing saved data' : 'You’re offline'}
    />
  )
}
