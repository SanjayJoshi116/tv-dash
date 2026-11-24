import { createContext, useContext } from 'react'
import type { useTvData } from '../hooks/useTvData'

// Context object + consumer hook live in a component-free module so Fast Refresh never
// recreates the context when TvDataContext.tsx (the provider) is edited — a recreated
// context would leave already-loaded pages reading the old one (null → throw).

// Derived from the hook so a new/changed field can't silently drift from the context type
export type TvDataContextValue = ReturnType<typeof useTvData>

// null default: a consumer outside TvDataProvider is a wiring bug — fail loudly instead of
// rendering a fake `loading: true` state forever with a no-op refetch
export const TvDataContext = createContext<TvDataContextValue | null>(null)

export function useTvDataContext(): TvDataContextValue {
  const ctx = useContext(TvDataContext)
  if (!ctx) throw new Error('useTvDataContext must be used within TvDataProvider')
  return ctx
}
