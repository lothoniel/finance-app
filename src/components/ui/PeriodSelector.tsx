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
    if (newMode === 'month') newValue = { year: now.getFullYear(), month: now.getMonth() + 1 }
    else if (newMode === 'quarter') newValue = { year: now.getFullYear(), quarter: Math.ceil((now.getMonth() + 1) / 3) }
    else if (newMode === 'year') newValue = { year: now.getFullYear() }
    else if (newMode === 'range') newValue = { start: '', end: '' }
    onChange(newMode, newValue)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex bg-[#f0f2f5] dark:bg-[#252b3b] rounded-full p-1 gap-1">
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
              mode === m
                ? 'bg-white dark:bg-[#1e2330] text-[#181d26] dark:text-[#e8eaf0] shadow-sm'
                : 'text-[#41454d] dark:text-[#9297a0] hover:text-[#181d26] dark:hover:text-[#e8eaf0]'
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {showNav && (
        <div className="flex items-center gap-2 bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-full px-3 py-1.5">
          <button
            onClick={() => onChange(mode, navigate(mode, value, -1))}
            className="text-[#41454d] dark:text-[#9297a0] hover:text-[#181d26] dark:hover:text-[#e8eaf0] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0] min-w-[130px] text-center">
            {getPeriodLabel(mode, value)}
          </span>
          <button
            onClick={() => onChange(mode, navigate(mode, value, 1))}
            className="text-[#41454d] dark:text-[#9297a0] hover:text-[#181d26] dark:hover:text-[#e8eaf0] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {mode === 'all' && (
        <span className="text-[13px] font-medium text-[#41454d] dark:text-[#9297a0] px-3 py-1.5 bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-full">
          All Time
        </span>
      )}

      {mode === 'range' && (
        <div className="flex items-center gap-2 bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[8px] px-3 py-1.5">
          <input
            type="date"
            value={value.start ?? ''}
            onChange={(e) => onChange(mode, { ...value, start: e.target.value })}
            className="text-[13px] text-[#181d26] dark:text-[#e8eaf0] bg-transparent focus:outline-none"
          />
          <span className="text-[#41454d] dark:text-[#9297a0] text-sm">–</span>
          <input
            type="date"
            value={value.end ?? ''}
            onChange={(e) => onChange(mode, { ...value, end: e.target.value })}
            className="text-[13px] text-[#181d26] dark:text-[#e8eaf0] bg-transparent focus:outline-none"
          />
        </div>
      )}
    </div>
  )
}
