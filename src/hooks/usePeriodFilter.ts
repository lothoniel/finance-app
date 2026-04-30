import { useState, useMemo } from 'react'
import { filterByPeriod, type PeriodMode, type PeriodValue } from '../lib/filters'

function currentMonth(): PeriodValue {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function usePeriodFilter<T extends { date: string }>(
  items: T[],
  initialMode: PeriodMode = 'month',
  initialValue?: PeriodValue
) {
  const [mode, setMode] = useState<PeriodMode>(initialMode)
  const [value, setValue] = useState<PeriodValue>(initialValue ?? currentMonth())

  const filtered = useMemo(
    () => filterByPeriod(items, mode, value),
    [items, mode, value]
  )

  function onChange(newMode: PeriodMode, newValue: PeriodValue) {
    setMode(newMode)
    setValue(newValue)
  }

  return { mode, value, onChange, filtered }
}
