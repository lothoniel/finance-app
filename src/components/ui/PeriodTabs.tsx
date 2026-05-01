import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PeriodMode, PeriodValue } from '../../lib/filters'

interface PeriodTabsProps {
  mode: PeriodMode
  value: PeriodValue
  onChange: (mode: PeriodMode, value: PeriodValue) => void
  /** 'light' for dark bands (white active tab), 'dark' for cream/light bands */
  variant?: 'light' | 'dark'
  modes?: PeriodMode[]
}

const MODE_LABELS: Partial<Record<PeriodMode, string>> = {
  month: 'Month',
  quarter: 'Quarter',
  year: 'Year',
  all: 'All Time',
  range: 'Range',
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
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
  return 'All Time'
}

function navigatePeriod(mode: PeriodMode, value: PeriodValue, dir: -1 | 1): PeriodValue {
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

function defaultValue(mode: PeriodMode): PeriodValue {
  const now = new Date()
  if (mode === 'month') return { year: now.getFullYear(), month: now.getMonth() + 1 }
  if (mode === 'quarter') return { year: now.getFullYear(), quarter: Math.ceil((now.getMonth() + 1) / 3) }
  if (mode === 'year') return { year: now.getFullYear() }
  if (mode === 'range') return { start: '', end: '' }
  return {}
}

export default function PeriodTabs({
  mode,
  value,
  onChange,
  variant = 'light',
  modes = ['month', 'quarter', 'year', 'all'],
}: PeriodTabsProps) {
  const showNav = mode === 'month' || mode === 'quarter' || mode === 'year'

  const pillBg = variant === 'light' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)'
  const activeTab = variant === 'light'
    ? { background: '#ffffff', color: '#181d26' }
    : { background: 'rgba(0,0,0,0.12)', color: '#181d26' }
  const inactiveColor = variant === 'light' ? 'rgba(255,255,255,0.75)' : 'rgba(24,29,38,0.55)'
  const navBtnColor = variant === 'light' ? 'rgba(255,255,255,0.75)' : 'rgba(24,29,38,0.5)'
  const navLabelColor = variant === 'light' ? '#ffffff' : '#181d26'

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Mode tabs */}
      <div className="flex gap-1 rounded-full p-1" style={{ background: pillBg }}>
        {modes.filter((m) => m in MODE_LABELS).map((m) => {
          const isActive = mode === m
          return (
            <button
              key={m}
              onClick={() => onChange(m, defaultValue(m))}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors"
              style={isActive ? activeTab : { color: inactiveColor }}
            >
              {MODE_LABELS[m]}
            </button>
          )
        })}
      </div>

      {/* Navigation arrows */}
      {showNav && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange(mode, navigatePeriod(mode, value, -1))}
            className="transition-opacity hover:opacity-100 opacity-60"
            style={{ color: navBtnColor }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[13px] font-medium min-w-[100px] text-center" style={{ color: navLabelColor }}>
            {getPeriodLabel(mode, value)}
          </span>
          <button
            onClick={() => onChange(mode, navigatePeriod(mode, value, 1))}
            className="transition-opacity hover:opacity-100 opacity-60"
            style={{ color: navBtnColor }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Range date inputs */}
      {mode === 'range' && (
        <div className="flex items-center gap-2 rounded-[8px] px-3 py-1.5" style={{ background: pillBg }}>
          <input
            type="date"
            value={value.start ?? ''}
            onChange={(e) => onChange(mode, { ...value, start: e.target.value })}
            className="text-[12px] bg-transparent focus:outline-none"
            style={{ color: navLabelColor }}
          />
          <span className="text-[12px] opacity-60" style={{ color: navLabelColor }}>–</span>
          <input
            type="date"
            value={value.end ?? ''}
            onChange={(e) => onChange(mode, { ...value, end: e.target.value })}
            className="text-[12px] bg-transparent focus:outline-none"
            style={{ color: navLabelColor }}
          />
        </div>
      )}
    </div>
  )
}
