import { useState, useMemo, useRef, useEffect } from 'react'
import { Lightbulb } from 'lucide-react'
import { Sankey } from 'recharts'
import type { NodeProps, LinkProps } from 'recharts/types/chart/Sankey'
import { useStore } from '../store'
import AreaChart from '../components/charts/AreaChart'
import BarChart from '../components/charts/BarChart'
import PeriodSelector from '../components/ui/PeriodSelector'
import { filterByPeriod, type PeriodValue } from '../lib/filters'
import { formatMXN, formatMXNCompact } from '../lib/formatters'
import { usePeriodFilter } from '../hooks/usePeriodFilter'

const CARD = 'bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px]'
const SECTION_LABEL = 'text-[11px] font-semibold tracking-wider text-[#9297a0] uppercase mb-4'

const NODE_COLORS = ['#22c55e', '#3b82f6', '#10b981', '#f97316', '#8b5cf6']
const TARGET_COLORS: Record<string, string> = {
  Savings: '#10b981',
  Debt: '#f97316',
  Investments: '#8b5cf6',
}

type ChartView = 'bar' | 'sankey'

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

export default function CashFlow() {
  const [chartView, setChartView] = useState<ChartView>('bar')
  const [compA, setCompA] = useState<PeriodValue>(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  })
  const [compB, setCompB] = useState<PeriodValue>(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  })

  const sankeyRef = useRef<HTMLDivElement>(null)
  const [sankeyWidth, setSankeyWidth] = useState(700)
  useEffect(() => {
    const el = sankeyRef.current
    if (!el) return
    setSankeyWidth(el.clientWidth)
    const observer = new ResizeObserver((entries) => setSankeyWidth(entries[0].contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const expenses = useStore((s) => s.expenses)
  const paychecks = useStore((s) => s.paychecks)
  const transfers = useStore((s) => s.transfers)
  const debtPayments = useStore((s) => s.debtPayments)
  const investmentMovements = useStore((s) => s.investmentMovements)
  const categories = useStore((s) => s.settings.expenseCategories)

  const { mode: periodMode, value: periodValue, onChange: onPeriodChange, filtered: filteredExpenses } = usePeriodFilter(expenses)
  const filteredPaychecks = filterByPeriod(paychecks, periodMode, periodValue)
  const filteredTransfers = filterByPeriod(transfers, periodMode, periodValue)
  const filteredDebt = filterByPeriod(debtPayments, periodMode, periodValue)
  const filteredMovements = filterByPeriod(investmentMovements, periodMode, periodValue)

  const paycheckTotal = filteredPaychecks.reduce((s, p) => s + p.mxnAmount, 0)
  const transferTotal = filteredTransfers.reduce((s, t) => s + t.amount, 0)
  const totalIncome = paycheckTotal + transferTotal
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0)
  const totalDebt = filteredDebt.reduce((s, d) => s + d.amount, 0)
  const totalInvestDeposits = filteredMovements.filter((m) => m.type === 'DEPOSIT').reduce((s, m) => s + m.amount, 0)
  const totalSavings = Math.max(0, totalIncome - totalDebt - totalInvestDeposits)
  const savingsRate = totalIncome > 0 ? Math.min(100, (totalSavings / totalIncome) * 100) : 0

  // Last 6 months keys
  const months6 = useMemo(() => {
    const result: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    return result
  }, [])

  const chartData = useMemo(() => {
    return months6.map((month) => {
      const [y, m] = month.split('-').map(Number)
      const val: PeriodValue = { year: y, month: m }
      const paycheckInc = filterByPeriod(paychecks, 'month', val).reduce((s, p) => s + p.mxnAmount, 0)
      const trnAmount = filterByPeriod(transfers, 'month', val).reduce((s, t) => s + t.amount, 0)
      const exp = filterByPeriod(expenses, 'month', val).reduce((s, e) => s + e.amount, 0)
      const debt = filterByPeriod(debtPayments, 'month', val).reduce((s, d) => s + d.amount, 0)
      const label = new Date(y, m - 1).toLocaleString('en-US', { month: 'short' })
      return { month: label, Paychecks: paycheckInc, Transfers: trnAmount, Expenses: exp, Debt: debt }
    })
  }, [months6, paychecks, transfers, expenses, debtPayments])

  const donutData = useMemo(() => {
    const catTotals: Record<string, number> = {}
    filteredExpenses.forEach((e) => { catTotals[e.category] = (catTotals[e.category] ?? 0) + e.amount })
    return categories
      .filter((c) => (catTotals[c.id] ?? 0) > 0)
      .map((c) => ({ name: c.name, value: catTotals[c.id] ?? 0, color: c.color }))
      .sort((a, b) => b.value - a.value)
  }, [filteredExpenses, categories])

  const tableData = months6.map((month) => {
    const [y, m] = month.split('-').map(Number)
    const val: PeriodValue = { year: y, month: m }
    const inc = filterByPeriod(paychecks, 'month', val).reduce((s, p) => s + p.mxnAmount, 0)
      + filterByPeriod(transfers, 'month', val).reduce((s, t) => s + t.amount, 0)
    const exp = filterByPeriod(expenses, 'month', val).reduce((s, e) => s + e.amount, 0)
    const debt = filterByPeriod(debtPayments, 'month', val).reduce((s, d) => s + d.amount, 0)
    const net = inc - debt
    const label = new Date(y, m - 1).toLocaleString('en-US', { month: 'short', year: '2-digit' })
    return { label, inc, exp, debt, net }
  })

  const sankeyData = useMemo(() => {
    if (totalIncome === 0) return { nodes: [], links: [] }
    const debtTotal = totalDebt
    const investTotal = totalInvestDeposits
    const savingsTotal = Math.max(0, totalIncome - debtTotal - investTotal)
    const pp = paycheckTotal / totalIncome
    const tp = 1 - pp
    const dests = [
      { name: 'Savings', total: savingsTotal },
      { name: 'Debt', total: debtTotal },
      { name: 'Investments', total: investTotal },
    ]
    const nodes = [{ name: 'Paycheck' }, { name: 'Transfers' }, ...dests.map((d) => ({ name: d.name }))]
    const links: { source: number; target: number; value: number }[] = []
    dests.forEach((dest, di) => {
      const ti = di + 2
      const v1 = Math.round(dest.total * pp)
      const v2 = Math.round(dest.total * tp)
      if (v1 > 0) links.push({ source: 0, target: ti, value: v1 })
      if (v2 > 0) links.push({ source: 1, target: ti, value: v2 })
    })
    return { nodes, links }
  }, [totalIncome, totalDebt, totalInvestDeposits, paycheckTotal])

  // Period comparison
  function getMetrics(val: PeriodValue) {
    const paycheckInc = filterByPeriod(paychecks, 'month', val).reduce((s, p) => s + p.mxnAmount, 0)
    const trnAmount = filterByPeriod(transfers, 'month', val).reduce((s, t) => s + t.amount, 0)
    const inc = paycheckInc + trnAmount
    const exp = filterByPeriod(expenses, 'month', val).reduce((s, e) => s + e.amount, 0)
    const debt = filterByPeriod(debtPayments, 'month', val).reduce((s, d) => s + d.amount, 0)
    const net = inc - debt
    return { Income: inc, Transfers: trnAmount, Expenses: exp, Debt: debt, 'Net Flow': net }
  }

  const metricsA = getMetrics(compA)
  const metricsB = getMetrics(compB)
  const compMetrics = ['Income', 'Expenses', 'Debt', 'Net Flow'] as const

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  const bestMetric = compMetrics.reduce((best, m) => {
    const diff = (metricsB[m] ?? 0) - (metricsA[m] ?? 0)
    const bestDiff = (metricsB[best] ?? 0) - (metricsA[best] ?? 0)
    return Math.abs(diff) > Math.abs(bestDiff) ? m : best
  }, compMetrics[0])
  const diff = (metricsB[bestMetric] ?? 0) - (metricsA[bestMetric] ?? 0)
  const insight = `${bestMetric} ${diff >= 0 ? 'increased' : 'decreased'} by ${formatMXN(Math.abs(diff))} from ${monthNames[(compA.month ?? 1) - 1]} to ${monthNames[(compB.month ?? 1) - 1]}.`

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <h1 className="text-[20px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">Cash Flow</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <PeriodSelector mode={periodMode} value={periodValue} onChange={onPeriodChange} />
          {/* Chart view toggle */}
          <div className="flex border border-[#e8e8e8] dark:border-[#2d3347] rounded-[8px] overflow-hidden">
            {(['bar', 'sankey'] as ChartView[]).map((view) => (
              <button
                key={view}
                onClick={() => setChartView(view)}
                className={`px-3 py-2 text-[13px] font-medium transition-colors ${
                  chartView === view
                    ? 'bg-[#181d26] dark:bg-[#e8eaf0] text-white dark:text-[#181d26]'
                    : 'text-[#41454d] dark:text-[#9297a0] hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]'
                }`}
              >
                {view === 'bar' ? 'Bar Chart' : 'Sankey Diagram'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className={`${CARD} flex divide-x divide-[#e8e8e8] dark:divide-[#2d3347] mb-5`}>
        {[
          { label: 'INCOME', value: formatMXNCompact(totalIncome), color: '#22c55e' },
          { label: 'EXPENSES', value: formatMXNCompact(totalExpenses), color: '#ef4444' },
          { label: 'TOTAL SAVINGS', value: formatMXNCompact(totalSavings), color: totalSavings >= 0 ? '#22c55e' : '#ef4444' },
          { label: 'SAVINGS RATE', value: `${savingsRate.toFixed(1)}%`, color: '#22c55e' },
        ].map((kpi) => (
          <div key={kpi.label} className="flex-1 px-6 py-4">
            <div className="text-[22px] font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-[11px] font-semibold tracking-wider text-[#9297a0] mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Bar Chart view */}
      {chartView === 'bar' && (
        <div className="space-y-5">
          {/* Area chart */}
          <div className={CARD}>
            <div className="p-5">
              <div className={SECTION_LABEL}>Paychecks · Transfers · Expenses · Debt</div>
              {chartData.some((d) => d.Paychecks > 0 || d.Transfers > 0 || d.Expenses > 0 || d.Debt > 0) ? (
                <AreaChart
                  data={chartData}
                  xKey="month"
                  areas={[
                    { key: 'Paychecks', name: 'Paychecks', color: '#22c55e' },
                    { key: 'Transfers', name: 'Transfers', color: '#3b82f6' },
                    { key: 'Expenses', name: 'Expenses', color: '#ef4444' },
                    { key: 'Debt', name: 'Debt', color: '#f97316' },
                  ]}
                  height={260}
                />
              ) : (
                <p className="text-[13px] text-[#9297a0] py-8 text-center">No data for the last 6 months</p>
              )}
            </div>
          </div>

          {/* Income + Expenses breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Income breakdown */}
            <div className={CARD}>
              <div className="p-5">
                <div className={SECTION_LABEL}>Income</div>
                <div className="space-y-2.5">
                  {[
                    { label: 'Paychecks', amount: paycheckTotal, color: '#22c55e' },
                    { label: 'Transfers', amount: transferTotal, color: '#3b82f6' },
                  ].map(({ label, amount, color }) => {
                    const pct = totalIncome > 0 ? (amount / totalIncome) * 100 : 0
                    return (
                      <div key={label} className="flex items-center gap-3">
                        <div className="relative flex-1 h-8 rounded-[6px] overflow-hidden bg-[#f4f5f7] dark:bg-[#252b3b]">
                          <div
                            className="absolute inset-y-0 left-0 rounded-[6px]"
                            style={{ width: `${Math.max(pct, 6)}%`, backgroundColor: `${color}33` }}
                          />
                          <span className="absolute inset-0 flex items-center px-3 text-[13px] font-semibold z-10" style={{ color }}>
                            {label}
                          </span>
                        </div>
                        <span className="text-[13px] font-bold w-16 text-right" style={{ color }}>{formatMXNCompact(amount)}</span>
                        <span className="text-[12px] text-[#9297a0] w-8 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    )
                  })}
                  {totalIncome === 0 && <p className="text-[13px] text-[#9297a0] text-center py-4">No income in this period</p>}
                </div>
              </div>
            </div>

            {/* Expenses breakdown */}
            <div className={CARD}>
              <div className="p-5">
                <div className={SECTION_LABEL}>Expenses</div>
                {donutData.length > 0 ? (
                  <div className="space-y-2.5">
                    {donutData.map((d) => {
                      const pct = totalExpenses > 0 ? (d.value / totalExpenses) * 100 : 0
                      return (
                        <div key={d.name} className="flex items-center gap-3">
                          <div className="relative flex-1 h-8 rounded-[6px] overflow-hidden bg-[#f4f5f7] dark:bg-[#252b3b]">
                            <div
                              className="absolute inset-y-0 left-0 rounded-[6px]"
                              style={{ width: `${Math.max(pct, 6)}%`, backgroundColor: `${d.color}33` }}
                            />
                            <span className="absolute inset-0 flex items-center px-3 text-[13px] font-semibold z-10 truncate" style={{ color: d.color }}>
                              {d.name}
                            </span>
                          </div>
                          <span className="text-[13px] font-bold w-16 text-right" style={{ color: d.color }}>{formatMXNCompact(d.value)}</span>
                          <span className="text-[12px] text-[#9297a0] w-8 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#9297a0] text-center py-4">No expenses in this period</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sankey view */}
      {chartView === 'sankey' && (
        <div className="space-y-5">
          {/* Sankey */}
          <div className={CARD}>
            <div className="p-5">
              <div className={SECTION_LABEL}>Sankey Diagram</div>
              <div ref={sankeyRef} className="w-full overflow-hidden">
                {sankeyData.nodes.length > 0 ? (
                  <Sankey
                    width={sankeyWidth}
                    height={320}
                    data={sankeyData}
                    nodeWidth={15}
                    nodePadding={14}
                    iterations={0}
                    margin={{ top: 10, right: 140, left: 110, bottom: 10 }}
                    node={(props: NodeProps) => <SankeyNodeRenderer {...props} />}
                    link={(props: LinkProps) => <SankeyLinkRenderer {...props} />}
                  />
                ) : (
                  <p className="text-[13px] text-[#9297a0] py-8 text-center">No data for this period</p>
                )}
              </div>
            </div>
          </div>

          {/* Cash Flow Analysis table */}
          <div className={CARD}>
            <div className="p-5 pb-0">
              <div className="text-[15px] font-semibold text-[#181d26] dark:text-[#e8eaf0] mb-4">Cash Flow Analysis</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Month', 'Income', 'Expenses', 'Debt', 'Net'].map((h, i) => (
                      <th key={h} className={`text-[11px] font-semibold uppercase text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2.5 px-4 ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...tableData].reverse().map((row, i, arr) => {
                    const border = i < arr.length - 1 ? 'border-b border-[#f4f5f7] dark:border-[#252a38]' : ''
                    return (
                      <tr key={row.label} className="hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
                        <td className={`py-3 px-4 text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0] ${border}`}>{row.label}</td>
                        <td className={`py-3 px-4 text-right text-[13px] font-medium text-[#22c55e] ${border}`}>{formatMXNCompact(row.inc)}</td>
                        <td className={`py-3 px-4 text-right text-[13px] font-medium text-[#ef4444] ${border}`}>{formatMXNCompact(row.exp)}</td>
                        <td className={`py-3 px-4 text-right text-[13px] font-medium text-[#f97316] ${border}`}>{formatMXNCompact(row.debt)}</td>
                        <td className={`py-3 px-4 text-right text-[13px] font-semibold ${border}`} style={{ color: row.net >= 0 ? '#22c55e' : '#ef4444' }}>
                          {row.net >= 0 ? '+' : ''}{formatMXNCompact(row.net)}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="border-t-2 border-[#e8e8e8] dark:border-[#2d3347]">
                    <td className="py-3 px-4 text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">Total</td>
                    <td className="py-3 px-4 text-right text-[13px] font-semibold text-[#22c55e]">{formatMXNCompact(tableData.reduce((s, r) => s + r.inc, 0))}</td>
                    <td className="py-3 px-4 text-right text-[13px] font-semibold text-[#ef4444]">{formatMXNCompact(tableData.reduce((s, r) => s + r.exp, 0))}</td>
                    <td className="py-3 px-4 text-right text-[13px] font-semibold text-[#f97316]">{formatMXNCompact(tableData.reduce((s, r) => s + r.debt, 0))}</td>
                    <td className="py-3 px-4 text-right text-[13px] font-semibold" style={{ color: tableData.reduce((s, r) => s + r.net, 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                      {formatMXNCompact(tableData.reduce((s, r) => s + r.net, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Period Comparison — always visible */}
      <div className={`${CARD} mt-5`}>
        <div className="p-5">
          <div className="text-[15px] font-semibold text-[#181d26] dark:text-[#e8eaf0] mb-4">Period Comparison</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-[12px] font-semibold text-[#9297a0] mb-2">Period A</p>
              <PeriodSelector mode="month" value={compA} onChange={(_, v) => setCompA(v)} modes={['month']} />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-[#9297a0] mb-2">Period B</p>
              <PeriodSelector mode="month" value={compB} onChange={(_, v) => setCompB(v)} modes={['month']} />
            </div>
          </div>

          <div className="overflow-x-auto mb-5">
            <table className="w-full">
              <thead>
                <tr>
                  {['Metric', monthNames[(compA.month ?? 1) - 1], monthNames[(compB.month ?? 1) - 1], 'Variance'].map((h, i) => (
                    <th key={h} className={`text-[11px] font-semibold uppercase text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2.5 px-4 ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compMetrics.map((metric, i) => {
                  const a = metricsA[metric] ?? 0
                  const b = metricsB[metric] ?? 0
                  const variance = b - a
                  const border = i < compMetrics.length - 1 ? 'border-b border-[#f4f5f7] dark:border-[#252a38]' : ''
                  return (
                    <tr key={metric} className="hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
                      <td className={`py-3 px-4 text-[13px] text-[#333840] dark:text-[#c4c8d0] ${border}`}>{metric}</td>
                      <td className={`py-3 px-4 text-right text-[13px] text-[#181d26] dark:text-[#e8eaf0] ${border}`}>{formatMXN(a)}</td>
                      <td className={`py-3 px-4 text-right text-[13px] text-[#181d26] dark:text-[#e8eaf0] ${border}`}>{formatMXN(b)}</td>
                      <td className={`py-3 px-4 text-right text-[13px] font-semibold ${border}`} style={{ color: variance >= 0 ? '#22c55e' : '#ef4444' }}>
                        {variance >= 0 ? '+' : ''}{formatMXN(variance)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-[#fffbeb] border border-[#f59e0b]/40 rounded-[8px] p-4 mb-5 flex gap-3">
            <Lightbulb className="w-4 h-4 text-[#c8912a] shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold uppercase text-[#c8912a] tracking-[0.4px] mb-1">Quick Insight</p>
              <p className="text-[13px] text-[#333840]">{insight}</p>
            </div>
          </div>

          <BarChart
            data={[
              { metric: 'Income',    A: metricsA.Income,       B: metricsB.Income },
              { metric: 'Transfers', A: metricsA.Transfers,    B: metricsB.Transfers },
              { metric: 'Expenses',  A: metricsA.Expenses,     B: metricsB.Expenses },
              { metric: 'Debt Pay',  A: metricsA.Debt,         B: metricsB.Debt },
              { metric: 'Net Flow',  A: metricsA['Net Flow'],  B: metricsB['Net Flow'] },
            ]}
            bars={[
              { key: 'A', color: '#3b82f6', name: monthNames[(compA.month ?? 1) - 1] },
              { key: 'B', color: '#f59e0b', name: monthNames[(compB.month ?? 1) - 1] },
            ]}
            xKey="metric"
            height={220}
          />
        </div>
      </div>

    </div>
  )
}
