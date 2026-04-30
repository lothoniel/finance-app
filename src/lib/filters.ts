export type PeriodMode = 'month' | 'quarter' | 'year' | 'range' | 'all'

export interface PeriodValue {
  year?: number
  month?: number // 1-12
  quarter?: number // 1-4
  start?: string // YYYY-MM-DD
  end?: string // YYYY-MM-DD
}

export function filterByPeriod<T extends { date: string }>(
  items: T[],
  mode: PeriodMode,
  value: PeriodValue
): T[] {
  if (mode === 'all') return items

  return items.filter((item) => {
    const [yearStr, monthStr] = item.date.split('-')
    const itemYear = parseInt(yearStr, 10)
    const itemMonth = parseInt(monthStr, 10) // 1-12

    if (mode === 'month') {
      return itemYear === value.year && itemMonth === value.month
    }

    if (mode === 'quarter') {
      if (itemYear !== value.year) return false
      const q = value.quarter ?? 1
      const qStart = (q - 1) * 3 + 1
      const qEnd = q * 3
      return itemMonth >= qStart && itemMonth <= qEnd
    }

    if (mode === 'year') {
      return itemYear === value.year
    }

    if (mode === 'range') {
      const start = value.start ?? ''
      const end = value.end ?? ''
      return item.date >= start && item.date <= end
    }

    return true
  })
}

export function getMonthsInRange(start: string, end: string): string[] {
  const months: string[] = []
  const [startYear, startMonth] = start.split('-').map(Number)
  const [endYear, endMonth] = end.split('-').map(Number)

  let year = startYear
  let month = startMonth

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`)
    month++
    if (month > 12) {
      month = 1
      year++
    }
  }

  return months
}

export function sortByDateDesc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.date.localeCompare(a.date))
}

export function sortByDateAsc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.date.localeCompare(b.date))
}

export function groupByMonth<T extends { date: string }>(
  items: T[]
): Record<string, T[]> {
  const result: Record<string, T[]> = {}

  for (const item of items) {
    const [year, month] = item.date.split('-')
    const key = `${year}-${month}`
    if (!result[key]) result[key] = []
    result[key].push(item)
  }

  return result
}
