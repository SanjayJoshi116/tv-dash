import { useSyncExternalStore } from 'react'

// Live `navigator.onLine` (online / offline events) — drives the shell's offline notice.
// useSyncExternalStore like useMediaQuery: no effect + setState.
function subscribe(onChange: () => void): () => void {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

const getSnapshot = () => navigator.onLine

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot)
}
