// The Shows search field's id (FilterBar renders it) and the `/` shortcut's one-shot "focus it
// once Shows is up" request. A module flag, not router state: nothing to clear from history, so a
// reload / Back can't re-trigger it. GlobalShortcuts requests it (before navigating to Shows, or
// on Shows while it's still loading) and cancels it when the app ends up on another page — so a
// navigation that was replaced or failed can't focus the field on some later visit; ShowsPage
// takes it once its data (and so FilterBar) has loaded.
export const SHOWS_SEARCH_ID = 'shows-search'

let requested = false

export function requestSearchFocus(): void {
  requested = true
}

export function cancelSearchFocusRequest(): void {
  requested = false
}

// Returns whether focus was requested, and clears the request
export function takeSearchFocusRequest(): boolean {
  const was = requested
  requested = false
  return was
}
