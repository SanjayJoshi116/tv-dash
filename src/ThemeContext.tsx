import { createContext, useCallback, useContext, useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ConfigProvider } from 'antd'
import type { CustomThemeSettings, Theme, ThemePreference } from './themes'
import { CUSTOM_THEME, DEFAULT_THEME_NAME, SYSTEM_THEME, THEMES, isThemePreference, parseCustomTheme, parseThemePreference, readThemeOverride, resolveThemeName } from './themes'
import { buildCustomTheme } from './customTheme'
import { antdThemeConfig } from './antdTheme'
import { getSettings, saveSetting, subscribeSettings } from './utils/settings'
import { useMediaQuery } from './hooks/useMediaQuery'
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion'

// Two contexts: the resolved Theme (colors — what nearly every caller wants) and the
// preference setting (ThemeToggle, GlobalShortcuts). useTheme() keeps its non-null default.
const ThemeCtx = createContext<Theme>(THEMES[DEFAULT_THEME_NAME])

// `custom`: the Custom theme's accent + base (kept while another theme is selected). setCustom
// applies it and saves it (debounced), whatever the input — picker drag, hex input, preset, base.
type ThemeSetting = {
  preference: ThemePreference
  setPreference: (pref: ThemePreference) => void
  custom: CustomThemeSettings
  setCustom: (custom: CustomThemeSettings) => void
}

const CUSTOM_SAVE_DELAY_MS = 300
const ThemeSettingCtx = createContext<ThemeSetting | null>(null)

export const useTheme = () => useContext(ThemeCtx)

export function useThemeSetting(): ThemeSetting {
  const ctx = useContext(ThemeSettingCtx)
  if (!ctx) throw new Error('useThemeSetting must be used inside <AppThemeProvider>')
  return ctx
}

// Saved theme preference ('System' or a theme name); missing / invalid → 'System'
const loadThemePreference = () => parseThemePreference(getSettings().themeName)
// Saved Custom accent + base; field-by-field fallback (parseCustomTheme)
const loadCustomTheme = () => parseCustomTheme(getSettings().customTheme)

// Owns the theme: preference state + persistence, System → OS color scheme resolution,
// document color-scheme / background sync, and antd's ConfigProvider theme.
export function AppThemeProvider({ children }: { children: ReactNode }) {
  // `?theme=<option>` (read once, at mount) wins over the saved preference for this visit and is
  // never saved: only setPreference saves, and nothing saves on mount. fromUrl stays set until
  // the user picks a theme (selector / `t`), so in-app navigation keeps the override and other
  // tabs' theme changes don't replace it.
  const [urlOverride] = useState(() => readThemeOverride(window.location.search))
  const [preference, setPreferenceState] = useState(() => urlOverride ?? loadThemePreference())
  const fromUrl = useRef(urlOverride !== null)
  const [custom, setCustomState] = useState(loadCustomTheme)
  // A picker drag sets `custom` every frame; rebuilding the Theme (antd tokens, every useTheme()
  // consumer, the charts) from the deferred value lets React skip intermediate frames. The
  // setting context (picker swatch) still gets every value.
  const deferredCustom = useDeferredValue(custom)
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const reducedMotion = usePrefersReducedMotion()

  const isCustom = preference === CUSTOM_THEME
  const theme = useMemo(
    () => (isCustom ? buildCustomTheme(deferredCustom.accent, deferredCustom.base) : THEMES[resolveThemeName(preference, prefersDark)]),
    [isCustom, deferredCustom, preference, prefersDark],
  )

  // Native controls (Content's scrollbar, autofill) + overscroll match the theme. The boot
  // script (vite.config.ts) sets the same three values before the bundle loads.
  useEffect(() => {
    const root = document.documentElement.style
    root.colorScheme = theme.isDark ? 'dark' : 'light'
    root.backgroundColor = theme.contentBg
    // Browser / installed-app chrome — the meta is emitted by the boot plugin (vite.config.ts)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.headerBg)
  }, [theme])

  // Debounced like ShowsPage's filters: the latest value in a ref, flushed on unmount (a plain
  // clearTimeout would drop the last change). Synced values from other tabs use setCustomState —
  // never re-saved.
  const customSaveTimer = useRef<ReturnType<typeof setTimeout>>()
  const pendingCustom = useRef<CustomThemeSettings | null>(null)
  const setCustom = useCallback((next: CustomThemeSettings) => {
    setCustomState(next)
    pendingCustom.current = next
    clearTimeout(customSaveTimer.current)
    customSaveTimer.current = setTimeout(() => {
      pendingCustom.current = null
      saveSetting('customTheme', next)
    }, CUSTOM_SAVE_DELAY_MS)
  }, [])
  useEffect(() => () => {
    clearTimeout(customSaveTimer.current)
    if (pendingCustom.current) saveSetting('customTheme', pendingCustom.current)
  }, [])

  // Theme changed in another tab: apply it (not re-saved — storage already holds it). No saved
  // theme (a reset) → System; an invalid value is ignored, keeping the current theme. Unlike
  // loadThemePreference, invalid ≠ missing here. setState runs in the storage callback, not
  // in the effect body, and React skips the re-render when the value is unchanged.
  // The Custom accent / base follow too (missing → defaults; parseCustomTheme never fails).
  useEffect(() => subscribeSettings(settings => {
    const raw = settings.themeName
    if (!fromUrl.current) { // a URL override stays until the user picks a theme here
      if (raw === undefined) setPreferenceState(SYSTEM_THEME)
      else if (isThemePreference(raw)) setPreferenceState(raw)
    }
    // Not while this tab's own accent change is still waiting to be saved: the event (e.g. another
    // tab saving its filters) carries the old accent, and our pending save is about to win anyway
    if (pendingCustom.current) return
    setCustomState(prev => {
      const next = parseCustomTheme(settings.customTheme)
      return next.accent === prev.accent && next.base === prev.base ? prev : next
    })
  }), [])

  const setPreference = useCallback((pref: ThemePreference) => {
    fromUrl.current = false // a chosen theme ends the URL override
    setPreferenceState(pref)
    saveSetting('themeName', pref)
  }, [])

  const setting = useMemo(
    () => ({ preference, setPreference, custom, setCustom }),
    [preference, setPreference, custom, setCustom],
  )

  // Algorithm, readable primary-button text, motion (see antdTheme.ts)
  const configTheme = useMemo(() => antdThemeConfig(theme, reducedMotion), [theme, reducedMotion])

  return (
    <ThemeSettingCtx.Provider value={setting}>
      <ThemeCtx.Provider value={theme}>
        <ConfigProvider theme={configTheme}>{children}</ConfigProvider>
      </ThemeCtx.Provider>
    </ThemeSettingCtx.Provider>
  )
}
