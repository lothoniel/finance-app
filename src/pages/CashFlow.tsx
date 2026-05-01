import { useState, useMemo } from 'react'
import { Lightbulb } from 'lucide-react'
import { useStore } from '../store'
import HeroBand from '../components/ui/HeroBand'
import HeroKpi from '../components/ui/HeroKpi'
import PeriodTabs from '../components/ui/PeriodTabs'
import PeriodSelector from '../components/ui/PeriodSelector'
import SectionTitle from '../components/ui/SectionTitle'
import LineChart from '../components/charts/LineChart'
import BarChart from '../components/charts/BarChart'
import DonutChart from '../components/charts/DonutChart'
import { filterByPeriod, type PeriodValue } from '../lib/filters'
import { formatMXN, formatMXNCompact } from '../lib/formatters'
import { usePeriodFilter } from '../hooks/usePeriodFilter'

export default function CashFlow() {
  const [compA, setCompA] = useState<PeriodValue>(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  })
  const [compB, setCompB] = useState<PeriodValue>(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  })

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

  const totalIncome = filteredPaychecks.reduce((s, p) => s + p.mxnAmount, 0)
    + filteredTransfers.reduce((s, t) => s + t.amount, 0)
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0)
  const totalDebt = filteredDebt.reduce((s, d) => s + d.amount, 0)
  const totalGains = filteredMovements.filter((m) => m.type === 'GAIN').reduce((s, m) => s + m.amount, 0)
  const netFlow = totalIncome - totalExpenses - totalDebt

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
      const inc = filterByPeriod(paychecks, 'month', val).reduce((s, p) => s + p.mxnAmount, 0)
        + filterByPeriod(transfers, 'month', val).reduce((s, t) => s + t.amount, 0)
      const exp = filterByPeriod(expenses, 'month', val).reduce((s, e) => s + e.amount, 0)
      const gains = filterByPeriod(investmentMovements, 'month', val).filter((m2) => m2.type === 'GAIN').reduce((s, m2) => s + m2.amount, 0)
      const debt = filterByPeriod(debtPayments, 'month', val).reduce((s, d) => s + d.amount, 0)
      const label = new Date(y, m - 1).toLocaleString('en-US', { month: 'short' })
      return { month: label, Income: inc, Expenses: exp, Gains: gains, Debt: debt }
    })
  }, [months6, paychecks, transfers, expenses, investmentMovements])

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
    <div>
      <HeroBand color="#aa2d00">
        <div className="mb-6">
          <PeriodTabs mode={periodMode} value={periodValue} onChange={onPeriodChange} variant="light" />
        </div>
        <div className="flex gap-3 flex-wrap">
          <HeroKpi label="Total Income" value={formatMXN(totalIncome)} />
          <HeroKpi label="Total Expenses" value={formatMXN(totalExpenses)} />
          <HeroKpi label="Debt Payments" value={formatMXN(totalDebt)} />
          <HeroKpi label="Net Flow" value={formatMXN(netFlow)} />
        </div>
      </HeroBand>

      {/* Monthly Trend */}
      <div className="mb-8">
        <SectionTitle>Monthly Trend — Last 6 Months</SectionTitle>
        <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-5">
          <LineChart
            data={chartData}
            lines={[
              { key: 'Income', color: '#34a85a', name: 'Income' },
              { key: 'Expenses', color: '#e05a4e', name: 'Expenses' },
              { key: 'Debt', color: '#aa2d00', name: 'Debt' },
              { key: 'Gains', color: '#3aab85', name: 'Gains' },
            ]}
            xKey="month"
            height={280}
          />
        </div>
      </div>

      {/* Cash Flow Analysis + Expense Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] overflow-hidden">
          <p className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0] px-5 pt-5 pb-3">Cash Flow Analysis</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[380px]">
              <thead>
                <tr>
                  {['Month', 'Income', 'Expenses', 'Debt', 'Net'].map((h, i) => (
                    <th key={h} className={`text-[11px] font-semibold uppercase text-[#41454d] dark:text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2 px-4 ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...tableData].reverse().map((row, i, arr) => (
                  <tr key={row.label}>
                    <td className={`py-[11px] px-4 text-[13px] text-[#333840] dark:text-[#c4c8d0] font-medium ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>{row.label}</td>
                    <td className={`py-[11px] px-4 text-right text-[13px] font-medium ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`} style={{ color: '#1a7a3c' }}>{formatMXNCompact(row.inc)}</td>
                    <td className={`py-[11px] px-4 text-right text-[13px] font-medium ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`} style={{ color: '#c0392b' }}>{formatMXNCompact(row.exp)}</td>
                    <td className={`py-[11px] px-4 text-right text-[13px] font-medium ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`} style={{ color: '#c8912a' }}>{formatMXNCompact(row.debt)}</td>
                    <td className={`py-[11px] px-4 text-right text-[13px] font-semibold ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`} style={{ color: row.net >= 0 ? '#1a7a3c' : '#c0392b' }}>{formatMXNCompact(row.net)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-[#e8e8e8] dark:border-[#2d3347]">
                  <td className="py-[11px] px-4 text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">Total</td>
                  <td className="py-[11px] px-4 text-right text-[13px] font-semibold" style={{ color: '#1a7a3c' }}>{formatMXNCompact(tableData.reduce((s, r) => s + r.inc, 0))}</td>
                  <td className="py-[11px] px-4 text-right text-[13px] font-semibold" style={{ color: '#c0392b' }}>{formatMXNCompact(tableData.reduce((s, r) => s + r.exp, 0))}</td>
                  <td className="py-[11px] px-4 text-right text-[13px] font-semibold" style={{ color: '#c8912a' }}>{formatMXNCompact(tableData.reduce((s, r) => s + r.debt, 0))}</td>
                  <td className="py-[11px] px-4 text-right text-[13px] font-semibold" style={{ color: tableData.reduce((s, r) => s + r.net, 0) >= 0 ? '#1a7a3c' : '#c0392b' }}>{formatMXNCompact(tableData.reduce((s, r) => s + r.net, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-5">
          <p className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0] mb-4">Expense Mix</p>
          {donutData.length > 0 ? (
            <DonutChart data={donutData} centerLabel="Total" centerValue={formatMXNCompact(totalExpenses)} height={200} />
          ) : (
            <p className="text-[13px] text-[#41454d] dark:text-[#9297a0] py-8 text-center">No expenses in this period</p>
          )}
          {(totalGains > 0 || totalDebt > 0) && (
            <p className="text-[12px] text-[#41454d] dark:text-[#9297a0] mt-3 text-center">
              {totalGains > 0 && <>Investment returns: <span className="font-medium text-[#3aab85]">{formatMXNCompact(totalGains)}</span></>}
              {totalGains > 0 && totalDebt > 0 && <> · </>}
              {totalDebt > 0 && <>Debt payments: <span className="font-medium text-[#aa2d00]">{formatMXNCompact(totalDebt)}</span></>}
            </p>
          )}
        </div>
      </div>

      {/* Period Comparison */}
      <div className="mb-8">
        <SectionTitle>Period Comparison</SectionTitle>
        <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-[12px] font-semibold text-[#41454d] dark:text-[#9297a0] mb-2">Period A</p>
              <PeriodSelector mode="month" value={compA} onChange={(_, v) => setCompA(v)} modes={['month']} />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-[#41454d] dark:text-[#9297a0] mb-2">Period B</p>
              <PeriodSelector mode="month" value={compB} onChange={(_, v) => setCompB(v)} modes={['month']} />
            </div>
          </div>

          <div className="overflow-x-auto mb-5">
            <table className="w-full">
              <thead>
                <tr>
                  {['Metric', monthNames[(compA.month ?? 1) - 1], monthNames[(compB.month ?? 1) - 1], 'Variance'].map((h, i) => (
                    <th key={h} className={`text-[11px] font-semibold uppercase text-[#41454d] dark:text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2 px-4 ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compMetrics.map((metric, i) => {
                  const a = metricsA[metric] ?? 0
                  const b = metricsB[metric] ?? 0
                  const variance = b - a
                  return (
                    <tr key={metric}>
                      <td className={`py-[11px] px-4 text-[13px] text-[#333840] dark:text-[#c4c8d0] ${i < compMetrics.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>{metric}</td>
                      <td className={`py-[11px] px-4 text-right text-[13px] text-[#181d26] dark:text-[#e8eaf0] ${i < compMetrics.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>{formatMXN(a)}</td>
                      <td className={`py-[11px] px-4 text-right text-[13px] text-[#181d26] dark:text-[#e8eaf0] ${i < compMetrics.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>{formatMXN(b)}</td>
                      <td className={`py-[11px] px-4 text-right text-[13px] font-semibold ${i < compMetrics.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`} style={{ color: variance >= 0 ? '#1a7a3c' : '#c0392b' }}>
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
