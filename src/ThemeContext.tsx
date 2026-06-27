import { createContext, useContext, type ReactNode } from 'react'
import type { Theme } from './themes'
import { DEFAULT_THEME_NAME, THEMES } from './themes'

const ThemeCtx = createContext<Theme>(THEMES[DEFAULT_THEME_NAME])

export const useTheme = () => useContext(ThemeCtx)

export function ThemeProvider({ theme, children }: { theme: Theme; children: ReactNode }) {
  return <ThemeCtx.Provider value={theme}>{children}</ThemeCtx.Provider>
}
