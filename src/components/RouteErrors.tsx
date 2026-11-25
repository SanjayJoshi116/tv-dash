import { Component, type ReactNode } from 'react'
import { Outlet, useRouteError } from 'react-router-dom'
import { ErrorState } from './ErrorState'
import { errorMessage } from '../utils/errorMessage'

// Pages route errorElement: a page that failed to render or whose code failed to load (e.g. a
// stale hashed chunk after a deploy). Rendered inside AppLayout's <Outlet />, so the shell stays
// usable; the data router clears it on the next navigation (new location).
export function PageError() {
  const error = useRouteError()
  return (
    <ErrorState
      message="Something went wrong loading this page"
      description={errorMessage(error)}
      onRetry={() => window.location.reload()}
    />
  )
}

// React Router's boundary only shows the errorElement for `error !== undefined` — a page doing
// `throw undefined` would loop past it up to the recovery screen. This guard rethrows it as an
// Error so the route boundary above catches it. No reset logic: while the errorElement shows, the
// guard is unmounted, and the next navigation mounts a fresh one.
class UndefinedThrowGuard extends Component<{ children: ReactNode }, { caught: boolean; error: unknown }> {
  state = { caught: false, error: undefined as unknown }

  static getDerivedStateFromError(error: unknown) {
    return { caught: true, error }
  }

  render() {
    if (this.state.caught) throw this.state.error === undefined ? new Error(errorMessage(undefined)) : this.state.error
    return this.props.children
  }
}

// Element of the pathless route that holds every page (App.tsx)
export function PagesOutlet() {
  return (
    <UndefinedThrowGuard>
      <Outlet />
    </UndefinedThrowGuard>
  )
}

// Layout-route errorElement: the shell itself (AppLayout) failed. Rethrow so RootErrorBoundary —
// outside the router, plain elements, reload / reset — shows its recovery screen instead of
// React Router's default error page.
export function RootRouteError(): never {
  throw useRouteError()
}
