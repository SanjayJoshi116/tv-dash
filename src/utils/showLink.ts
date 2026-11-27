import { prefetchShowDetail } from '../routes/pageLoaders'
import { activateOnKey } from './a11y'

// The shared props of every clickable show element (ShowCard, Dashboard's ShowRowCard and Not
// Started rows): click / Enter / Space → Show Detail, Show Detail code prefetched on hover / focus.
// A plain function (not a hook) so it can be called inside .map(). The prefetch handlers are the
// module-level prefetchShowDetail itself (stable identity — memo'd cards get no new props).
// aria-label stays at the call site.
export function showLinkProps(tvId: number, navigate: (to: string) => void) {
  const onClick = () => navigate(`/shows/${tvId}`)
  return {
    onClick,
    onKeyDown: activateOnKey(onClick),
    onMouseEnter: prefetchShowDetail,
    onFocus: prefetchShowDetail,
    role: 'button',
    tabIndex: 0,
  } as const
}
