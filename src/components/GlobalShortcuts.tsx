import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useHotkeys, type HotkeyMap } from '../hooks/useHotkeys'
import { useThemeSetting } from '../ThemeContext'
import { THEME_OPTIONS } from '../themes'
import type { ShortcutKey } from '../constants/shortcuts'
import { normalizePath } from '../utils/pageTitle'
import { SHOWS_SEARCH_ID, cancelSearchFocusRequest, requestSearchFocus } from '../utils/searchFocus'
import { ShortcutsHelp } from './ShortcutsHelp'

// App-wide keys (SHORTCUTS) + the `?` cheat sheet. Rendered once by AppLayout; its own component
// so opening the sheet re-renders only this, not the shell. Shortcuts are off while it's open.
export function GlobalShortcuts() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { preference, setPreference } = useThemeSetting()
  const [helpOpen, setHelpOpen] = useState(false)
  const onShows = normalizePath(pathname) === '/shows'

  // A `/` request belongs to the Shows visit it was made for: landing anywhere else drops it.
  // Keyed on the pathname, not onShows — Dashboard → (Shows requested) → Statistics never flips it.
  useEffect(() => {
    if (normalizePath(pathname) !== '/shows') cancelSearchFocusRequest()
  }, [pathname])

  // Record<ShortcutKey, …>: an entry in SHORTCUTS without a handler fails to compile
  const handlers: Record<ShortcutKey, () => void> = {
    'g d': () => navigate('/'),
    'g s': () => navigate('/shows'),
    'g t': () => navigate('/stats'),
    // Field already there: focus it. Otherwise (another page, or Shows still loading its data /
    // code) ShowsPage takes the request once FilterBar is up.
    '/': () => {
      const field = onShows ? document.getElementById(SHOWS_SEARCH_ID) : null
      if (field) return field.focus()
      requestSearchFocus()
      if (!onShows) navigate('/shows')
    },
    // Same setter as the theme selector (saves it), next option in the selector's order
    t: () => setPreference(THEME_OPTIONS[(THEME_OPTIONS.indexOf(preference) + 1) % THEME_OPTIONS.length]),
    '?': () => setHelpOpen(true),
  }
  useHotkeys(handlers as HotkeyMap, { enabled: !helpOpen })

  return <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
}
