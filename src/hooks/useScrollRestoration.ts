import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const MAX_ENTRIES = 50

// Scroll handling for AppLayout's Content (the scroll container — not window, so React Router's
// ScrollRestoration doesn't apply). Positions are kept per history entry (location.key, not
// pathname: the same /shows twice in history keeps two positions), in memory only (not across
// reloads). Back / Forward (POP) to a known entry restores its position; a replace that only
// changed the query (Shows search typing, URL correction) leaves the scroll alone; any other
// navigation starts at the top.
export function useScrollRestoration(scrollRef: RefObject<HTMLElement | null>): void {
  const location = useLocation()
  const navigationType = useNavigationType()
  const positions = useRef(new Map<string, number>())
  const keyRef = useRef(location.key)
  const pathRef = useRef(location.pathname)
  // Pending Back / Forward restore — in a ref, not the effect cleanup, so a same-path REPLACE in the
  // same frame (Shows correcting its URL right after Back) doesn't cancel it
  const restoreRaf = useRef(0)
  useEffect(() => () => cancelAnimationFrame(restoreRaf.current), [])

  // Before paint, so a scroll event fired by the new page's layout is recorded for the new entry
  useLayoutEffect(() => {
    keyRef.current = location.key
  }, [location.key])

  // Record the current entry's position, rAF-throttled. The key is captured at event time, and the
  // write is skipped if the entry changed before the frame (it would store the next page's value).
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      if (raf) return
      const key = keyRef.current
      raf = requestAnimationFrame(() => {
        raf = 0
        if (key !== keyRef.current) return
        const map = positions.current
        map.delete(key) // re-insert: Map order = recency, oldest dropped first
        map.set(key, el.scrollTop)
        if (map.size > MAX_ENTRIES) map.delete(map.keys().next().value as string)
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [scrollRef])

  useEffect(() => {
    const el = scrollRef.current
    const samePath = pathRef.current === location.pathname
    pathRef.current = location.pathname
    if (!el) return
    if (navigationType === 'REPLACE' && samePath) return
    cancelAnimationFrame(restoreRaf.current)
    const saved = navigationType === 'POP' ? positions.current.get(location.key) : undefined
    if (saved == null) {
      el.scrollTo(0, 0)
      return
    }
    // After paint, so the restored page has laid out (poster boxes have fixed aspect ratios)
    restoreRaf.current = requestAnimationFrame(() => el.scrollTo(0, saved))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the history entry; pathname / type change with it
  }, [location.key])
}
