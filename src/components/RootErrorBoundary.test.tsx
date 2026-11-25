// @vitest-environment jsdom
import { it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { RootErrorBoundary } from './RootErrorBoundary'
import { SETTINGS_KEY, SIDEBAR_KEY } from '../utils/settings'

function Boom(): never {
  throw new Error('boom: shell broke')
}

// React logs caught render errors and jsdom reports them as window 'error' events —
// both expected here; keep the test output clean
const swallow = (e: ErrorEvent) => e.preventDefault()
beforeEach(() => {
  localStorage.clear()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  window.addEventListener('error', swallow)
})
afterEach(() => {
  cleanup()
  window.removeEventListener('error', swallow)
  vi.restoreAllMocks()
})

it('renders children when nothing throws', () => {
  render(<RootErrorBoundary><p>fine</p></RootErrorBoundary>)
  expect(screen.getByText('fine')).toBeTruthy()
})

it('a throwing child shows the recovery screen with the message', () => {
  render(<RootErrorBoundary><Boom /></RootErrorBoundary>)
  expect(screen.getByRole('alert').textContent).toContain('boom: shell broke')
  expect(screen.getByRole('button', { name: 'Reload' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Reset saved settings' })).toBeTruthy()
})

it.each([
  ['undefined', undefined],
  ['null', null],
  ['a null-prototype object', Object.create(null)],
])('throwing %s still shows the recovery screen', (_, thrown) => {
  function Throws(): never {
    throw thrown
  }
  render(<RootErrorBoundary><Throws /></RootErrorBoundary>)
  expect(screen.getByRole('alert').textContent).toContain('Unknown error')
})

it('Reload reloads without touching saved settings', () => {
  localStorage.setItem(SETTINGS_KEY, '{"themeName":"Dracula"}')
  const reload = vi.fn()
  render(<RootErrorBoundary reload={reload}><Boom /></RootErrorBoundary>)
  fireEvent.click(screen.getByRole('button', { name: 'Reload' }))
  expect(reload).toHaveBeenCalledOnce()
  expect(localStorage.getItem(SETTINGS_KEY)).not.toBeNull()
})

it('Reset saved settings clears storage, then reloads', () => {
  localStorage.setItem(SETTINGS_KEY, '{"themeName":"Dracula"}')
  localStorage.setItem(SIDEBAR_KEY, 'true')
  const reload = vi.fn(() => {
    // cleared before the reload
    expect(localStorage.getItem(SETTINGS_KEY)).toBeNull()
    expect(localStorage.getItem(SIDEBAR_KEY)).toBeNull()
  })
  render(<RootErrorBoundary reload={reload}><Boom /></RootErrorBoundary>)
  fireEvent.click(screen.getByRole('button', { name: 'Reset saved settings' }))
  expect(reload).toHaveBeenCalledOnce()
})
