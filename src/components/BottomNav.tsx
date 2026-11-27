import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Typography, theme as antTheme } from 'antd'
import { useTheme } from '../ThemeContext'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { prefetchPage } from '../routes/pageLoaders'
import type { PageKey } from '../routes/pages'

const { Text } = Typography

export const BOTTOM_NAV_HEIGHT = 60

// A primary nav route (AppLayout's NAV_ITEMS): `page` = the code prefetched on intent
export type NavItem = { key: string; label: string; icon: ReactNode; page: PageKey }

interface Props {
  items: NavItem[]
  selectedKey: string
  pathname: string
  // The scroll container (AppLayout's Content — not window)
  scrollRef: RefObject<HTMLElement | null>
  onNavigate: (key: string) => void
}

// Mobile (below lg) fixed bottom nav. Hides on scroll-down, reappears on scroll-up / near the top.
// Owns its visibility state so a scroll-direction flip re-renders only this bar, not the whole
// shell. AppLayout mounts it only while `broken`, so entering mobile always starts visible.
export function BottomNav({ items, selectedKey, pathname, scrollRef, onNavigate }: Props) {
  const theme = useTheme()
  const reducedMotion = usePrefersReducedMotion()
  const { token } = antTheme.useToken()
  const [visible, setVisible] = useState(true)
  const lastScrollY = useRef(0)
  // Mirrors `visible` so the scroll handler only calls setState on an actual change
  const visibleRef = useRef(true)

  // Always show the bar on the page it lands on after navigating. Tried the "adjust state
  // during render" alternative (compare against a `lastPathname` state value, setState in the
  // render body) to satisfy react-hooks/set-state-in-effect — it's React's own documented
  // pattern for this case, but it misbehaves under React.StrictMode here (confirmed via a debug
  // trace: it oscillates and settles on the wrong value). A plain effect is what's correct.
  useEffect(() => {
    visibleRef.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true)
    lastScrollY.current = scrollRef.current?.scrollTop ?? 0
  }, [pathname, scrollRef])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    lastScrollY.current = el.scrollTop
    // Entering mobile reflows the grid (Sider collapse + column change), and browser scroll
    // anchoring fires scroll events with large positive deltas. Ignore those briefly so they
    // aren't mistaken for a user scroll-down that hides the bar. Anchoring only moves an
    // already-scrolled container, so a fresh load at scrollTop 0 reacts immediately.
    const ignoreUntil = el.scrollTop > 0 ? performance.now() + 800 : 0
    const handleScroll = () => {
      const y = el.scrollTop
      if (performance.now() < ignoreUntil) { lastScrollY.current = y; return }
      const delta = y - lastScrollY.current
      const next = y < 24 || delta < -8 ? true : delta > 8 ? false : visibleRef.current
      if (next !== visibleRef.current) {
        visibleRef.current = next
        setVisible(next)
      }
      lastScrollY.current = y
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [scrollRef])

  return (
    <nav style={{
      position: 'fixed',
      insetBlockEnd: 0,
      insetInlineStart: 0,
      insetInlineEnd: 0,
      height: BOTTOM_NAV_HEIGHT,
      paddingBottom: 'env(safe-area-inset-bottom)',
      display: 'flex',
      background: theme.headerBg,
      borderTop: `1px solid ${theme.borderColor}`,
      zIndex: 1000,
      transform: visible ? 'translateY(0)' : 'translateY(100%)',
      // Reduced motion: still hides/shows, just without the slide
      transition: reducedMotion ? 'none' : 'transform 0.25s ease',
    }}>
      {items.map(item => {
        const active = item.key === selectedKey
        return (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            // Touch has no hover: pointerdown fires before click, so the chunk starts loading first
            onPointerDown={() => prefetchPage(item.page)}
            onFocus={() => prefetchPage(item.page)}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              border: 'none',
              background: 'transparent',
              color: active ? token.colorPrimary : token.colorTextSecondary,
              fontSize: 20,
              cursor: 'pointer',
            }}
          >
            {item.icon}
            <Text style={{ fontSize: 11, color: 'inherit' }}>{item.label}</Text>
          </button>
        )
      })}
    </nav>
  )
}
