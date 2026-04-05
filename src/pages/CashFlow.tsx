import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, BarChart2 } from 'lucide-react'
import { useStore } from '../store'
import KpiCard from '../components/ui/KpiCard'
import PeriodSelector from '../components/ui/PeriodSelector'
import LineChart from '../components/charts/LineChart'
import BarChart from '../components/charts/BarChart'
import DonutChart from '../components/charts/DonutChart'
import { filterByPeriod, getMonthsInRange, type PeriodMode, type PeriodValue } from '../lib/filters'
import { formatMXN, formatMXNCompact } from '../lib/formatters'

function now() {
  const d = new Date()
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

export default function CashFlow() {
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month')
  const [periodValue, setPeriodValue] = useState<PeriodValue>(now())
  const [compA, setCompA] = useState<PeriodValue>(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  })
  const [compB, setCompB] = useState<PeriodValue>(now())

  const expenses = useStore((s) => s.expenses)
  const paychecks = useStore((s) => s.paychecks)
  const transfers = useStore((s) => s.transfers)
  const debtPayments = useStore((s) => s.debtPayments)
  const investmentMovements = useStore((s) => s.investmentMovements)
  const categories = useStore((s) => s.settings.expenseCategories)

  const filteredPaychecks = filterByPeriod(paychecks, periodMode, periodValue)
  const filteredTransfers = filterByPeriod(transfers, periodMode, periodValue)
  const filteredExpenses = filterByPeriod(expenses, periodMode, periodValue)
  const filteredMovements = filterByPeriod(investmentMovements, periodMode, periodValue)

  const totalIncome = filteredPaychecks.reduce((s, p) => s + p.mxnAmount, 0) +
    filteredTransfers.reduce((s, t) => s + t.amount, 0)
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0)
  const totalGains = filteredMovements.filter((m) => m.type === 'GAIN').reduce((s, m) => s + m.amount, 0)
  const totalDeposits = filteredMovements.filter((m) => m.type === 'DEPOSIT').reduce((s, m) => s + m.amount, 0)

  // Last 6 months multi-line data
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
      const inc = filterByPeriod(paychecks, 'month', val).reduce((s, p) => s + p.mxnAmount, 0) +
        filterByPeriod(transfers, 'month', val).reduce((s, t) => s + t.amount, 0)
      const exp = filterByPeriod(expenses, 'month', val).reduce((s, e) => s + e.amount, 0)
      const gains = filterByPeriod(investmentMovements, 'month', val).filter((m2) => m2.type === 'GAIN').reduce((s, m2) => s + m2.amount, 0)
      const deposits = filterByPeriod(investmentMovements, 'month', val).filter((m2) => m2.type === 'DEPOSIT').reduce((s, m2) => s + m2.amount, 0)
      const label = new Date(y, m - 1).toLocaleString('en-US', { month: 'short' })
      return { month: label, Income: inc, Expenses: exp, Gains: gains, Deposits: deposits }
    })
  }, [months6, paychecks, transfers, expenses, investmentMovements])

  // Expense donut
  const donutData = useMemo(() => {
    const catTotals: Record<string, number> = {}
    filteredExpenses.forEach((e) => {
      catTotals[e.category] = (catTotals[e.category] ?? 0) + e.amount
    })
    return categories
      .filter((c) => (catTotals[c.id] ?? 0) > 0)
      .map((c) => ({ name: c.name, value: catTotals[c.id] ?? 0, color: c.color }))
      .sort((a, b) => b.value - a.value)
  }, [filteredExpenses, categories])

  // Analysis table: last 6 months
  const tableMonths = months6
  const tableData = tableMonths.map((month) => {
    const [y, m] = month.split('-').map(Number)
    const val: PeriodValue = { year: y, month: m }
    const inc = filterByPeriod(paychecks, 'month', val).reduce((s, p) => s + p.mxnAmount, 0) +
      filterByPeriod(transfers, 'month', val).reduce((s, t) => s + t.amount, 0)
    const exp = filterByPeriod(expenses, 'month', val).reduce((s, e) => s + e.amount, 0)
    const debt = filterByPeriod(debtPayments, 'month', val).reduce((s, d) => s + d.amount, 0)
    const trnAmount = filterByPeriod(transfers, 'month', val).reduce((s, t) => s + t.amount, 0)
    const net = inc - debt
    const label = new Date(y, m - 1).toLocaleString('en-US', { month: 'short', year: '2-digit' })
    return { label, inc, trnAmount, exp, debt, net }
  })

  // Comparison
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

  // Quick insight
  const bestMetric = compMetrics.reduce((best, m) => {
    const diff = (metricsB[m] ?? 0) - (metricsA[m] ?? 0)
    const bestDiff = (metricsB[best] ?? 0) - (metricsA[best] ?? 0)
    return Math.abs(diff) > Math.abs(bestDiff) ? m : best
  }, compMetrics[0])
  const diff = (metricsB[bestMetric] ?? 0) - (metricsA[bestMetric] ?? 0)
  const insight = `${bestMetric} ${diff >= 0 ? 'increased' : 'decreased'} by ${formatMXN(Math.abs(diff))} from ${monthNames[(compA.month ?? 1) - 1]} to ${monthNames[(compB.month ?? 1) - 1]}.`

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Overview</h2>
        <PeriodSelector mode={periodMode} value={periodValue} onChange={(m, v) => { setPeriodMode(m); setPeriodValue(v) }} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Total Income"
          value={formatMXNCompact(totalIncome)}
          icon={<TrendingUp className="w-5 h-5" />}
          accent="#22C55E"
        />
        <KpiCard
          title="Total Expenses"
          value={formatMXNCompact(totalExpenses)}
          icon={<TrendingDown className="w-5 h-5" />}
          accent="#EF4444"
        />
        <KpiCard
          title="Investment Returns"
          value={formatMXNCompact(totalGains)}
          subtitle={`Deposits: ${formatMXNCompact(totalDeposits)}`}
          icon={<BarChart2 className="w-5 h-5" />}
          accent="#6B3FA0"
        />
      </div>

      {/* Financial Performance chart */}
      <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
          Financial Performance (Last 6 Months)
        </p>
        <LineChart
          data={chartData}
          lines={[
            { key: 'Income', color: '#22C55E', name: 'Income' },
            { key: 'Expenses', color: '#EF4444', name: 'Expenses' },
            { key: 'Deposits', color: '#3B82F6', name: 'Deposits' },
            { key: 'Gains', color: '#6B3FA0', name: 'Gains' },
          ]}
          xKey="month"
          height={280}
        />
      </div>

      {/* Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Expense Mix
          </p>
          {donutData.length > 0 ? (
            <DonutChart
              data={donutData}
              centerLabel="Total"
              centerValue={formatMXNCompact(totalExpenses)}
              height={200}
            />
          ) : (
            <p className="text-sm text-gray-400 py-8 text-center">No expenses in this period</p>
          )}
        </div>

        {/* Analysis Table */}
        <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm overflow-x-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Cash Flow Analysis
          </p>
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400">
                <th className="text-left pb-2 font-medium">Month</th>
                <th className="text-right pb-2 font-medium">Income</th>
                <th className="text-right pb-2 font-medium">Expenses</th>
                <th className="text-right pb-2 font-medium">Debt</th>
                <th className="text-right pb-2 font-medium">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2D3448]">
              {[...tableData].reverse().map((row) => (
                <tr key={row.label}>
                  <td className="py-2 text-gray-700 dark:text-gray-300 font-medium">{row.label}</td>
                  <td className="py-2 text-right text-green-600">{formatMXNCompact(row.inc)}</td>
                  <td className="py-2 text-right text-red-500">{formatMXNCompact(row.exp)}</td>
                  <td className="py-2 text-right text-amber-500">{formatMXNCompact(row.debt)}</td>
                  <td className="py-2 text-right font-semibold" style={{ color: row.net >= 0 ? '#22C55E' : '#EF4444' }}>
                    {formatMXNCompact(row.net)}
                  </td>
                </tr>
              ))}
              <tr className="font-bold border-t-2 border-gray-200 dark:border-[#2D3448]">
                <td className="py-2 text-gray-900 dark:text-white">TOTAL</td>
                <td className="py-2 text-right text-green-600">{formatMXNCompact(tableData.reduce((s, r) => s + r.inc, 0))}</td>
                <td className="py-2 text-right text-red-500">{formatMXNCompact(tableData.reduce((s, r) => s + r.exp, 0))}</td>
                <td className="py-2 text-right text-amber-500">{formatMXNCompact(tableData.reduce((s, r) => s + r.debt, 0))}</td>
                <td className="py-2 text-right text-[#6B3FA0]">{formatMXNCompact(tableData.reduce((s, r) => s + r.net, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison Tool */}
      <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
          Period Comparison Tool
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Period A</p>
            <PeriodSelector
              mode="month"
              value={compA}
              onChange={(_, v) => setCompA(v)}
              modes={['month']}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Period B</p>
            <PeriodSelector
              mode="month"
              value={compB}
              onChange={(_, v) => setCompB(v)}
              modes={['month']}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400">
                <th className="text-left pb-2 font-medium">Metric</th>
                <th className="text-right pb-2 font-medium">{monthNames[(compA.month ?? 1) - 1]}</th>
                <th className="text-right pb-2 font-medium">{monthNames[(compB.month ?? 1) - 1]}</th>
                <th className="text-right pb-2 font-medium">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2D3448]">
              {compMetrics.map((metric) => {
                const a = metricsA[metric] ?? 0
                const b = metricsB[metric] ?? 0
                const variance = b - a
                return (
                  <tr key={metric}>
                    <td className="py-2 text-gray-700 dark:text-gray-300">{metric}</td>
                    <td className="py-2 text-right text-gray-900 dark:text-white">{formatMXN(a)}</td>
                    <td className="py-2 text-right text-gray-900 dark:text-white">{formatMXN(b)}</td>
                    <td className="py-2 text-right font-semibold" style={{ color: variance >= 0 ? '#22C55E' : '#EF4444' }}>
                      {variance >= 0 ? '+' : ''}{formatMXN(variance)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
          <p className="text-xs font-semibold text-[#6B3FA0] uppercase mb-1">Quick Insight</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{insight}</p>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Visual Comparison</p>
          <BarChart
            data={[
              { metric: 'Income',    A: metricsA.Income,    B: metricsB.Income },
              { metric: 'Transfers', A: metricsA.Transfers,  B: metricsB.Transfers },
              { metric: 'Expenses',  A: metricsA.Expenses,  B: metricsB.Expenses },
              { metric: 'Debt Pay',  A: metricsA.Debt,      B: metricsB.Debt },
              { metric: 'Net Flow',  A: metricsA['Net Flow'], B: metricsB['Net Flow'] },
            ]}
            bars={[
              { key: 'A', color: '#6B3FA0', name: monthNames[(compA.month ?? 1) - 1] },
              { key: 'B', color: '#94A3B8', name: monthNames[(compB.month ?? 1) - 1] },
            ]}
            xKey="metric"
            height={220}
          />
        </div>
      </div>
    </div>
  )
}
