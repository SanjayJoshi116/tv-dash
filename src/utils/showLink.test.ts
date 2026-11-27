import { describe, it, expect, vi } from 'vitest'
import type { KeyboardEvent } from 'react'
import { showLinkProps } from './showLink'
import { prefetchShowDetail } from '../routes/pageLoaders'

const key = (k: string) => ({ key: k, preventDefault: vi.fn() }) as unknown as KeyboardEvent

describe('showLinkProps', () => {
  it('navigates to the show on click, Enter and Space', () => {
    const navigate = vi.fn()
    const props = showLinkProps(42, navigate)
    props.onClick()
    props.onKeyDown(key('Enter'))
    props.onKeyDown(key(' '))
    expect(navigate).toHaveBeenCalledTimes(3)
    expect(navigate).toHaveBeenCalledWith('/shows/42')
  })

  it('ignores other keys', () => {
    const navigate = vi.fn()
    showLinkProps(1, navigate).onKeyDown(key('a'))
    expect(navigate).not.toHaveBeenCalled()
  })

  it('uses prefetchShowDetail itself (stable identity) and button semantics', () => {
    const props = showLinkProps(1, vi.fn())
    expect(props.onMouseEnter).toBe(prefetchShowDetail)
    expect(props.onFocus).toBe(prefetchShowDetail)
    expect(props.role).toBe('button')
    expect(props.tabIndex).toBe(0)
  })
})
