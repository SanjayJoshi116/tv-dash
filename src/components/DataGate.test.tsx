// @vitest-environment jsdom
import { it, expect, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { DataGate, type DataGateState } from './DataGate'
import type { TvSeries } from '../types/series'

afterEach(cleanup)

const show = { tvId: 1, name: 'Alpha' } as TvSeries
const state = (over: Partial<DataGateState>): DataGateState => ({ data: [], loading: false, error: null, refetch: () => {}, ...over })
const names = (data: TvSeries[]) => <p>{data.map(s => s.name).join(',') || 'empty'}</p>

it('loading → spinner with the tip, children not called', () => {
  const children = vi.fn(names)
  render(<DataGate state={state({ loading: true })} tip="Loading series...">{children}</DataGate>)
  expect(screen.getByText('Loading series...')).toBeTruthy()
  expect(children).not.toHaveBeenCalled()
})

it('error → message + description, Retry calls refetch', () => {
  const refetch = vi.fn()
  const children = vi.fn(names)
  render(<DataGate state={state({ error: 'HTTP 500', refetch })}>{children}</DataGate>)
  expect(screen.getByText('Failed to load data')).toBeTruthy()
  expect(screen.getByText('HTTP 500')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(refetch).toHaveBeenCalledOnce()
  expect(children).not.toHaveBeenCalled()
})

it('loaded → children get the data', () => {
  render(<DataGate state={state({ data: [show] })}>{names}</DataGate>)
  expect(screen.getByText('Alpha')).toBeTruthy()
})

it('loaded empty data still renders children (pages own their empty state)', () => {
  render(<DataGate state={state({})}>{names}</DataGate>)
  expect(screen.getByText('empty')).toBeTruthy()
})

it('loading wins over an error', () => {
  render(<DataGate state={state({ loading: true, error: 'stale' })}>{names}</DataGate>)
  expect(screen.queryByText('Failed to load data')).toBeNull()
  expect(screen.getByText('Loading...')).toBeTruthy()
})
