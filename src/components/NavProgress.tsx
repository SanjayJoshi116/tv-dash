import { useEffect, useState } from 'react'
import { useNavigation, type Location } from 'react-router-dom'
import { useTheme } from '../ThemeContext'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

// Fast navigations (page code already loaded) finish before this — no flash
const NAV_PROGRESS_DELAY_MS = 150

// Thin bar at the top of the content area while the router loads the next page's code (the
// current page stays on screen). Its own component, so the delay / growth state changes re-render
// only the bar (the data router itself still re-renders the shell once when navigation starts).
//
// Shown / grown are keyed by the pending navigation's Location (a new object per navigation)
// instead of booleans reset in an effect: `visible` is derived, so nothing needs a synchronous
// setState in an effect and StrictMode's double effects just restart the timer.
export function NavProgress() {
  const navigation = useNavigation()
  const theme = useTheme()
  const reducedMotion = usePrefersReducedMotion()
  const pending = navigation.state !== 'idle' ? navigation.location : undefined
  const [shownFor, setShownFor] = useState<Location | undefined>()
  const [grownFor, setGrownFor] = useState<Location | undefined>()

  useEffect(() => {
    if (!pending) return
    let frame = 0
    const timer = setTimeout(() => {
      setShownFor(pending)
      // Two frames: the bar paints at its start width before the transition target is set
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => setGrownFor(pending))
      })
    }, NAV_PROGRESS_DELAY_MS)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
  }, [pending])

  if (!pending || shownFor !== pending) return null
  // Reduced motion: a static full-width bar (still shown, no growth)
  const width = reducedMotion ? '100%' : grownFor === pending ? '85%' : '15%'

  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: 3,
        width,
        background: theme.token.colorPrimary,
        transition: reducedMotion ? 'none' : 'width 4s cubic-bezier(0.1, 0.6, 0.2, 1)',
        pointerEvents: 'none',
      }}
    />
  )
}
