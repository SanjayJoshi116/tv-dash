import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorState } from './ErrorState'
import { errorMessage } from '../utils/errorMessage'

interface Props {
  pathname: string
  children: ReactNode
}

// `hasError`, not `error != null`: a falsy throw (`throw undefined`) must still be caught
interface State {
  hasError: boolean
  error: unknown
}

// Catches render errors and failed lazy-chunk loads (e.g. stale hashed chunk after a deploy)
// so the layout stays mounted instead of white-screening. Clears the error when the pathname
// changes — not keyed by pathname, which would remount the page on /shows/1 → /shows/2.
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error }
  }

  componentDidUpdate(prev: Props, prevState: State) {
    // Only clear an error that was already showing before this update — if the page
    // threw on the very render that navigated here, prev.pathname is still the old path.
    if (prevState.hasError && this.state.hasError && prev.pathname !== this.props.pathname) {
      this.setState({ hasError: false, error: null })
    }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Route render failed:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          message="Something went wrong loading this page"
          description={errorMessage(this.state.error)}
          onRetry={() => window.location.reload()}
        />
      )
    }
    return this.props.children
  }
}
