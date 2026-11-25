import { Component, type ErrorInfo, type ReactNode } from 'react'
import { resetSettings } from '../utils/settings'
import { errorMessage } from '../utils/errorMessage'
import { activateWaitingServiceWorker } from '../utils/serviceWorker'

interface Props {
  children: ReactNode
  // Injectable for tests; defaults to activating a waiting service worker (a fixed build), then
  // a real reload
  reload?: () => void
}

// `hasError`, not `error != null`: `throw undefined` / `throw null` must show the fallback too
// (re-rendering the children would throw past this boundary → blank page)
interface State {
  hasError: boolean
  error: unknown
}

// Outermost boundary (main.tsx): catches render errors in the shell — providers, router,
// AppLayout (rethrown by the layout route's RootRouteError) — that PageError (pages only) can't. The fallback uses plain elements and
// CSS system colors: antd or the theme may be what crashed. Recovery is reload-based (the
// router is inside), so no reset-on-navigation.
export class RootErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('App shell render failed:', error, info.componentStack)
  }

  private reload = () => {
    if (this.props.reload) this.props.reload()
    else void activateWaitingServiceWorker().then(() => window.location.reload())
  }

  private resetAndReload = () => {
    resetSettings()
    this.reload()
  }

  render() {
    const { hasError, error } = this.state
    if (!hasError) return this.props.children
    const button = {
      font: 'inherit', padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
      background: 'ButtonFace', color: 'ButtonText', border: '1px solid ButtonBorder',
    } as const
    return (
      <main
        role="alert"
        style={{
          colorScheme: 'light dark', background: 'Canvas', color: 'CanvasText',
          height: '100%', boxSizing: 'border-box', padding: 24, overflow: 'auto',
          fontFamily: 'system-ui, sans-serif', lineHeight: 1.5,
        }}
      >
        <div style={{ maxWidth: 560, margin: '10vh auto 0' }}>
          <h1 style={{ fontSize: 22, margin: '0 0 8px' }}>TV Dashboard couldn’t start</h1>
          <p style={{ margin: '0 0 12px' }}>
            Something went wrong while showing the app. Reloading often helps; if it keeps
            happening, resetting saved settings (theme, Shows filters, sidebar) may fix it.
          </p>
          {/* React text — escaped, never HTML */}
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '0 0 16px', padding: 12, border: '1px solid GrayText', borderRadius: 6, fontSize: 13 }}>
            {errorMessage(error)}
          </pre>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" style={button} onClick={this.reload}>Reload</button>
            <button type="button" style={button} onClick={this.resetAndReload}>Reset saved settings</button>
          </div>
        </div>
      </main>
    )
  }
}
