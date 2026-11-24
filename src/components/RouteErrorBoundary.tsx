import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorState } from './ErrorState'

interface Props {
  pathname: string
  children: ReactNode
}

interface State {
  error: Error | null
}

// Catches render errors and failed lazy-chunk loads (e.g. stale hashed chunk after a deploy)
// so the layout stays mounted instead of white-screening. Clears the error when the pathname
// changes — not keyed by pathname, which would remount the page on /shows/1 → /shows/2.
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidUpdate(prev: Props, prevState: State) {
    // Only clear an error that was already showing before this update — if the page
    // threw on the very render that navigated here, prev.pathname is still the old path.
    if (prevState.error && this.state.error && prev.pathname !== this.props.pathname) {
      this.setState({ error: null })
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Route render failed:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          message="Something went wrong loading this page"
          description={this.state.error.message}
          onRetry={() => window.location.reload()}
        />
      )
    }
    return this.props.children
  }
}
