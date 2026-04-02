import { describe, it, expect } from 'vitest'
import {
  formatMXN,
  formatMXNCompact,
  formatUSD,
  formatDate,
  formatPct,
} from '../../lib/formatters'

describe('formatMXN', () => {
  it('formats a typical amount correctly', () => {
    const result = formatMXN(1234.56)
    expect(result).toContain('1,234.56')
  })

  it('formats zero correctly', () => {
    const result = formatMXN(0)
    expect(result).toContain('0.00')
  })

  it('formats large amount', () => {
    const result = formatMXN(50000)
    expect(result).toContain('50,000.00')
  })

  it('formats negative amount', () => {
    const result = formatMXN(-500)
    expect(result).toContain('500.00')
  })
})

describe('formatMXNCompact', () => {
  it('formats millions', () => {
    expect(formatMXNCompact(1200000)).toBe('$1.2M')
  })

  it('formats thousands', () => {
    expect(formatMXNCompact(5500)).toBe('$5.5k')
  })

  it('formats small numbers without suffix', () => {
    expect(formatMXNCompact(999)).toBe('$999')
  })

  it('formats exact million', () => {
    expect(formatMXNCompact(2000000)).toBe('$2.0M')
  })
})

describe('formatUSD', () => {
  it('formats USD correctly', () => {
    const result = formatUSD(1000)
    expect(result).toContain('1,000.00')
  })
})

describe('formatDate', () => {
  it('formats a date string', () => {
    const result = formatDate('2026-03-30')
    expect(result).toBe('Mar 30, 2026')
  })

  it('handles invalid date gracefully', () => {
    const result = formatDate('invalid')
    expect(typeof result).toBe('string')
  })
})

describe('formatPct', () => {
  it('adds + sign for positive values', () => {
    expect(formatPct(12.5)).toBe('+12.5%')
  })

  it('keeps - sign for negative values', () => {
    expect(formatPct(-3.2)).toBe('-3.2%')
  })

  it('formats zero with + sign', () => {
    expect(formatPct(0)).toBe('+0.0%')
  })
})
