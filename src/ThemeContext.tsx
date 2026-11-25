import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ConfigProvider, theme as antTheme } from 'antd'
import type { Theme, ThemePreference } from './themes'
import { DEFAULT_THEME_NAME, SYSTEM_THEME, THEMES, isThemePreference, parseThemePreference, resolveThemeName } from './themes'
import { getSettings, saveSetting, subscribeSettings } from './utils/settings'
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

  // Native controls (Content's scrollbar, autofill) + overscroll match the theme. The boot
  // script (vite.config.ts) sets the same three values before the bundle loads.
  useEffect(() => {
    const root = document.documentElement.style
    root.colorScheme = theme.isDark ? 'dark' : 'light'
    root.backgroundColor = theme.contentBg
    // Browser / installed-app chrome — the meta is emitted by the boot plugin (vite.config.ts)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.headerBg)
  }, [theme])

  // Theme changed in another tab: apply it (not re-saved — storage already holds it). No saved
  // theme (a reset) → System; an invalid value is ignored, keeping the current theme. Unlike
  // loadThemePreference, invalid ≠ missing here. setState runs in the storage callback, not
  // in the effect body, and React skips the re-render when the value is unchanged.
  useEffect(() => subscribeSettings(settings => {
    const raw = settings.themeName
    if (raw === undefined) setPreferenceState(SYSTEM_THEME)
    else if (isThemePreference(raw)) setPreferenceState(raw)
  }), [])

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
