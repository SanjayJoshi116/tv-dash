// If a newer service worker is installed but waiting (registerType 'prompt' keeps it waiting until
// the user accepts), tell it to take over and wait until it controls the page. Used by the crash
// screen's Reload: the shell — and UpdatePrompt with it — may be what crashed, so a fixed build
// would otherwise never activate (a plain reload keeps the waiting worker waiting).
// Never throws; resolves after `timeoutMs` at the latest. No service worker (dev, tests) → no-op.
export async function activateWaitingServiceWorker(timeoutMs = 3000): Promise<void> {
  const sw = typeof navigator === 'undefined' ? undefined : navigator.serviceWorker
  if (!sw) return
  try {
    const waiting = (await sw.getRegistration())?.waiting
    if (!waiting) return
    await new Promise<void>(resolve => {
      const timer = setTimeout(resolve, timeoutMs)
      sw.addEventListener('controllerchange', () => { clearTimeout(timer); resolve() }, { once: true })
      // Workbox's generated worker calls skipWaiting() on this message
      waiting.postMessage({ type: 'SKIP_WAITING' })
    })
  } catch {
    // Registration lookup / messaging failed — reload anyway
  }
}
