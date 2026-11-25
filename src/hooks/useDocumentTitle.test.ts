// @vitest-environment jsdom
import { it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDocumentTitle } from './useDocumentTitle'

it('sets document.title and updates it when the title changes', () => {
  const { rerender } = renderHook(({ t }) => useDocumentTitle(t), { initialProps: { t: 'Shows · TV Dashboard' } })
  expect(document.title).toBe('Shows · TV Dashboard')
  rerender({ t: 'Andor · TV Dashboard' })
  expect(document.title).toBe('Andor · TV Dashboard')
})
