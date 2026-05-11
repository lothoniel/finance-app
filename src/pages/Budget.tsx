import { useState, useMemo, useEffect, useRef } from 'react'
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react'
import { useStore } from '../store'
import { filterByPeriod, type PeriodMode, type PeriodValue } from '../lib/filters'
import { formatMXNCompact } from '../lib/formatters'
import { renderIcon } from '../lib/iconRenderer'
import PeriodSelector from '../components/ui/PeriodSelector'
import { PERIOD_SCALE } from '../lib/constants'
import type { Expense } from '../store/types'

const CARD = 'bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px]'
const COL = 'w-24 text-right flex-shrink-0'

function currentMonth(): PeriodValue {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

function getPriorMonths(mode: PeriodMode, value: PeriodValue, count: number): PeriodValue[] {
  const year = value.year ?? new Date().getFullYear()
  let startMonth: number
  if (mode === 'month') startMonth = value.month ?? 1
  else if (mode === 'quarter') startMonth = ((value.quarter ?? 1) - 1) * 3 + 1
  else startMonth = 1

  const result: PeriodValue[] = []
  for (let i = count; i >= 1; i--) {
    let m = startMonth - i
    let y = year
    while (m <= 0) { m += 12; y-- }
    result.push({ year: y, month: m })
  }
  return result
}

function ProgressBar({ actual, budget }: { actual: number; budget: number }) {
  if (budget <= 0) return null
  const pct = Math.min((actual / budget) * 100, 100)
  const over = actual > budget
  return (
    <div className="h-0.5 bg-[#f0f2f5] dark:bg-[#252b3b] rounded-full overflow-hidden mt-1.5">
      <div className={`h-full rounded-full ${over ? 'bg-[#c0392b]' : 'bg-[#27ae60]'}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function RemainingCell({ remaining, hasBudget }: { remaining: number; hasBudget: boolean }) {
  if (!hasBudget) return <span className="text-[#9297a0]">—</span>
  const color = remaining < 0 ? 'text-[#c0392b]' : remaining === 0 ? 'text-[#41454d] dark:text-[#9297a0]' : 'text-[#27ae60]'
  return (
    <span className={`font-medium ${color}`}>
      {remaining < 0 ? `-${formatMXNCompact(Math.abs(remaining))}` : formatMXNCompact(remaining)}
    </span>
  )
}

// ── Budget popover ────────────────────────────────────────────────────────────

interface PopoverState {
  catId: string
  catName: string
  currentBudget: number | undefined
  anchor: DOMRect
}

function BudgetPopover({
  state,
  expenses,
  onSave,
  onClose,
}: {
  state: PopoverState
  expenses: Expense[]
  onSave: (catId: string, budget: number | undefined) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState(state.currentBudget?.toString() ?? '')
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)

  // Last 6 calendar months (always relative to today, not the selected period)
  const historyMonths = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return { year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleString('en', { month: 'short' }).toUpperCase() }
    })
  }, [])

  const monthlySpending = useMemo(() =>
    historyMonths.map(({ year, month }) =>
      filterByPeriod(expenses, 'month', { year, month })
        .filter(e => e.category === state.catId)
        .reduce((s, e) => s + e.amount, 0)
    ), [historyMonths, expenses, state.catId])

  // "Last month" = the most recently completed month = index 4 (second to last)
  const spentLastMonth = monthlySpending[4] ?? 0
  const monthlyAvg = monthlySpending.reduce((s, v) => s + v, 0) / 6
  const maxBar = Math.max(...monthlySpending, 1)

  // Click outside to close
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  function handleSave() {
    const num = value.trim() ? parseFloat(value) : undefined
    onSave(state.catId, num)
  }

  // Position: below anchor, right-aligned; flip up if too close to bottom
  const popoverHeight = 280
  const { anchor } = state
  const spaceBelow = window.innerHeight - anchor.bottom
  const top = spaceBelow > popoverHeight + 16 ? anchor.bottom + 8 : anchor.top - popoverHeight - 8
  const right = Math.max(window.innerWidth - anchor.right, 8)

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', top, right, width: 280, zIndex: 50 }}
      className={`${CARD} shadow-xl p-4`}
    >
      <div className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0] mb-3">History</div>

      {/* Stats */}
      <div className="flex gap-6 mb-4">
        <div>
          <div className="text-[16px] font-bold text-[#181d26] dark:text-[#e8eaf0]">{formatMXNCompact(spentLastMonth)}</div>
          <div className="text-[11px] text-[#41454d] dark:text-[#9297a0] mt-0.5">Spent last month</div>
        </div>
        <div>
          <div className="text-[16px] font-bold text-[#181d26] dark:text-[#e8eaf0]">{formatMXNCompact(monthlyAvg)}</div>
          <div className="text-[11px] text-[#41454d] dark:text-[#9297a0] mt-0.5">Monthly average</div>
        </div>
      </div>

      {/* Mini bar chart */}
      <div className="relative">
        {hoveredBar !== null && (
          <div className="absolute -top-6 left-0 right-0 flex justify-center pointer-events-none">
            <span className="text-[11px] font-semibold text-[#181d26] dark:text-[#e8eaf0] bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded px-1.5 py-0.5 shadow-sm">
              {formatMXNCompact(monthlySpending[hoveredBar])}
            </span>
          </div>
        )}
        <div className="flex items-end gap-1 h-14 mb-1">
          {monthlySpending.map((v, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col justify-end h-full cursor-default"
              onMouseEnter={() => setHoveredBar(i)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <div
                className="rounded-sm w-full transition-opacity"
                style={{
                  height: `${Math.max((v / maxBar) * 100, v > 0 ? 4 : 0)}%`,
                  backgroundColor: '#e74c3c',
                  opacity: hoveredBar === i ? 1 : 0.5 + (i / 5) * 0.5,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Month labels */}
      <div className="flex gap-1 mb-4">
        {historyMonths.map(({ label }, i) => (
          <div key={i} className={`flex-1 text-center text-[10px] ${hoveredBar === i ? 'text-[#181d26] dark:text-[#e8eaf0] font-medium' : 'text-[#9297a0] dark:text-[#6b7280]'}`}>{label}</div>
        ))}
      </div>

      {/* Budget input */}
      <input
        autoFocus
        type="number" min="0" step="1"
        value={value}
        placeholder="Monthly budget"
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose() }}
        className="w-full border border-[#e8e8e8] dark:border-[#2d3347] rounded-[6px] px-3 py-2 text-[13px] text-right text-[#181d26] dark:text-[#e8eaf0] bg-white dark:bg-[#1e2330] focus:outline-none focus:border-[#181d26] dark:focus:border-[#e8eaf0]"
      />
      <div className="text-[10px] text-[#9297a0] text-right mt-1">Monthly · Enter to save · Esc to cancel</div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Budget() {
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month')
  const [periodValue, setPeriodValue] = useState<PeriodValue>(currentMonth)
  const [groupByMode, setGroupByMode] = useState<'category' | 'type'>('category')
  const [incomeOpen, setIncomeOpen] = useState(true)
  const [expensesOpen, setExpensesOpen] = useState(true)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const [showUnbudgeted, setShowUnbudgeted] = useState(false)
  const [popover, setPopover] = useState<PopoverState | null>(null)
  const [rolloverTooltip, setRolloverTooltip] = useState<{
    catName: string; rollover: number; budget: number; actual: number; remaining: number; x: number; y: number; mode: 'month' | 'year'
  } | null>(null)

  const expenses = useStore(s => s.expenses)
  const paychecks = useStore(s => s.paychecks)
  const transfers = useStore(s => s.transfers)
  const transferCategories = useStore(s => s.settings.transferCategories)
  const categories = useStore(s => s.settings.expenseCategories)
  const updateSettings = useStore(s => s.updateSettings)

  const scale = PERIOD_SCALE[periodMode] ?? 1

  function handlePeriodChange(mode: PeriodMode, value: PeriodValue) {
    setPeriodMode(mode)
    setPeriodValue(value)
  }

  const filteredExpenses = useMemo(() => filterByPeriod(expenses, periodMode, periodValue), [expenses, periodMode, periodValue])
  const filteredPaychecks = useMemo(() => filterByPeriod(paychecks, periodMode, periodValue), [paychecks, periodMode, periodValue])
  const filteredTransfers = useMemo(() => filterByPeriod(transfers, periodMode, periodValue), [transfers, periodMode, periodValue])

  const priorMonths = useMemo(() => getPriorMonths(periodMode, periodValue, 3), [periodMode, periodValue])

  const actualPaychecks = useMemo(() =>
    filteredPaychecks.reduce((s, p) => s + p.mxnAmount, 0), [filteredPaychecks])

  const actualTransfersByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    filteredTransfers.forEach(t => { map[t.category] = (map[t.category] ?? 0) + t.amount })
    return map
  }, [filteredTransfers])

  const paycheckMonthlyAvg = useMemo(() => {
    if (priorMonths.length === 0) return 0
    const total = priorMonths.reduce((s, pv) =>
      s + filterByPeriod(paychecks, 'month', pv).reduce((ss, p) => ss + p.mxnAmount, 0), 0)
    return total / priorMonths.length
  }, [paychecks, priorMonths])

  const transferMonthlyAvgByCategory = useMemo(() => {
    if (priorMonths.length === 0) return {} as Record<string, number>
    const map: Record<string, number> = {}
    priorMonths.forEach(pv => {
      filterByPeriod(transfers, 'month', pv).forEach(t => {
        map[t.category] = (map[t.category] ?? 0) + t.amount
      })
    })
    const avg: Record<string, number> = {}
    Object.keys(map).forEach(k => { avg[k] = map[k] / priorMonths.length })
    return avg
  }, [transfers, priorMonths])

  const paycheckBudget = paycheckMonthlyAvg * scale
  const transferBudgetByCategory = Object.fromEntries(
    transferCategories.map(tc => [tc.name, (transferMonthlyAvgByCategory[tc.name] ?? 0) * scale])
  )
  const totalIncomeBudget = paycheckBudget + Object.values(transferBudgetByCategory).reduce((s, v) => s + v, 0)
  const totalIncomeActual = actualPaychecks + Object.values(actualTransfersByCategory).reduce((s, v) => s + v, 0)

  const rolloverByCategory = useMemo(() => {
    if (periodMode !== 'month') return {}
    const result: Record<string, number> = {}
    const year = periodValue.year!
    const month = periodValue.month ?? 1
    for (const cat of categories) {
      if (!cat.rollover || !cat.budget) continue
      if (cat.rollover === 'month') {
        const prevDate = new Date(year, month - 2, 1)
        const prefix = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
        const prevActual = expenses
          .filter(e => e.category === cat.id && e.date.startsWith(prefix))
          .reduce((s, e) => s + e.amount, 0)
        result[cat.id] = cat.budget - prevActual
      } else if (cat.rollover === 'year') {
        let balance = 0
        for (let m = 1; m < month; m++) {
          const prefix = `${year}-${String(m).padStart(2, '0')}`
          const monthActual = expenses
            .filter(e => e.category === cat.id && e.date.startsWith(prefix))
            .reduce((s, e) => s + e.amount, 0)
          balance += cat.budget - monthActual
        }
        result[cat.id] = balance
      }
    }
    return result
  }, [periodMode, periodValue, categories, expenses])

  const actualByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    filteredExpenses.forEach(e => { map[e.category] = (map[e.category] ?? 0) + e.amount })
    return map
  }, [filteredExpenses])

  const budgetedCats = useMemo(() => categories.filter(c => c.budget !== undefined && c.budget > 0), [categories])
  const unbudgetedCats = useMemo(() => categories.filter(c => !c.budget), [categories])

  const expenseGroups = useMemo(() => {
    const groups: Record<string, typeof categories> = {}
    budgetedCats.forEach(cat => {
      const key = groupByMode === 'category'
        ? (cat.categoryGroup ?? 'Ungrouped')
        : (cat.expenseType === 'fixed' ? 'Fixed' : cat.expenseType === 'variable' ? 'Variable' : 'Untagged')
      ;(groups[key] ??= []).push(cat)
    })
    return groups
  }, [budgetedCats, groupByMode])

  const groupTotals = useMemo(() => {
    const totals: Record<string, { budget: number; actual: number }> = {}
    Object.entries(expenseGroups).forEach(([group, cats]) => {
      totals[group] = {
        budget: cats.reduce((s, c) => s + (c.budget ?? 0) * scale, 0),
        actual: cats.reduce((s, c) => s + (actualByCategory[c.id] ?? 0), 0),
      }
    })
    return totals
  }, [expenseGroups, scale, actualByCategory])

  const groupOrder = useMemo(() => {
    const keys = Object.keys(expenseGroups)
    if (groupByMode === 'type') {
      const priority = ['Fixed', 'Variable', 'Untagged']
      return [...keys].sort((a, b) => {
        const ai = priority.indexOf(a); const bi = priority.indexOf(b)
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
      })
    }
    return [...keys].sort((a, b) => {
      if (a === 'Ungrouped') return 1
      if (b === 'Ungrouped') return -1
      return a.localeCompare(b)
    })
  }, [expenseGroups, groupByMode])

  const totalExpenseBudget = budgetedCats.reduce((s, c) => s + (c.budget ?? 0) * scale, 0)
  const totalExpenseActual = categories.reduce((s, c) => s + (actualByCategory[c.id] ?? 0), 0)
  const overBudgetCount = budgetedCats.filter(c => (actualByCategory[c.id] ?? 0) > (c.budget ?? 0) * scale).length
  const leftToBudget = totalIncomeBudget - totalExpenseBudget

  function toggleGroup(group: string) {
    setOpenGroups(prev => ({ ...prev, [group]: !(prev[group] ?? true) }))
  }

  function isGroupOpen(group: string) { return openGroups[group] ?? true }

  function openPopover(catId: string, catName: string, currentBudget: number | undefined, e: React.MouseEvent) {
    const anchor = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPopover({ catId, catName, currentBudget, anchor })
  }

  function saveBudget(catId: string, budget: number | undefined) {
    updateSettings({ expenseCategories: categories.map(c => c.id === catId ? { ...c, budget } : c) })
    setPopover(null)
  }

  const rowBase = 'flex items-center gap-3 px-5 py-2.5'
  const colHeader = `${COL} text-[11px] text-[#41454d] dark:text-[#9297a0] uppercase tracking-wide`

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <h1 className="text-[20px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">Budget</h1>
        <PeriodSelector mode={periodMode} value={periodValue} onChange={handlePeriodChange} modes={['month', 'quarter', 'year']} />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Budget', value: formatMXNCompact(totalExpenseBudget), color: 'text-[#181d26] dark:text-[#e8eaf0]' },
          { label: 'Total Spent', value: formatMXNCompact(totalExpenseActual), color: totalExpenseActual > totalExpenseBudget ? 'text-[#c0392b]' : 'text-[#181d26] dark:text-[#e8eaf0]' },
          { label: 'Over Budget', value: `${overBudgetCount} categories`, color: overBudgetCount > 0 ? 'text-[#c0392b]' : 'text-[#181d26] dark:text-[#e8eaf0]' },
          { label: 'Remaining', value: formatMXNCompact(Math.max(totalExpenseBudget - totalExpenseActual, 0)), color: totalExpenseBudget - totalExpenseActual < 0 ? 'text-[#c0392b]' : 'text-[#27ae60]' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`${CARD} p-5`}>
            <div className={`text-[22px] font-bold ${color}`}>{value}</div>
            <div className="text-[11px] text-[#41454d] dark:text-[#9297a0] uppercase tracking-wide mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="flex gap-5 items-start">
        {/* Left: main table */}
        <div className={`flex-1 min-w-0 ${CARD} overflow-hidden`}>
          {/* Column headers */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[#f0f2f5] dark:border-[#2d3347]">
            <div className="flex-1 text-[11px] text-[#41454d] dark:text-[#9297a0] uppercase tracking-wide">Category</div>
            <div className={colHeader}>Budget</div>
            <div className={colHeader}>Actual</div>
            <div className={colHeader}>Remaining</div>
          </div>

          {/* ── Income section ── */}
          <button
            className={`${rowBase} w-full hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] border-b border-[#f0f2f5] dark:border-[#2d3347]`}
            onClick={() => setIncomeOpen(o => !o)}
          >
            {incomeOpen
              ? <ChevronDown className="w-3.5 h-3.5 text-[#41454d] dark:text-[#9297a0] flex-shrink-0" />
              : <ChevronRight className="w-3.5 h-3.5 text-[#41454d] dark:text-[#9297a0] flex-shrink-0" />}
            <span className="flex-1 text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0] text-left">Income</span>
            <div className={`${COL} text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0]`}>{formatMXNCompact(totalIncomeBudget)}</div>
            <div className={`${COL} text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0]`}>{formatMXNCompact(totalIncomeActual)}</div>
            <div className={`${COL} text-[13px] font-semibold`}>
              <RemainingCell remaining={totalIncomeBudget - totalIncomeActual} hasBudget={totalIncomeBudget > 0} />
            </div>
          </button>

          {incomeOpen && (
            <>
              <div className={`${rowBase} border-b border-[#f0f2f5] dark:border-[#2d3347]`}>
                <div className="w-3.5 flex-shrink-0" />
                <span className="w-6 h-6 rounded-[5px] flex items-center justify-center flex-shrink-0 bg-[#3b82f618]">
                  {renderIcon('Banknote', 'w-3 h-3', '#3b82f6')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-[#181d26] dark:text-[#e8eaf0]">Paychecks</div>
                  <ProgressBar actual={actualPaychecks} budget={paycheckBudget} />
                </div>
                <div className={`${COL} text-[13px] text-[#41454d] dark:text-[#9297a0]`}>{formatMXNCompact(paycheckBudget)}</div>
                <div className={`${COL} text-[13px] text-[#181d26] dark:text-[#e8eaf0]`}>{formatMXNCompact(actualPaychecks)}</div>
                <div className={`${COL} text-[13px]`}>
                  <RemainingCell remaining={paycheckBudget - actualPaychecks} hasBudget={paycheckBudget > 0} />
                </div>
              </div>

              {transferCategories.map(tc => {
                const budget = transferBudgetByCategory[tc.name] ?? 0
                const actual = actualTransfersByCategory[tc.name] ?? 0
                return (
                  <div key={tc.name} className={`${rowBase} border-b border-[#f0f2f5] dark:border-[#2d3347]`}>
                    <div className="w-3.5 flex-shrink-0" />
                    <span className="w-6 h-6 rounded-[5px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${tc.color}18` }}>
                      {renderIcon(tc.icon, 'w-3 h-3', tc.color)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-[#181d26] dark:text-[#e8eaf0]">{tc.name}</div>
                      <ProgressBar actual={actual} budget={budget} />
                    </div>
                    <div className={`${COL} text-[13px] text-[#41454d] dark:text-[#9297a0]`}>{budget > 0 ? formatMXNCompact(budget) : '—'}</div>
                    <div className={`${COL} text-[13px] text-[#181d26] dark:text-[#e8eaf0]`}>{formatMXNCompact(actual)}</div>
                    <div className={`${COL} text-[13px]`}>
                      <RemainingCell remaining={budget - actual} hasBudget={budget > 0} />
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {/* Total Income row */}
          <div className={`${rowBase} bg-[#f8fafc] dark:bg-[#252b3b] border-b border-[#e8e8e8] dark:border-[#2d3347]`}>
            <div className="w-3.5 flex-shrink-0" />
            <span className="flex-1 text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">Total Income</span>
            <div className={`${COL} text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0]`}>{formatMXNCompact(totalIncomeBudget)}</div>
            <div className={`${COL} text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0]`}>{formatMXNCompact(totalIncomeActual)}</div>
            <div className={`${COL} text-[13px] font-semibold`}>
              <RemainingCell remaining={totalIncomeBudget - totalIncomeActual} hasBudget={totalIncomeBudget > 0} />
            </div>
          </div>

          {/* ── Expenses section ── */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[#f0f2f5] dark:border-[#2d3347]">
            <button className="flex items-center gap-3 flex-1 min-w-0" onClick={() => setExpensesOpen(o => !o)}>
              {expensesOpen
                ? <ChevronDown className="w-3.5 h-3.5 text-[#41454d] dark:text-[#9297a0] flex-shrink-0" />
                : <ChevronRight className="w-3.5 h-3.5 text-[#41454d] dark:text-[#9297a0] flex-shrink-0" />}
              <span className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">Expenses</span>
            </button>
            <div className="flex bg-[#f0f2f5] dark:bg-[#252b3b] rounded-full p-0.5 gap-0.5 flex-shrink-0">
              {(['category', 'type'] as const).map(m => (
                <button key={m} onClick={() => setGroupByMode(m)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                    groupByMode === m
                      ? 'bg-white dark:bg-[#1e2330] text-[#181d26] dark:text-[#e8eaf0] shadow-sm'
                      : 'text-[#41454d] dark:text-[#9297a0] hover:text-[#181d26]'
                  }`}>
                  {m === 'category' ? 'Category Groups' : 'Fixed / Variable'}
                </button>
              ))}
            </div>
          </div>

          {expensesOpen && (
            <>
              {groupOrder.map(group => {
                const cats = expenseGroups[group] ?? []
                const totals = groupTotals[group] ?? { budget: 0, actual: 0 }
                const isOpen = isGroupOpen(group)

                return (
                  <div key={group}>
                    <button
                      className={`${rowBase} w-full hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] border-b border-[#f0f2f5] dark:border-[#2d3347]`}
                      onClick={() => toggleGroup(group)}
                    >
                      {isOpen
                        ? <ChevronDown className="w-3.5 h-3.5 text-[#41454d] dark:text-[#9297a0] flex-shrink-0" />
                        : <ChevronRight className="w-3.5 h-3.5 text-[#41454d] dark:text-[#9297a0] flex-shrink-0" />}
                      <span className="flex-1 text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0] text-left">{group}</span>
                      <div className={`${COL} text-[13px] font-medium text-[#41454d] dark:text-[#9297a0]`}>{formatMXNCompact(totals.budget)}</div>
                      <div className={`${COL} text-[13px] font-medium text-[#41454d] dark:text-[#9297a0]`}>{formatMXNCompact(totals.actual)}</div>
                      <div className={`${COL} text-[13px] font-medium`}>
                        <RemainingCell remaining={totals.budget - totals.actual} hasBudget={totals.budget > 0} />
                      </div>
                    </button>

                    {isOpen && cats.map(cat => {
                      const budget = (cat.budget ?? 0) * scale
                      const actual = actualByCategory[cat.id] ?? 0
                      const rollover = rolloverByCategory[cat.id] ?? 0
                      const effectiveBudget = budget + rollover
                      const remaining = effectiveBudget - actual
                      const hasRollover = (cat.rollover === 'month' || cat.rollover === 'year') && periodMode === 'month'
                      const isPopoverOpen = popover?.catId === cat.id

                      return (
                        <div key={cat.id} className={`${rowBase} border-b border-[#f0f2f5] dark:border-[#2d3347] pl-10`}>
                          <span className="w-6 h-6 rounded-[5px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cat.color}18` }}>
                            {renderIcon(cat.icon, 'w-3 h-3', cat.color)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] text-[#181d26] dark:text-[#e8eaf0]">{cat.name}</div>
                            <ProgressBar actual={actual} budget={effectiveBudget} />
                          </div>
                          <div className={`${COL} text-[13px]`}>
                            <button
                              onClick={e => openPopover(cat.id, cat.name, cat.budget, e)}
                              className={`w-full text-right transition-colors rounded px-1 ${
                                isPopoverOpen
                                  ? 'text-[#181d26] dark:text-[#e8eaf0] bg-[#f0f2f5] dark:bg-[#252b3b]'
                                  : 'text-[#41454d] dark:text-[#9297a0] hover:text-[#181d26] dark:hover:text-[#e8eaf0] hover:bg-[#f0f2f5] dark:hover:bg-[#252b3b]'
                              }`}
                              title="Click to edit budget"
                            >
                              {formatMXNCompact(hasRollover ? effectiveBudget : budget)}
                            </button>
                          </div>
                          <div className={`${COL} text-[13px] text-[#181d26] dark:text-[#e8eaf0]`}>{formatMXNCompact(actual)}</div>
                          <div className={`${COL} text-[13px]`}>
                            {hasRollover ? (
                              <div
                                className="inline-flex items-center gap-1 justify-end w-full cursor-default"
                                onMouseEnter={e => {
                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                                  setRolloverTooltip({ catName: cat.name, rollover, budget, actual, remaining, x: rect.right, y: rect.top, mode: cat.rollover as 'month' | 'year' })
                                }}
                                onMouseLeave={() => setRolloverTooltip(null)}
                              >
                                <RotateCcw className="w-3 h-3 text-[#9297a0]" />
                                <RemainingCell remaining={remaining} hasBudget />
                              </div>
                            ) : (
                              <RemainingCell remaining={budget - actual} hasBudget={budget > 0} />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}

              {/* Unbudgeted categories */}
              {unbudgetedCats.length > 0 && (
                <div>
                  <button
                    className={`${rowBase} w-full hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] border-b border-[#f0f2f5] dark:border-[#2d3347]`}
                    onClick={() => setShowUnbudgeted(o => !o)}
                  >
                    <div className="w-3.5 flex-shrink-0" />
                    <span className="flex-1 text-[12px] text-[#41454d] dark:text-[#9297a0] text-left">
                      {showUnbudgeted ? 'Hide' : `Show ${unbudgetedCats.length}`} unbudgeted
                    </span>
                    <div className={`${COL} text-[13px] text-[#41454d] dark:text-[#9297a0]`}>—</div>
                    <div className={`${COL} text-[13px] text-[#181d26] dark:text-[#e8eaf0]`}>
                      {formatMXNCompact(unbudgetedCats.reduce((s, c) => s + (actualByCategory[c.id] ?? 0), 0))}
                    </div>
                    <div className={`${COL} text-[13px] text-[#9297a0]`}>—</div>
                  </button>

                  {showUnbudgeted && unbudgetedCats.map(cat => {
                    const actual = actualByCategory[cat.id] ?? 0
                    const isPopoverOpen = popover?.catId === cat.id

                    return (
                      <div key={cat.id} className={`${rowBase} border-b border-[#f0f2f5] dark:border-[#2d3347] pl-10`}>
                        <span className="w-6 h-6 rounded-[5px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cat.color}18` }}>
                          {renderIcon(cat.icon, 'w-3 h-3', cat.color)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] text-[#41454d] dark:text-[#9297a0]">{cat.name}</div>
                        </div>
                        <div className={`${COL} text-[13px]`}>
                          <button
                            onClick={e => openPopover(cat.id, cat.name, cat.budget, e)}
                            className={`w-full text-right transition-colors rounded px-1 ${
                              isPopoverOpen
                                ? 'text-[#41454d] dark:text-[#9297a0] bg-[#f0f2f5] dark:bg-[#252b3b]'
                                : 'text-[#c0c4cc] dark:text-[#4a5168] hover:text-[#41454d] dark:hover:text-[#9297a0] hover:bg-[#f0f2f5] dark:hover:bg-[#252b3b]'
                            } text-[12px]`}
                            title="Click to set budget"
                          >
                            + Set budget
                          </button>
                        </div>
                        <div className={`${COL} text-[13px] text-[#181d26] dark:text-[#e8eaf0]`}>{formatMXNCompact(actual)}</div>
                        <div className={`${COL} text-[13px] text-[#9297a0]`}>—</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Total Expenses row — always visible */}
          <div className={`${rowBase} bg-[#f8fafc] dark:bg-[#252b3b] border-b border-[#e8e8e8] dark:border-[#2d3347]`}>
            <div className="w-3.5 flex-shrink-0" />
            <span className="flex-1 text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">Total Expenses</span>
            <div className={`${COL} text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0]`}>{formatMXNCompact(totalExpenseBudget)}</div>
            <div className={`${COL} text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0]`}>{formatMXNCompact(totalExpenseActual)}</div>
            <div className={`${COL} text-[13px] font-semibold`}>
              <RemainingCell remaining={totalExpenseBudget - totalExpenseActual} hasBudget={totalExpenseBudget > 0} />
            </div>
          </div>
        </div>

        {/* Right: summary panel */}
        <div className="w-64 flex-shrink-0 sticky top-6 space-y-3">
          <div className={`${CARD} p-5 text-center`}>
            <div className={`text-[28px] font-bold ${leftToBudget >= 0 ? 'text-[#27ae60]' : 'text-[#c0392b]'}`}>
              {leftToBudget < 0 ? `-${formatMXNCompact(Math.abs(leftToBudget))}` : formatMXNCompact(leftToBudget)}
            </div>
            <div className="text-[12px] text-[#41454d] dark:text-[#9297a0] mt-1">Left to budget</div>
          </div>

          {groupOrder.length > 0 && (
            <div className={`${CARD} p-4 space-y-4`}>
              <div className="text-[11px] text-[#41454d] dark:text-[#9297a0] uppercase tracking-wide font-medium">
                {groupByMode === 'category' ? 'By Group' : 'By Type'}
              </div>
              {groupOrder.map(group => {
                const t = groupTotals[group] ?? { budget: 0, actual: 0 }
                const pct = t.budget > 0 ? Math.min((t.actual / t.budget) * 100, 100) : 0
                const over = t.actual > t.budget
                return (
                  <div key={group}>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0]">{group}</span>
                      <span className="text-[11px] text-[#41454d] dark:text-[#9297a0]">{formatMXNCompact(t.budget)}</span>
                    </div>
                    <div className="h-1.5 bg-[#f0f2f5] dark:bg-[#252b3b] rounded-full overflow-hidden mb-1.5">
                      <div className={`h-full rounded-full ${over ? 'bg-[#c0392b]' : 'bg-[#27ae60]'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px] text-[#41454d] dark:text-[#9297a0]">{formatMXNCompact(t.actual)} spent</span>
                      <span className={`text-[11px] font-medium ${over ? 'text-[#c0392b]' : 'text-[#27ae60]'}`}>
                        {over ? `-${formatMXNCompact(t.actual - t.budget)} over` : `${formatMXNCompact(t.budget - t.actual)} left`}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className={`${CARD} p-4 space-y-3`}>
            <div className="text-[11px] text-[#41454d] dark:text-[#9297a0] uppercase tracking-wide font-medium">Budget Allocation</div>
            {[
              { label: 'Income', value: totalIncomeBudget, color: '#27ae60' },
              { label: 'Expenses', value: totalExpenseBudget, color: '#e67e22' },
            ].map(({ label, value, color }) => {
              const pct = totalIncomeBudget > 0 ? Math.min((value / totalIncomeBudget) * 100, 100) : 0
              return (
                <div key={label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[12px] text-[#181d26] dark:text-[#e8eaf0]">{label}</span>
                    <span className="text-[12px] font-medium text-[#181d26] dark:text-[#e8eaf0]">{formatMXNCompact(value)}</span>
                  </div>
                  <div className="h-1.5 bg-[#f0f2f5] dark:bg-[#252b3b] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Rollover tooltip */}
      {rolloverTooltip && (
        <div
          style={{ position: 'fixed', right: window.innerWidth - rolloverTooltip.x, top: rolloverTooltip.y - 8, transform: 'translateY(-100%)', zIndex: 60 }}
          className="w-56 bg-[#1a1f2e] text-white rounded-[8px] p-3 shadow-xl pointer-events-none"
        >
          <div className="text-[13px] font-semibold mb-2.5">{rolloverTooltip.catName}</div>
          <div className="space-y-1.5">
            <div className="flex justify-between gap-3">
              <span className="text-[12px] text-[#9297a0]">
                {rolloverTooltip.mode === 'year' ? 'Rollover from this year' : 'Rollover from last month'}
              </span>
              <span className={`text-[12px] font-medium flex-shrink-0 ${rolloverTooltip.rollover >= 0 ? 'text-[#27ae60]' : 'text-[#c0392b]'}`}>
                {rolloverTooltip.rollover >= 0 ? '+' : ''}{formatMXNCompact(rolloverTooltip.rollover)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[12px] text-[#9297a0]">Budget</span>
              <span className="text-[12px] flex-shrink-0">{formatMXNCompact(rolloverTooltip.budget)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[12px] text-[#9297a0]">Actual</span>
              <span className="text-[12px] flex-shrink-0">{formatMXNCompact(rolloverTooltip.actual)}</span>
            </div>
            <div className="flex justify-between gap-3 border-t border-[#2d3347] pt-1.5 mt-0.5">
              <span className="text-[12px] font-semibold">Remaining</span>
              <span className={`text-[12px] font-semibold flex-shrink-0 ${rolloverTooltip.remaining >= 0 ? 'text-[#27ae60]' : 'text-[#c0392b]'}`}>
                {rolloverTooltip.remaining < 0 ? `-${formatMXNCompact(Math.abs(rolloverTooltip.remaining))}` : formatMXNCompact(rolloverTooltip.remaining)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Budget edit popover */}
      {popover && (
        <BudgetPopover
          state={popover}
          expenses={expenses}
          onSave={saveBudget}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  )
}
