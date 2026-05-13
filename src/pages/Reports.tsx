import { useState, useMemo, useRef, useEffect } from 'react'
import { Sankey } from 'recharts'
import type { NodeProps, LinkProps } from 'recharts/types/chart/Sankey'
import { useStore } from '../store'
import AreaChart from '../components/charts/AreaChart'
import DonutChart from '../components/charts/DonutChart'
import StackedBarChart from '../components/charts/StackedBarChart'
import PeriodSelector from '../components/ui/PeriodSelector'
import { filterByPeriod, getMonthsInRange, type PeriodMode, type PeriodValue } from '../lib/filters'
import { formatMXNCompact } from '../lib/formatters'

interface BucketMeta {
  key: string
  label: string
  isWeek?: true
  weekNum?: number
  year?: number
  month?: number
}

interface BucketData extends BucketMeta {
  income: number
  expenses: number
  debt: number
  savings: number
  savingsRate: number
}

interface StackedBucketRow {
  label: string
  [key: string]: string | number
}

const NODE_COLORS = ['#22c55e', '#3b82f6', '#10b981', '#ef4444', '#f97316', '#8b5cf6']
const TARGET_COLORS: Record<string, string> = {
  Savings: '#10b981',
  Debt: '#f97316',
  Investments: '#8b5cf6',
}
const CARD = 'bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px]'
const SECTION_LABEL = 'text-[11px] font-semibold tracking-wider text-[#9297a0] uppercase mb-4'

type Tab = 'cashflow' | 'spending' | 'income'

function SankeyNodeRenderer({ x, y, width, height, index, payload }: NodeProps) {
  const color = NODE_COLORS[index % NODE_COLORS.length]
  const isTarget = index >= 2
  const labelX = isTarget ? x + width + 8 : x - 8
  const anchor = isTarget ? 'start' : 'end'
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} rx={2} />
      <text x={labelX} y={y + height / 2 - 7} textAnchor={anchor} dominantBaseline="middle" fontSize={12} fontWeight={600} fill="#374151">
        {payload.name}
      </text>
      <text x={labelX} y={y + height / 2 + 8} textAnchor={anchor} dominantBaseline="middle" fontSize={10} fill="#9297a0">
        {formatMXNCompact(payload.value ?? 0)}
      </text>
    </g>
  )
}

function SankeyLinkRenderer({ sourceX, sourceY, sourceControlX, targetX, targetY, targetControlX, linkWidth, payload }: LinkProps) {
  const color = TARGET_COLORS[payload.target.name] ?? '#9ca3af'
  return (
    <path
      d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none"
      stroke={color}
      strokeWidth={linkWidth}
      strokeOpacity={0.35}
    />
  )
}

function buildChartKeys(mode: PeriodMode, value: PeriodValue, allDates: string[]): BucketMeta[] {
  if (mode === 'all') {
    if (allDates.length === 0) return []
    const sorted = [...allDates].sort()
    const min = sorted[0].slice(0, 7) + '-01'
    const max = sorted[sorted.length - 1].slice(0, 7) + '-01'
    return getMonthsInRange(min, max).map(key => ({
      key,
      label: new Date(key + '-02').toLocaleString('default', { month: 'short', year: '2-digit' }),
    }))
  }
  if (mode === 'month' && value.year && value.month) {
    return [1, 2, 3, 4].map(w => ({
      key: `W${w}`,
      label: `W${w}`,
      isWeek: true as const,
      weekNum: w,
      year: value.year,
      month: value.month,
    }))
  }
  if (mode === 'quarter' && value.year && value.quarter) {
    const startM = (value.quarter - 1) * 3 + 1
    return [0, 1, 2].map(i => {
      const m = startM + i
      const y = value.year!
      return {
        key: `${y}-${String(m).padStart(2, '0')}`,
        label: new Date(y, m - 1, 1).toLocaleString('default', { month: 'short', year: '2-digit' }),
      }
    })
  }
  if (mode === 'year' && value.year) {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => ({
      key: `${value.year}-${String(m).padStart(2, '0')}`,
      label: new Date(value.year!, m - 1, 1).toLocaleString('default', { month: 'short' }),
    }))
  }
  return []
}

