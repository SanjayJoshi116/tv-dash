import { useState, type CSSProperties, type ReactNode } from 'react'
import { Link, type To } from 'react-router-dom'
import { prefetchPage } from '../routes/pageLoaders'

// Module-level (stable identity): hovering / focusing any cross-navigation link warms Shows' code
const prefetchShows = (): void => prefetchPage('shows')

interface Props {
  // Always from showsLink() — never a hand-built target (see its safety comment)
  to: To
  // Where it leads, e.g. "Shows in genre Crime"
  ariaLabel: string
  children: ReactNode
  // Block: a whole row is the hit area (Dashboard bars); inline otherwise (tags)
  block?: boolean
}

// A real <a> (keyboard, Enter, middle / Ctrl-click, copy link) styled as its content: no underline
// or link color until hover. Focus uses the browser's default outline — inline styles can't target
// :focus-visible, so outline is deliberately never set here.
export function FilterLink({ to, ariaLabel, children, block = false }: Props) {
  const [hover, setHover] = useState(false)
  const style: CSSProperties = {
    color: 'inherit',
    textDecoration: hover ? 'underline' : 'none',
    display: block ? 'block' : 'inline-block',
    cursor: 'pointer',
  }
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      style={style}
      onMouseEnter={() => { setHover(true); prefetchShows() }}
      onMouseLeave={() => setHover(false)}
      onFocus={prefetchShows}
    >
      {children}
    </Link>
  )
}
