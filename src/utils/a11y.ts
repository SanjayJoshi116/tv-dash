import type { KeyboardEvent } from 'react'

// Enter/Space activation for clickable non-button elements (role="button")
export const activateOnKey = (fn: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn() }
}
