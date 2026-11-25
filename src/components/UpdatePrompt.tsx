import { useEffect, useRef } from 'react'
import { Button, notification } from 'antd'
import { useRegisterSW } from 'virtual:pwa-register/react'

const KEY = 'app-update'
// An installed window / long-open tab gets no navigations, so also look for a new build hourly
const UPDATE_CHECK_MS = 60 * 60 * 1000

// Production only (vite-plugin-pwa serves a no-op register module in dev / tests). Registers the
// service worker; when a new build is waiting (registerType 'prompt'), offers "Reload" instead of
// swapping code mid-session. Hook form of notification so it picks up the ConfigProvider theme.
export function UpdatePrompt() {
  const [api, contextHolder] = notification.useNotification()
  // Set when *this* tab clicked Reload: the new worker then takes control of every open tab, but
  // only this one reloads — others are told instead (an unannounced reload there would drop
  // e.g. a pending debounced filter save)
  const reloadRequested = useRef(false)
  const dismissed = useRef(false)

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      const check = () => { registration.update().catch(() => {}) }
      setInterval(check, UPDATE_CHECK_MS)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
    },
    onNeedReload() {
      if (reloadRequested.current) {
        window.location.reload()
        return
      }
      api.open({
        key: KEY,
        message: 'TV Dashboard was updated',
        description: 'It was updated in another tab. Reload this one to finish.',
        duration: 0,
        actions: <Button type="primary" size="small" onClick={() => window.location.reload()}>Reload</Button>,
      })
    },
  })

  useEffect(() => {
    if (!needRefresh) return
    const show = () => {
      dismissed.current = false
      api.open({
        key: KEY,
        message: 'New version available',
        description: 'Reload to use the latest version of TV Dashboard.',
        duration: 0,
        onClose: () => { dismissed.current = true },
        actions: (
          <Button
            type="primary"
            size="small"
            onClick={() => {
              reloadRequested.current = true
              void updateServiceWorker(true)
            }}
          >
            Reload
          </Button>
        ),
      })
    }
    show()
    // Closed without reloading → offer it again the next time the tab comes back into view
    const onVisible = () => {
      if (document.visibilityState === 'visible' && dismissed.current) show()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [needRefresh, api, updateServiceWorker])

  return contextHolder
}
