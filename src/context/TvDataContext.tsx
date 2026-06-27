import { createContext, useContext, type ReactNode } from 'react'
import { useTvData } from '../hooks/useTvData'
import type { TvSeries } from '../types/series'

interface TvDataContextValue {
  data: TvSeries[]
  loading: boolean
  error: string | null
  refetch: () => void
}

const TvDataContext = createContext<TvDataContextValue>({
  data: [],
  loading: true,
  error: null,
  refetch: () => {},
})

export function TvDataProvider({ children }: { children: ReactNode }) {
  const value = useTvData()
  return <TvDataContext.Provider value={value}>{children}</TvDataContext.Provider>
}

export const useTvDataContext = () => useContext(TvDataContext)
