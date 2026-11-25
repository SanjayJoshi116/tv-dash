import { useEffect } from 'react'

// Browser tab title. DOM side effect only — no state.
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title
  }, [title])
}
