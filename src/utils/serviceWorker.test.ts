import { describe, it, expect, vi, afterEach } from 'vitest'
import { activateWaitingServiceWorker } from './serviceWorker'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

function stubServiceWorker(waiting: { postMessage: (m: unknown) => void } | null, opts: { fireControllerChange?: boolean } = {}) {
  const listeners: (() => void)[] = []
  const sw = {
    getRegistration: vi.fn(async () => ({ waiting })),
    addEventListener: vi.fn((_type: string, cb: () => void) => { listeners.push(cb) }),
  }
  if (waiting && opts.fireControllerChange) {
    const post = waiting.postMessage
    waiting.postMessage = m => { post(m); listeners.forEach(cb => cb()) }
  }
  vi.stubGlobal('navigator', { serviceWorker: sw })
  return sw
}

describe('activateWaitingServiceWorker', () => {
  it('no service worker support → resolves without doing anything', async () => {
    vi.stubGlobal('navigator', {})
    await expect(activateWaitingServiceWorker()).resolves.toBeUndefined()
  })

  it('no waiting worker → no message', async () => {
    const sw = stubServiceWorker(null)
    await activateWaitingServiceWorker()
    expect(sw.addEventListener).not.toHaveBeenCalled()
  })

  it('posts SKIP_WAITING and resolves once the new worker controls the page', async () => {
    const post = vi.fn()
    stubServiceWorker({ postMessage: post }, { fireControllerChange: true })
    await activateWaitingServiceWorker()
    expect(post).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
  })

  it('resolves after the timeout if control never changes', async () => {
    vi.useFakeTimers()
    stubServiceWorker({ postMessage: vi.fn() })
    const done = vi.fn()
    const p = activateWaitingServiceWorker(3000).then(done)
    await vi.advanceTimersByTimeAsync(2999)
    expect(done).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    await p
    expect(done).toHaveBeenCalled()
  })

  it('never throws when the registration lookup fails', async () => {
    vi.stubGlobal('navigator', { serviceWorker: { getRegistration: () => Promise.reject(new Error('denied')) } })
    await expect(activateWaitingServiceWorker()).resolves.toBeUndefined()
  })
})
