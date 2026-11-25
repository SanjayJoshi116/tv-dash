import { useEffect, useRef } from 'react'
import { lookup } from '../utils/lookup'

export type HotkeyMap = Record<string, (e: KeyboardEvent) => void>

// Second key of a `g x` sequence must follow within this window
export const SEQUENCE_TIMEOUT_MS = 1000

// Text entry / pickers keep every key: input (not checkbox / radio / button-like), textarea,
// select, contenteditable, ARIA combobox / textbox (antd Select's search input)
const NON_TEXT_INPUTS = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file', 'image'])
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  if (target instanceof HTMLInputElement) return !NON_TEXT_INPUTS.has(target.type)
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true
  return target.closest('[contenteditable]:not([contenteditable="false"]), [role="combobox"], [role="textbox"]') != null
}

// Global keyboard shortcuts — the one keydown listener for app-wide keys. Keys are `e.key`
// values (layout-aware: `?` / `/` are whatever the keyboard produces; Shift isn't a modifier
// here) or two-key sequences `'g d'`. A binding that fires gets preventDefault.
// Ignored: typing targets, Ctrl / Meta / Alt, IME composition, auto-repeat.
// The map is read from a ref, so callers can pass an inline object without re-subscribing.
export function useHotkeys(map: HotkeyMap, { enabled = true }: { enabled?: boolean } = {}): void {
  const mapRef = useRef(map)
  useEffect(() => {
    mapRef.current = map
  })

  useEffect(() => {
    if (!enabled) return
    let prefix: { key: string; at: number } | null = null

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing || e.repeat) return
      if (isTypingTarget(e.target)) return
      const bindings = mapRef.current

      if (prefix) {
        const seq = `${prefix.key} ${e.key}`
        const fresh = Date.now() - prefix.at <= SEQUENCE_TIMEOUT_MS
        prefix = null
        const handler = fresh ? lookup(bindings, seq) : undefined
        if (handler) {
          e.preventDefault()
          handler(e)
          return
        }
        // Not a sequence: the key is handled on its own below
      }

      const handler = lookup(bindings, e.key)
      if (handler) {
        e.preventDefault()
        handler(e)
      } else if (Object.keys(bindings).some(k => k.startsWith(`${e.key} `))) {
        prefix = { key: e.key, at: Date.now() }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
