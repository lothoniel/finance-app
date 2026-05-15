import { describe, it, expect } from 'vitest'
import {
  formatMXN,
  formatMXNCompact,
  formatMoneyCompact,
  formatUSD,
  formatDate,
  formatShortMonth,
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

describe('formatMoneyCompact', () => {
  it('returns compact format for MXN', () => {
    expect(formatMoneyCompact(1500, 'MXN')).toBe('$1.5k')
  })

  it('returns compact format for USD (same digits per Phase 1 decision)', () => {
    expect(formatMoneyCompact(1500, 'USD')).toBe('$1.5k')
  })

  it('handles millions for both currencies', () => {
    expect(formatMoneyCompact(2_500_000, 'MXN')).toBe('$2.5M')
    expect(formatMoneyCompact(2_500_000, 'USD')).toBe('$2.5M')
  })
})

describe('formatDate', () => {
  it('formats a date string in English by default', () => {
    const result = formatDate('2026-03-30')
    expect(result).toBe('Mar 30, 2026')
  })

  it('formats a date string in Spanish when locale=es', () => {
    const result = formatDate('2026-03-30', 'es')
    expect(result).toContain('mar')
    expect(result).toContain('2026')
  })

  it('handles invalid date gracefully', () => {
    const result = formatDate('invalid')
    expect(typeof result).toBe('string')
  })
})

describe('formatShortMonth', () => {
  it('returns English month abbreviation by default', () => {
    expect(formatShortMonth('2026-01-01')).toBe('Jan 26')
  })

  it('returns Spanish month abbreviation when locale=es', () => {
    expect(formatShortMonth('2026-01-01', 'es')).toContain('ene')
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
