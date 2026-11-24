import type { ReactNode } from 'react'
import { useTvData } from '../hooks/useTvData'
import { TvDataContext } from './useTvDataContext'

export function TvDataProvider({ children }: { children: ReactNode }) {
  // useTvData memoizes its return value, so the context value is stable across provider re-renders.
  // (Pages still re-render on a theme change via App — this doesn't prevent that.)
  return <TvDataContext.Provider value={useTvData()}>{children}</TvDataContext.Provider>
}
