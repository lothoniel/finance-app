import { describe, it, expect } from 'vitest'
import { filterByPeriod, getMonthsInRange, groupByMonth } from '../../lib/filters'

const items = [
  { date: '2025-11-05', value: 'nov1' },
  { date: '2025-11-20', value: 'nov2' },
  { date: '2025-12-10', value: 'dec1' },
  { date: '2026-01-15', value: 'jan1' },
  { date: '2026-02-28', value: 'feb1' },
  { date: '2026-03-01', value: 'mar1' },
]

describe('filterByPeriod - month mode', () => {
  it('returns only items in the specified month', () => {
    const result = filterByPeriod(items, 'month', { year: 2025, month: 11 })
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.value)).toEqual(['nov1', 'nov2'])
  })

  it('returns empty when no items match', () => {
    const result = filterByPeriod(items, 'month', { year: 2024, month: 1 })
    expect(result).toHaveLength(0)
  })
})

describe('filterByPeriod - quarter mode', () => {
  it('returns Q4 (Oct-Dec) items for 2025', () => {
    const result = filterByPeriod(items, 'quarter', { year: 2025, quarter: 4 })
    expect(result).toHaveLength(3) // nov1, nov2, dec1
  })

  it('returns Q1 (Jan-Mar) items for 2026', () => {
    const result = filterByPeriod(items, 'quarter', { year: 2026, quarter: 1 })
    expect(result).toHaveLength(3) // jan1, feb1, mar1
  })

  it('returns Q2 (Apr-Jun) items - empty in our dataset', () => {
    const result = filterByPeriod(items, 'quarter', { year: 2026, quarter: 2 })
    expect(result).toHaveLength(0)
  })

  it('returns Q3 (Jul-Sep) items - empty in our dataset', () => {
    const result = filterByPeriod(items, 'quarter', { year: 2026, quarter: 3 })
    expect(result).toHaveLength(0)
  })
})

describe('filterByPeriod - year mode', () => {
  it('returns all 2025 items', () => {
    const result = filterByPeriod(items, 'year', { year: 2025 })
    expect(result).toHaveLength(3) // nov1, nov2, dec1
  })

  it('returns all 2026 items', () => {
    const result = filterByPeriod(items, 'year', { year: 2026 })
    expect(result).toHaveLength(3) // jan1, feb1, mar1
  })
})

describe('filterByPeriod - all mode', () => {
  it('returns everything', () => {
    const result = filterByPeriod(items, 'all', {})
    expect(result).toHaveLength(items.length)
  })

  it('returns empty array unchanged', () => {
    const result = filterByPeriod([], 'all', {})
    expect(result).toHaveLength(0)
  })
})

describe('filterByPeriod - range mode', () => {
  it('returns items between start and end dates inclusive', () => {
    const result = filterByPeriod(items, 'range', {
      start: '2025-12-01',
      end: '2026-02-28',
    })
    expect(result).toHaveLength(3) // dec1, jan1, feb1
  })

  it('returns empty when range has no matches', () => {
    const result = filterByPeriod(items, 'range', {
      start: '2024-01-01',
      end: '2024-12-31',
    })
    expect(result).toHaveLength(0)
  })
})

describe('filterByPeriod - empty array', () => {
  it('returns empty for any mode', () => {
    expect(filterByPeriod([], 'month', { year: 2025, month: 11 })).toHaveLength(0)
    expect(filterByPeriod([], 'quarter', { year: 2025, quarter: 4 })).toHaveLength(0)
    expect(filterByPeriod([], 'year', { year: 2025 })).toHaveLength(0)
    expect(filterByPeriod([], 'range', { start: '2025-01-01', end: '2025-12-31' })).toHaveLength(0)
  })
})

describe('getMonthsInRange', () => {
  it('returns months between two dates', () => {
    const months = getMonthsInRange('2025-11-01', '2026-02-01')
    expect(months).toEqual(['2025-11', '2025-12', '2026-01', '2026-02'])
  })

  it('returns single month when start and end are same month', () => {
    const months = getMonthsInRange('2026-03-01', '2026-03-31')
    expect(months).toEqual(['2026-03'])
  })
})

describe('groupByMonth', () => {
  it('groups items by month key', () => {
    const grouped = groupByMonth(items)
    expect(Object.keys(grouped)).toHaveLength(5)
    expect(grouped['2025-11']).toHaveLength(2)
    expect(grouped['2025-12']).toHaveLength(1)
    expect(grouped['2026-01']).toHaveLength(1)
  })

  it('returns empty object for empty input', () => {
    expect(groupByMonth([])).toEqual({})
  })
})
