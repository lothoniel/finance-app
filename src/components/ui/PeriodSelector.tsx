import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PeriodMode, PeriodValue } from '../../lib/filters'

interface PeriodSelectorProps {
  mode: PeriodMode
  value: PeriodValue
  onChange: (mode: PeriodMode, value: PeriodValue) => void
  modes?: PeriodMode[]
}

const MODE_LABELS: Record<PeriodMode, string> = {
  month: 'Month',
  quarter: 'Quarter',
  year: 'Year',
  range: 'Range',
  all: 'All Time',
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getPeriodLabel(mode: PeriodMode, value: PeriodValue): string {
  if (mode === 'month' && value.year && value.month) {
    return `${MONTH_NAMES[value.month - 1]} ${value.year}`
  }
  if (mode === 'quarter' && value.year && value.quarter) {
    return `Q${value.quarter} ${value.year}`
  }
  if (mode === 'year' && value.year) {
    return `${value.year}`
  }
  if (mode === 'range') {
    return `${value.start ?? ''} – ${value.end ?? ''}`
  }
  return 'All Time'
}

function navigate(mode: PeriodMode, value: PeriodValue, dir: -1 | 1): PeriodValue {
  if (mode === 'month') {
    let month = (value.month ?? 1) + dir
    let year = value.year ?? new Date().getFullYear()
    if (month > 12) { month = 1; year++ }
    if (month < 1) { month = 12; year-- }
    return { year, month }
  }
  if (mode === 'quarter') {
    let quarter = (value.quarter ?? 1) + dir
    let year = value.year ?? new Date().getFullYear()
    if (quarter > 4) { quarter = 1; year++ }
    if (quarter < 1) { quarter = 4; year-- }
    return { year, quarter }
  }
  if (mode === 'year') {
    return { year: (value.year ?? new Date().getFullYear()) + dir }
  }
  return value
}

export default function PeriodSelector({
  mode,
  value,
  onChange,
  modes = ['month', 'quarter', 'year', 'all'],
}: PeriodSelectorProps) {
  const showNav = mode === 'month' || mode === 'quarter' || mode === 'year'

  function handleModeChange(newMode: PeriodMode) {
    const now = new Date()
    let newValue: PeriodValue = {}
    if (newMode === 'month') {
      newValue = { year: now.getFullYear(), month: now.getMonth() + 1 }
    } else if (newMode === 'quarter') {
      newValue = { year: now.getFullYear(), quarter: Math.ceil((now.getMonth() + 1) / 3) }
    } else if (newMode === 'year') {
      newValue = { year: now.getFullYear() }
    } else if (newMode === 'range') {
      newValue = { start: '', end: '' }
    }
    onChange(newMode, newValue)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Mode tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-1 gap-1">
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              mode === m
                ? 'bg-[#6B3FA0] text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Navigation */}
      {showNav && (
        <div className="flex items-center gap-2 bg-white dark:bg-[#1A1F2E] border border-gray-200 dark:border-[#2D3448] rounded-full px-3 py-1.5">
          <button
            onClick={() => onChange(mode, navigate(mode, value, -1))}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[130px] text-center">
            {getPeriodLabel(mode, value)}
          </span>
          <button
            onClick={() => onChange(mode, navigate(mode, value, 1))}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {mode === 'all' && (
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 px-3 py-1.5 bg-white dark:bg-[#1A1F2E] border border-gray-200 dark:border-[#2D3448] rounded-full">
          All Time
        </span>
      )}

      {mode === 'range' && (
        <div className="flex items-center gap-2 bg-white dark:bg-[#1A1F2E] border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-1.5">
          <input
            type="date"
            value={value.start ?? ''}
            onChange={(e) => onChange(mode, { ...value, start: e.target.value })}
            className="text-sm text-gray-900 dark:text-white bg-transparent focus:outline-none"
          />
          <span className="text-gray-400 text-sm">–</span>
          <input
            type="date"
            value={value.end ?? ''}
            onChange={(e) => onChange(mode, { ...value, end: e.target.value })}
            className="text-sm text-gray-900 dark:text-white bg-transparent focus:outline-none"
          />
        </div>
      )}
    </div>
  )
}
