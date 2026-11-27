import type { ReactNode } from 'react'
import type { TvSeries } from '../types/series'
import type { TvDataContextValue } from '../context/useTvDataContext'
import { LoadingState } from './LoadingState'
import { ErrorState } from './ErrorState'

export type DataGateState = Pick<TvDataContextValue, 'data' | 'loading' | 'error' | 'refetch'>

interface Props {
  // The page's useTvDataContext() value — passed in, so this component never reads context itself
  state: DataGateState
  tip?: string
  children: (data: TvSeries[]) => ReactNode
}

// The one loading → error → data prelude for data pages (CLAUDE.md order): loading wins over a
// stale error, and children only ever see loaded data. Empty / not-found states stay in the page.
export function DataGate({ state, tip, children }: Props) {
  if (state.loading) return <LoadingState tip={tip} />
  if (state.error) return <ErrorState message="Failed to load data" description={state.error} onRetry={state.refetch} />
  return <>{children(state.data)}</>
}
