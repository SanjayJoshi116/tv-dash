import { useMediaQuery } from './useMediaQuery'

// OS "reduce motion" preference, live. Every animation site reads this (charts, AnimatedPie
// legend, antd motion via AppThemeProvider's configTheme, BottomNav slide) — new animations must too.
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
