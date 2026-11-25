import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ConfigProvider, theme as antTheme } from 'antd'
import type { Theme, ThemePreference } from './themes'
import { DEFAULT_THEME_NAME, THEMES, parseThemePreference, resolveThemeName } from './themes'
import { getSettings, saveSetting } from './utils/settings'
import { useMediaQuery } from './hooks/useMediaQuery'
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion'

// Two contexts: the resolved Theme (colors — what nearly every caller wants) and the
// preference setting (only ThemeToggle). useTheme() keeps its non-null default.
const ThemeCtx = createContext<Theme>(THEMES[DEFAULT_THEME_NAME])

type ThemeSetting = { preference: ThemePreference; setPreference: (pref: ThemePreference) => void }
const ThemeSettingCtx = createContext<ThemeSetting | null>(null)

export const useTheme = () => useContext(ThemeCtx)

export function useThemeSetting(): ThemeSetting {
  const ctx = useContext(ThemeSettingCtx)
  if (!ctx) throw new Error('useThemeSetting must be used inside <AppThemeProvider>')
  return ctx
}

// Saved theme preference ('System' or a theme name); missing / invalid → 'System'
const loadThemePreference = () => parseThemePreference(getSettings().themeName)

// Owns the theme: preference state + persistence, System → OS color scheme resolution,
// document color-scheme / background sync, and antd's ConfigProvider theme.
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState(loadThemePreference)
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const reducedMotion = usePrefersReducedMotion()

  const theme = THEMES[resolveThemeName(preference, prefersDark)]

  // Native controls (Content's scrollbar, autofill) + overscroll match the theme. The
  // index.html boot script sets the same two properties before the bundle loads.
  useEffect(() => {
    const root = document.documentElement.style
    root.colorScheme = theme.isDark ? 'dark' : 'light'
    root.backgroundColor = theme.contentBg
  }, [theme])

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref)
    saveSetting('themeName', pref)
  }, [])

  const setting = useMemo(() => ({ preference, setPreference }), [preference, setPreference])

  // `motion: false` turns off antd's own animations (Tabs ink bar, Select dropdown, Spin…)
  const configTheme = useMemo(() => ({
    algorithm: theme.isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
    token: { ...theme.token, motion: !reducedMotion },
  }), [theme, reducedMotion])

  return (
    <ThemeSettingCtx.Provider value={setting}>
      <ThemeCtx.Provider value={theme}>
        <ConfigProvider theme={configTheme}>{children}</ConfigProvider>
      </ThemeCtx.Provider>
    </ThemeSettingCtx.Provider>
  )
}
