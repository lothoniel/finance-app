import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { parseLinesForBank } from '../../lib/localOcr'

// inferYear uses Date.now(); pin it so tests are deterministic regardless of clock.
beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-05-17T12:00:00Z'))
})

afterAll(() => {
  vi.useRealTimers()
})

describe('parseBanamex', () => {
  // Real Tesseract output captured 2026-05-17 from Banamex weekly view.
  it('extracts rows from real OCR (description+amount line, then date+status line)', () => {
    const lines = [
      'PSM*AUT LAVADO CARRE $180.00',
      '16 May En proceso e',
      'Costco $6,136.85',
      'Costco',
      '15 May En proceso e',
      "Carl's Jr $471.00",
      '14 May En proceso e',
    ]
    const { transactions, excludedCredits } = parseLinesForBank(lines, 'banamex')
    expect(excludedCredits).toBe(0)
    expect(transactions).toEqual([
      { date: '2026-05-16', description: 'PSM*AUT LAVADO CARRE', amount: 180 },
      { date: '2026-05-15', description: 'Costco', amount: 6136.85 },
      { date: '2026-05-14', description: "Carl's Jr", amount: 471 },
    ])
  })

  it('falls back to the previous line when description does not appear before the amount', () => {
    const lines = [
      'PSM*AUT LAVADO CARRE',
      '$180.00',
      '16 May',
    ]
    const { transactions } = parseLinesForBank(lines, 'banamex')
    expect(transactions).toEqual([
      { date: '2026-05-16', description: 'PSM*AUT LAVADO CARRE', amount: 180 },
    ])
  })

  it('excludes credit rows (+$ sign or SU ABONO/GRACIAS heuristic)', () => {
    const lines = [
      'Costco $6,136.85',
      '15 May En proceso e',
      'SU ABONO...GRACIAS +$19,000.00',
      '12 May En proceso e',
    ]
    const { transactions, excludedCredits } = parseLinesForBank(lines, 'banamex')
    expect(excludedCredits).toBe(1)
    expect(transactions).toHaveLength(1)
    expect(transactions[0].description).toBe('Costco')
  })

  it('rolls year back when month is more than ~2 months in the future', () => {
    // System time pinned to May 2026 — "01 Dec" → resolves to 2025.
    const lines = ['Some Merchant $100.00', '01 Dec En proceso']
    const { transactions } = parseLinesForBank(lines, 'banamex')
    expect(transactions[0].date).toBe('2025-12-01')
  })

  it('accepts Spanish month abbreviations', () => {
    const lines = ['Pan La Esperanza $45.00', '03 Abr En proceso']
    const { transactions } = parseLinesForBank(lines, 'banamex')
    expect(transactions[0].date).toBe('2026-04-03')
  })
})

describe('parseBanorte', () => {
  // Real Tesseract output captured 2026-05-17 from Banorte transaction list.
  it('extracts rows from real OCR (arrow-icon noise, multi-line wrapped descriptions)', () => {
    const lines = [
      '16-05-2026',
      'ONZA 7 -$333.30',
      '~ RESTAURANTE',
      '© HE. >',
      'Tarjeta titular En proceso',
      '15-05-2026',
      'BPK*OFI KWICK 7 -$62.00',
      '~ MATRIZ2-',
      'O >',
      'Tarjeta titular En proceso',
      '14-05-2026',
      'TARJETA DIGITAL 7 -$206.96',
      '~ PAY PAL*UBR...',
      'o >',
      'TARJETA DIGITAL 7 -$1,104.48',
      '~ PAYPAL *TEM...',
      '7 a=>',
      'TARJETA DIGITAL 7 -$206.96',
      '~ PAY PAL*UBR...',
      '> am',
    ]
    const { transactions, excludedCredits } = parseLinesForBank(lines, 'banorte')
    expect(excludedCredits).toBe(0)
    expect(transactions).toEqual([
      { date: '2026-05-16', description: 'ONZA RESTAURANTE', amount: 333.30 },
      { date: '2026-05-15', description: 'BPK*OFI KWICK MATRIZ2-', amount: 62 },
      { date: '2026-05-14', description: 'TARJETA DIGITAL PAY PAL*UBR...', amount: 206.96 },
      { date: '2026-05-14', description: 'TARJETA DIGITAL PAYPAL *TEM...', amount: 1104.48 },
      { date: '2026-05-14', description: 'TARJETA DIGITAL PAY PAL*UBR...', amount: 206.96 },
    ])
  })

  it('skips +$ credits', () => {
    const lines = [
      '14-05-2026',
      'PAGO RECIBIDO 7 +$5,000.00',
      'Tarjeta titular En proceso',
      'Costco 7 -$1,200.00',
      'Tarjeta titular En proceso',
    ]
    const { transactions, excludedCredits } = parseLinesForBank(lines, 'banorte')
    expect(excludedCredits).toBe(1)
    expect(transactions).toEqual([
      { date: '2026-05-14', description: 'Costco', amount: 1200 },
    ])
  })

  it('drops rows that have no preceding date header', () => {
    const lines = ['Costco 7 -$50.00', 'Tarjeta titular En proceso']
    const { transactions } = parseLinesForBank(lines, 'banorte')
    expect(transactions).toEqual([])
  })
})