function isInChartBucket(date: string, b: BucketMeta): boolean {
  if (b.isWeek) {
    const [iy, im, id] = date.split('-').map(Number)
    if (iy !== b.year || im !== b.month) return false
    const startDay = (b.weekNum! - 1) * 7 + 1
    const endDay = b.weekNum === 4 ? 31 : b.weekNum! * 7
    return id >= startDay && id <= endDay
  }
  return date.startsWith(b.key)
}

function periodSectionLabel(mode: PeriodMode, value: PeriodValue): string {
  if (mode === 'all') return 'All Time'
  if (mode === 'month' && value.year && value.month) {
    return new Date(value.year, value.month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
  }
  if (mode === 'quarter' && value.year && value.quarter) return `Q${value.quarter} ${value.year}`
  if (mode === 'year' && value.year) return String(value.year)
  return ''
}

function currentValue(mode: PeriodMode): PeriodValue {
  const now = new Date()
  if (mode === 'month') return { year: now.getFullYear(), month: now.getMonth() + 1 }
  if (mode === 'quarter') return { year: now.getFullYear(), quarter: Math.ceil((now.getMonth() + 1) / 3) }
  if (mode === 'year') return { year: now.getFullYear() }
  return {}
}

export default function Reports() {
  const [tab, setTab] = useState<Tab>('cashflow')
  const [mode, setMode] = useState<PeriodMode>('all')
  const [periodValue, setPeriodValue] = useState<PeriodValue>({})

  const sankeyRef = useRef<HTMLDivElement>(null)
  const [sankeyWidth, setSankeyWidth] = useState(700)

  useEffect(() => {
    const el = sankeyRef.current
    if (!el) return
    setSankeyWidth(el.clientWidth)
    const observer = new ResizeObserver(entries => {
      setSankeyWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const expenses = useStore(s => s.expenses)
  const paychecks = useStore(s => s.paychecks)
  const transfers = useStore(s => s.transfers)
  const debtPayments = useStore(s => s.debtPayments)
  const investmentMovements = useStore(s => s.investmentMovements)
  const expenseCategories = useStore(s => s.settings.expenseCategories)

  // Filter all data to selected period
  const fExpenses = useMemo(() => filterByPeriod(expenses, mode, periodValue), [expenses, mode, periodValue])
  const fPaychecks = useMemo(() => filterByPeriod(paychecks, mode, periodValue), [paychecks, mode, periodValue])
  const fTransfers = useMemo(() => filterByPeriod(transfers, mode, periodValue), [transfers, mode, periodValue])
  const fDebt = useMemo(() => filterByPeriod(debtPayments, mode, periodValue), [debtPayments, mode, periodValue])
  const fInvestments = useMemo(() => filterByPeriod(investmentMovements, mode, periodValue), [investmentMovements, mode, periodValue])

  // KPI strip — totals of filtered data
  const kpiIncome = fPaychecks.reduce((s, p) => s + p.mxnAmount, 0) + fTransfers.reduce((s, t) => s + t.amount, 0)
  const kpiExpenses = fExpenses.reduce((s, e) => s + e.amount, 0)
  const kpiDebt = fDebt.reduce((s, d) => s + d.amount, 0)
  const kpiSavings = Math.max(0, kpiIncome - kpiDebt)
  const kpiSavingsRate = kpiIncome > 0 ? Math.min(100, (kpiSavings / kpiIncome) * 100) : 0

  // Chart bucket keys (sub-periods)
  const allDates = useMemo(() => [
    ...fPaychecks.map(p => p.date),
    ...fExpenses.map(e => e.date),
    ...fTransfers.map(t => t.date),
  ], [fPaychecks, fExpenses, fTransfers])

  const chartKeys = useMemo(() => buildChartKeys(mode, periodValue, allDates), [mode, periodValue, allDates])

  // Bucket data for Cash Flow charts + table
  const buckets = useMemo((): BucketData[] => {
    return chartKeys.map(b => {
      const inc =
        fPaychecks.filter(p => isInChartBucket(p.date, b)).reduce((s, p) => s + p.mxnAmount, 0) +
        fTransfers.filter(t => isInChartBucket(t.date, b)).reduce((s, t) => s + t.amount, 0)
      const exp = fExpenses.filter(e => isInChartBucket(e.date, b)).reduce((s, e) => s + e.amount, 0)
      const debt = fDebt.filter(d => isInChartBucket(d.date, b)).reduce((s, d) => s + d.amount, 0)
      const savings = Math.max(0, inc - debt)
      const savingsRate = inc > 0 ? Math.min(100, (savings / inc) * 100) : 0
      return { ...b, income: inc, expenses: exp, debt, savings, savingsRate }
    })
  }, [chartKeys, fPaychecks, fTransfers, fExpenses, fDebt])

  // Sankey — filtered period totals
  const sankeyData = useMemo(() => {
    const paycheckTotal = fPaychecks.reduce((s, p) => s + p.mxnAmount, 0)
    const transferTotal = fTransfers.reduce((s, t) => s + t.amount, 0)
    const totalIncome = paycheckTotal + transferTotal
    if (totalIncome === 0) return { nodes: [], links: [] }

    const debtTotal = fDebt.reduce((s, d) => s + d.amount, 0)
    const investTotal = fInvestments.filter(m => m.type === 'DEPOSIT').reduce((s, m) => s + m.amount, 0)
    const savingsTotal = Math.max(0, totalIncome - debtTotal - investTotal)

    const pp = paycheckTotal / totalIncome
    const tp = 1 - pp

    const dests = [
      { name: 'Savings', total: savingsTotal },
      { name: 'Debt', total: debtTotal },
      { name: 'Investments', total: investTotal },
    ]

    const nodes = [{ name: 'Paycheck' }, { name: 'Transfers' }, ...dests.map(d => ({ name: d.name }))]
    const links: { source: number; target: number; value: number }[] = []
    dests.forEach((dest, di) => {
      const ti = di + 2
      const v1 = Math.round(dest.total * pp)
      const v2 = Math.round(dest.total * tp)
      if (v1 > 0) links.push({ source: 0, target: ti, value: v1 })
      if (v2 > 0) links.push({ source: 1, target: ti, value: v2 })
    })

    return { nodes, links }
  }, [fPaychecks, fTransfers, fDebt, fInvestments])

  // Area chart data
  const cashFlowChartData = useMemo(() =>
    buckets.map(b => ({ name: b.label, Income: b.income, Expenses: b.expenses, Debt: b.debt })),
    [buckets]
  )

  const incomeChartData = useMemo(() =>
    chartKeys.map(b => ({
      name: b.label,
      Paycheck: fPaychecks.filter(p => isInChartBucket(p.date, b)).reduce((s, p) => s + p.mxnAmount, 0),
      Transfers: fTransfers.filter(t => isInChartBucket(t.date, b)).reduce((s, t) => s + t.amount, 0),
    })),
    [chartKeys, fPaychecks, fTransfers]
  )

  const outflowChartData = useMemo(() =>
    buckets.map(b => ({ name: b.label, Income: b.income, Outflow: b.debt })),
    [buckets]
  )

  // Category stacked chart
  const categoryBuckets = useMemo((): StackedBucketRow[] => {
    return chartKeys.map(b => {
      const row: StackedBucketRow = { label: b.label }
      expenseCategories.forEach(cat => {
        row[cat.name] = fExpenses
          .filter(e => e.category === cat.id && isInChartBucket(e.date, b))
          .reduce((s, e) => s + e.amount, 0)
      })
      return row
    })
  }, [chartKeys, fExpenses, expenseCategories])

  // By-category panel — totals within filtered period
  const categoryTotals = useMemo(() =>
    expenseCategories
      .map(cat => ({ ...cat, total: fExpenses.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0) }))
      .filter(c => c.total > 0)
      .sort((a, b) => b.total - a.total),
    [fExpenses, expenseCategories]
  )

  // Donut — filtered period totals
  const donutData = useMemo(() =>
    expenseCategories
      .map(cat => ({
        name: cat.name,
        value: fExpenses.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
        color: cat.color,
      }))
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value),
    [fExpenses, expenseCategories]
  )

  const stackedCategories = expenseCategories
    .filter(cat => categoryBuckets.some(b => (b[cat.name] as number) > 0))
    .map(cat => ({ name: cat.name, color: cat.color }))

  const sectionLabel = periodSectionLabel(mode, periodValue)
  const maxCatTotal = categoryTotals[0]?.total ?? 1

  const TABS: { key: Tab; label: string }[] = [
    { key: 'cashflow', label: 'Cash Flow' },
    { key: 'spending', label: 'Spending' },
    { key: 'income', label: 'Income' },
  ]

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <h1 className="text-[20px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">Reports</h1>
        <PeriodSelector
          mode={mode}
          value={periodValue}
          modes={['all', 'month', 'quarter', 'year']}
          onChange={(newMode, newValue) => {
            setMode(newMode)
            setPeriodValue(newMode === 'all' ? {} : (newValue ?? currentValue(newMode)))
          }}
        />
      </div>

      {/* KPI Strip */}
      <div className={`${CARD} flex divide-x divide-[#e8e8e8] dark:divide-[#2d3347] mb-5`}>
        {[
          { label: 'TOTAL INCOME', value: formatMXNCompact(kpiIncome), color: '#22c55e' },
          { label: 'EXPENSES', value: formatMXNCompact(kpiExpenses), color: '#ef4444' },
          { label: 'NET CASH FLOW', value: formatMXNCompact(kpiSavings), color: kpiSavings >= 0 ? '#22c55e' : '#ef4444' },
          { label: 'SAVINGS RATE', value: `${kpiSavingsRate.toFixed(1)}%`, color: '#22c55e' },
        ].map(kpi => (
          <div key={kpi.label} className="flex-1 px-6 py-4">
            <div className="text-[11px] font-semibold tracking-wider text-[#9297a0] mb-1">{kpi.label}</div>
            <div className="text-[22px] font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e8e8e8] dark:border-[#2d3347] mb-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-[14px] font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-[#181d26] dark:border-[#e8eaf0] text-[#181d26] dark:text-[#e8eaf0]'
                : 'border-transparent text-[#6b7280] hover:text-[#374151] dark:hover:text-[#9297a0]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Cash Flow Tab */}
      {tab === 'cashflow' && (
        <div className="space-y-5">
          <div className={CARD}>
            <div className="p-5">
              <div className={SECTION_LABEL}>Cash Flow — {sectionLabel}</div>
              <div ref={sankeyRef} className="w-full overflow-hidden">
                {sankeyData.nodes.length > 0 ? (
                  <Sankey
                    width={sankeyWidth}
                    height={340}
                    data={sankeyData}
                    nodeWidth={15}
                    nodePadding={14}
                    iterations={0}
                    margin={{ top: 10, right: 130, left: 100, bottom: 10 }}
                    node={(props: NodeProps) => <SankeyNodeRenderer {...props} />}
                    link={(props: LinkProps) => <SankeyLinkRenderer {...props} />}
                  />
                ) : (
                  <p className="text-[13px] text-[#9297a0] py-8 text-center">No data for this period</p>
                )}
              </div>
            </div>
          </div>

          <div className={CARD}>
            <div className="p-5">
              <div className={SECTION_LABEL}>Income vs Debt Payments — {sectionLabel}</div>
              {buckets.length > 0 ? (
                <AreaChart
                  data={cashFlowChartData}
                  xKey="name"
                  areas={[
                    { key: 'Income', name: 'Income', color: '#22c55e' },
                    { key: 'Expenses', name: 'Expenses', color: '#ef4444' },
                    { key: 'Debt', name: 'Debt Payments', color: '#f97316' },
                  ]}
                  height={280}
                />
              ) : (
                <p className="text-[13px] text-[#9297a0] py-8 text-center">No data for this period</p>
              )}
            </div>
          </div>

          <div className={CARD}>
            <div className="p-5">
              <div className={SECTION_LABEL}>Summary — {sectionLabel}</div>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#e8e8e8] dark:border-[#2d3347]">
                    {['Period', 'Income', 'Expenses', 'Debt Payments', 'Net', 'Savings Rate'].map(col => (
                      <th key={col} className="text-left pb-2.5 pr-4 text-[11px] font-semibold text-[#9297a0] uppercase tracking-wide">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...buckets].reverse().map(b => (
                    <tr key={b.key} className="border-b border-[#f4f5f7] dark:border-[#252a38] last:border-0">
                      <td className="py-3 pr-4 font-medium text-[#181d26] dark:text-[#e8eaf0]">{b.label}</td>
                      <td className="py-3 pr-4 font-medium text-[#22c55e]">{formatMXNCompact(b.income)}</td>
                      <td className="py-3 pr-4 font-medium text-[#ef4444]">{formatMXNCompact(b.expenses)}</td>
                      <td className="py-3 pr-4 font-medium text-[#f97316]">{formatMXNCompact(b.debt)}</td>
                      <td className={`py-3 pr-4 font-semibold ${b.savings >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                        {b.savings >= 0 ? '+' : ''}{formatMXNCompact(b.savings)}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#f4f5f7] dark:bg-[#252a38] rounded-full overflow-hidden max-w-[72px]">
                            <div className="h-full bg-[#22c55e] rounded-full" style={{ width: `${b.savingsRate}%` }} />
                          </div>
                          <span className="text-[12px] text-[#374151] dark:text-[#9297a0] w-8">{b.savingsRate.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {buckets.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[13px] text-[#9297a0]">No data for this period</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Spending Tab */}
      {tab === 'spending' && (
        <div className="space-y-5">
          <div className={CARD}>
            <div className="p-5">
              <div className={SECTION_LABEL}>Spending by Category — {sectionLabel}</div>
              {donutData.length > 0 ? (
                <DonutChart
                  data={donutData}
                  centerLabel="Expenses"
                  centerValue={formatMXNCompact(kpiExpenses)}
                  height={220}
                />
              ) : (
                <p className="text-[13px] text-[#9297a0] py-8 text-center">No expenses for this period</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div className={`${CARD} col-span-2`}>
              <div className="p-5">
                <div className={SECTION_LABEL}>Stacked by {mode === 'month' ? 'Week' : mode === 'quarter' ? 'Month' : mode === 'year' ? 'Month' : 'Month'}</div>
                {stackedCategories.length > 0 ? (
                  <StackedBarChart
                    data={categoryBuckets}
                    xKey="label"
                    categories={stackedCategories}
                    height={240}
                  />
                ) : (
                  <p className="text-[13px] text-[#9297a0] py-8 text-center">No data for this period</p>
                )}
              </div>
            </div>

            <div className={CARD}>
              <div className="p-5">
                <div className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0] mb-4">
                  By Category — {sectionLabel}
                </div>
                {categoryTotals.length === 0 ? (
                  <p className="text-[12px] text-[#9297a0]">No expenses for this period</p>
                ) : (
                  <div className="space-y-3">
                    {categoryTotals.map(cat => (
                      <div key={cat.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className="text-[12px] text-[#374151] dark:text-[#9297a0] truncate">{cat.name}</span>
                          </div>
                          <span className="text-[12px] font-semibold text-[#181d26] dark:text-[#e8eaf0] ml-2 flex-shrink-0">
                            {formatMXNCompact(cat.total)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#f4f5f7] dark:bg-[#252a38] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(cat.total / maxCatTotal) * 100}%`, backgroundColor: cat.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Income Tab */}
      {tab === 'income' && (
        <div className="space-y-5">
          <div className={CARD}>
            <div className="p-5">
              <div className={SECTION_LABEL}>Income Sources — {sectionLabel}</div>
              {incomeChartData.length > 0 ? (
                <AreaChart
                  data={incomeChartData}
                  xKey="name"
                  areas={[
                    { key: 'Paycheck', name: 'Paycheck', color: '#22c55e' },
                    { key: 'Transfers', name: 'Transfers', color: '#3b82f6' },
                  ]}
                  height={280}
                />
              ) : (
                <p className="text-[13px] text-[#9297a0] py-8 text-center">No data for this period</p>
              )}
            </div>
          </div>

          <div className={CARD}>
            <div className="p-5">
              <div className={SECTION_LABEL}>Income vs Outflow — {sectionLabel}</div>
              {outflowChartData.length > 0 ? (
                <AreaChart
                  data={outflowChartData}
                  xKey="name"
                  areas={[
                    { key: 'Income', name: 'Income', color: '#22c55e' },
                    { key: 'Outflow', name: 'Outflow', color: '#ef4444' },
                  ]}
                  height={280}
                />
              ) : (
                <p className="text-[13px] text-[#9297a0] py-8 text-center">No data for this period</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
