import { format } from 'date-fns'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getWeekRange, normalizeStatus } from './appointmentService'

// ─── normalizeStatus ──────────────────────────────────────────────────────────

describe('normalizeStatus', () => {
  it('converts scheduled (legacy Android) to waiting', () => {
    expect(normalizeStatus('scheduled')).toBe('waiting')
  })

  it('passes through valid statuses unchanged', () => {
    expect(normalizeStatus('waiting')).toBe('waiting')
    expect(normalizeStatus('in_progress')).toBe('in_progress')
    expect(normalizeStatus('done')).toBe('done')
    expect(normalizeStatus('cancelled')).toBe('cancelled')
  })

  it('defaults falsy values to waiting', () => {
    expect(normalizeStatus('')).toBe('waiting')
    expect(normalizeStatus(null)).toBe('waiting')
    expect(normalizeStatus(undefined)).toBe('waiting')
  })
})

// ─── getWeekRange ─────────────────────────────────────────────────────────────

describe('getWeekRange', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns Saturday–Friday window when today is Thursday', () => {
    // 2025-04-10 = Thursday → week should start 2025-04-05 (Sat) and end 2025-04-11 (Fri)
    vi.setSystemTime(new Date(2025, 3, 10, 12, 0, 0))
    const { weekStart, weekEnd } = getWeekRange()
    expect(format(weekStart, 'yyyy-MM-dd')).toBe('2025-04-05')
    expect(format(weekEnd, 'yyyy-MM-dd')).toBe('2025-04-11')
  })

  it('returns correct window when today is Saturday (week start)', () => {
    // 2025-04-05 = Saturday → should be start of its own week
    vi.setSystemTime(new Date(2025, 3, 5, 12, 0, 0))
    const { weekStart, weekEnd } = getWeekRange()
    expect(format(weekStart, 'yyyy-MM-dd')).toBe('2025-04-05')
    expect(format(weekEnd, 'yyyy-MM-dd')).toBe('2025-04-11')
  })

  it('returns correct window when today is Friday (week end)', () => {
    // 2025-04-11 = Friday → should be last day of same week
    vi.setSystemTime(new Date(2025, 3, 11, 12, 0, 0))
    const { weekStart, weekEnd } = getWeekRange()
    expect(format(weekStart, 'yyyy-MM-dd')).toBe('2025-04-05')
    expect(format(weekEnd, 'yyyy-MM-dd')).toBe('2025-04-11')
  })

  it('weekStart time is midnight (00:00:00)', () => {
    vi.setSystemTime(new Date(2025, 3, 10, 15, 30, 0))
    const { weekStart } = getWeekRange()
    expect(weekStart.getHours()).toBe(0)
    expect(weekStart.getMinutes()).toBe(0)
    expect(weekStart.getSeconds()).toBe(0)
  })

  it('weekEnd is exactly 6 days after weekStart', () => {
    vi.setSystemTime(new Date(2025, 3, 10, 12, 0, 0))
    const { weekStart, weekEnd } = getWeekRange()
    const diff = (weekEnd - weekStart) / (1000 * 60 * 60 * 24)
    expect(diff).toBe(6)
  })
})