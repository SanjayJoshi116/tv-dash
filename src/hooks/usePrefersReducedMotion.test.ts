// @vitest-environment jsdom
import { it, expect, vi, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { stubMatchMedia } from './matchMedia.fixture'

afterEach(() => vi.unstubAllGlobals())

it('reads (prefers-reduced-motion: reduce) and follows changes live', () => {
  const { matchMedia, set } = stubMatchMedia(true)

  const { result } = renderHook(() => usePrefersReducedMotion())
  expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  expect(result.current).toBe(true)

  act(() => set(false))
  expect(result.current).toBe(false)
})
