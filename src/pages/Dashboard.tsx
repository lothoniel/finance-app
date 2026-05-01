import { useState, useMemo } from 'react'
import { ArrowLeftRight, Banknote, Receipt, CreditCard, TrendingUp, Wallet } from 'lucide-react'
import { useStore } from '../store'
import { filterByPeriod, type PeriodMode, type PeriodValue } from '../lib/filters'
import { formatMXN, formatMXNCompact, formatDate } from '../lib/formatters'

function currentMonth(): PeriodValue {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}


function last7Months() {
  const now = new Date()
  const months: PeriodValue[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 })
  }
  return months
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1)
  return (
    <div className="flex items-end gap-[2px] h-8 mt-3">
      {values.map((v, i) => {
        const pct = Math.max((v / max) * 100, 4)
        const isLast = i === values.length - 1
        return (
          <div
            key={i}
            className="w-3 rounded-sm flex-shrink-0 transition-all duration-600"
            style={{
              height: `${pct}%`,
              backgroundColor: color,
              opacity: isLast ? 1 : 0.33,
            }}
          />
        )
      })}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-[14px] font-semibold text-[#181d26] dark:text-[#e8eaf0] whitespace-nowrap">{children}</span>
      <span className="flex-1 h-px bg-[#e8e8e8] dark:bg-[#2d3347]" />
    </div>
  )
}

const TAB_MODES: { label: string; mode: PeriodMode }[] = [
  { label: 'Month', mode: 'month' },
  { label: 'Quarter', mode: 'quarter' },
  { label: 'Year', mode: 'year' },
  { label: 'All Time', mode: 'all' },
]

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<PeriodMode>('month')
  const [periodValue, setPeriodValue] = useState<PeriodValue>(currentMonth)

  const expenses = useStore((s) => s.expenses)
  const paychecks = useStore((s) => s.paychecks)
  const transfers = useStore((s) => s.transfers)
  const debtPayments = useStore((s) => s.debtPayments)
  const portfolios = useStore((s) => s.portfolios)
  const investmentMovements = useStore((s) => s.investmentMovements)
  const expenseCategories = useStore((s) => s.settings.expenseCategories)
  const categoryNameById = useMemo(
    () => Object.fromEntries(expenseCategories.map((c) => [c.id, c.name])),
    [expenseCategories]
  )

  function handleTabChange(mode: PeriodMode) {
    setActiveTab(mode)
    setPeriodValue(currentMonth())
  }

  // Period-filtered data (hero KPIs)
  const filteredExpenses = useMemo(
    () => filterByPeriod(expenses, activeTab, periodValue),
    [expenses, activeTab, periodValue]
  )
  const filteredPaychecks = useMemo(
    () => filterByPeriod(paychecks, activeTab, periodValue),
    [paychecks, activeTab, periodValue]
  )
  const filteredTransfers = useMemo(
    () => filterByPeriod(transfers, activeTab, periodValue),
    [transfers, activeTab, periodValue]
  )
  const filteredDebt = useMemo(
    () => filterByPeriod(debtPayments, activeTab, periodValue),
    [debtPayments, activeTab, periodValue]
  )

  const periodIncome = filteredPaychecks.reduce((s, p) => s + p.mxnAmount, 0)
    + filteredTransfers.reduce((s, t) => s + t.amount, 0)
  const periodExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0)
  const periodDebt = filteredDebt.reduce((s, d) => s + d.amount, 0)
  const periodNetFlow = periodIncome - periodExpenses - periodDebt

  // Current month for body section KPIs
  const currMonth = currentMonth()
  const monthPaychecks = filterByPeriod(paychecks, 'month', currMonth)
  const monthTransfers = filterByPeriod(transfers, 'month', currMonth)
  const monthExpenses = filterByPeriod(expenses, 'month', currMonth)
  const monthDebt = filterByPeriod(debtPayments, 'month', currMonth)

  const monthlyInflow =
    monthPaychecks.reduce((s, p) => s + p.mxnAmount, 0) +
    monthTransfers.reduce((s, t) => s + t.amount, 0)
  const monthlyExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const monthlyDebt = monthDebt.reduce((s, d) => s + d.amount, 0)
  const totalPortfolioBalance = portfolios.reduce((s, p) => s + p.balance, 0)
  const debtToIncomeRaw = monthlyInflow > 0 ? (monthlyDebt / monthlyInflow) * 100 : 0
  const savingsRateRaw = monthlyInflow > 0
    ? Math.max(((monthlyInflow - monthlyExpenses - monthlyDebt) / monthlyInflow) * 100, 0)
    : 0

  // Sparkline data (last 7 months)
  const sevenMonths = useMemo(() => last7Months(), [])

  const investmentSparkline = useMemo(
    () => sevenMonths.map(({ year, month }) =>
      filterByPeriod(investmentMovements, 'month', { year, month })
        .filter((m) => m.type === 'GAIN')
        .reduce((s, m) => s + m.amount, 0)
    ),
    [sevenMonths, investmentMovements]
  )

  const debtRatioSparkline = useMemo(
    () => sevenMonths.map(({ year, month }) => {
      const inc = filterByPeriod(paychecks, 'month', { year, month }).reduce((s, p) => s + p.mxnAmount, 0)
        + filterByPeriod(transfers, 'month', { year, month }).reduce((s, t) => s + t.amount, 0)
      const debt = filterByPeriod(debtPayments, 'month', { year, month }).reduce((s, d) => s + d.amount, 0)
      return inc > 0 ? (debt / inc) * 100 : 0
    }),
    [sevenMonths, paychecks, transfers, debtPayments]
  )

  const savingsSparkline = useMemo(
    () => sevenMonths.map(({ year, month }) => {
      const inc = filterByPeriod(paychecks, 'month', { year, month }).reduce((s, p) => s + p.mxnAmount, 0)
        + filterByPeriod(transfers, 'month', { year, month }).reduce((s, t) => s + t.amount, 0)
      const exp = filterByPeriod(expenses, 'month', { year, month }).reduce((s, e) => s + e.amount, 0)
      const debt = filterByPeriod(debtPayments, 'month', { year, month }).reduce((s, d) => s + d.amount, 0)
      return inc > 0 ? Math.max(((inc - exp - debt) / inc) * 100, 0) : 0
    }),
    [sevenMonths, paychecks, transfers, expenses, debtPayments]
  )

  // Top 5 categories for horizontal bar chart
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {}
    filteredExpenses.forEach((e) => {
      const name = categoryNameById[e.category] ?? e.category
      map[name] = (map[name] ?? 0) + e.amount
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [filteredExpenses, categoryNameById])

  const maxCategoryTotal = categoryTotals[0]?.[1] ?? 1

  // Recent activity
  const recentActivity = useMemo(() => {
    const all = [
      ...expenses.map((e) => ({
        id: e.id,
        date: e.date,
        description: e.description,
        amount: -e.amount,
        sub: e.category,
      })),
      ...paychecks.map((p) => ({
        id: p.id,
        date: p.date,
        description: 'Paycheck',
        amount: p.mxnAmount,
        sub: 'paycheck',
      })),
      ...transfers.map((t) => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        sub: t.category,
      })),
      ...debtPayments.map((d) => ({
        id: d.id,
        date: d.date,
        description: d.description,
        amount: -d.amount,
        sub: d.card,
      })),
    ]
    return all.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  }, [expenses, paychecks, transfers, debtPayments])

  // Insights data
  const topCategory = categoryTotals[0]?.[0] ?? '—'
  const topCategoryPct = categoryTotals[0]
    ? ((categoryTotals[0][1] / (periodExpenses || 1)) * 100).toFixed(0)
    : '0'

  return (
    <div>
      {/* Hero Band */}
      <div
        className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 relative px-8 md:px-10 pt-8 pb-10 mb-8"
        style={{ background: '#0a2e0e' }}
      >
        {/* Period tabs */}
        <div className="flex gap-1 mb-6 bg-white/10 rounded-full p-1 w-fit">
          {TAB_MODES.map(({ label, mode }) => (
            <button
              key={mode}
              onClick={() => handleTabChange(mode)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                activeTab === mode ? 'bg-white text-[#181d26]' : 'text-white/80 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Hero KPIs */}
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Net Flow', value: formatMXN(periodNetFlow), icon: <ArrowLeftRight className="w-4 h-4" /> },
            { label: 'Income', value: formatMXN(periodIncome), icon: <Banknote className="w-4 h-4" /> },
            { label: 'Expenses', value: formatMXN(periodExpenses), icon: <Receipt className="w-4 h-4" /> },
            { label: 'Debt Paid', value: formatMXN(periodDebt), icon: <CreditCard className="w-4 h-4" /> },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="rounded-[10px] px-5 py-4 min-w-[140px]"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <div className="flex items-center gap-1.5 text-white/60 mb-2">
                {icon}
                <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-white/75">{label}</p>
              </div>
              <p className="text-[28px] font-normal text-white leading-tight">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 1: Portfolio & Wealth */}
      <div className="mb-8">
        <SectionTitle>Portfolio &amp; Wealth</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Investments */}
          <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-[6px] flex items-center justify-center" style={{ backgroundColor: '#eef8f4' }}>
                <TrendingUp className="w-3.5 h-3.5" style={{ color: '#2e7d65' }} />
              </div>
              <span className="inline-block text-[11px] font-semibold uppercase px-2 py-1 rounded-[4px] bg-[#eef8f4] text-[#2e7d65]">
                Investments
              </span>
            </div>
            <p className="text-[28px] font-normal text-[#181d26] dark:text-[#e8eaf0] leading-tight">
              {formatMXNCompact(totalPortfolioBalance)}
            </p>
            <p className="text-[12px] text-[#41454d] dark:text-[#9297a0] mt-1">Total portfolio balance</p>
            <Sparkline values={investmentSparkline} color="#2e7d65" />
          </div>

          {/* Debt Ratio */}
          <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-[6px] flex items-center justify-center" style={{ backgroundColor: '#fff1ec' }}>
                <CreditCard className="w-3.5 h-3.5" style={{ color: '#aa2d00' }} />
              </div>
              <span className="inline-block text-[11px] font-semibold uppercase px-2 py-1 rounded-[4px] bg-[#fff1ec] text-[#aa2d00]">
                Debt Ratio
              </span>
            </div>
            <p className="text-[28px] font-normal text-[#181d26] dark:text-[#e8eaf0] leading-tight">
              {debtToIncomeRaw.toFixed(1)}%
            </p>
            <p className="text-[12px] text-[#41454d] dark:text-[#9297a0] mt-1">Debt-to-income this month</p>
            <Sparkline values={debtRatioSparkline} color="#aa2d00" />
          </div>

          {/* Savings Rate */}
          <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-[6px] flex items-center justify-center" style={{ backgroundColor: '#fdf6e3' }}>
                <Wallet className="w-3.5 h-3.5" style={{ color: '#c8912a' }} />
              </div>
              <span className="inline-block text-[11px] font-semibold uppercase px-2 py-1 rounded-[4px] bg-[#fdf6e3] text-[#c8912a]">
                Savings Rate
              </span>
            </div>
            <p className="text-[28px] font-normal text-[#181d26] dark:text-[#e8eaf0] leading-tight">
              {savingsRateRaw.toFixed(1)}%
            </p>
            <p className="text-[12px] text-[#41454d] dark:text-[#9297a0] mt-1">Of income retained this month</p>
            <Sparkline values={savingsSparkline} color="#c8912a" />
          </div>
        </div>
      </div>

      {/* Section 2: Spending Breakdown */}
      <div className="mb-8">
        <SectionTitle>Spending Breakdown</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Horizontal bar chart */}
          <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-5">
            <p className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0] mb-4">By Category</p>
            {categoryTotals.length === 0 ? (
              <p className="text-[13px] text-[#41454d] dark:text-[#9297a0]">No expenses in this period.</p>
            ) : (
              <div className="space-y-3">
                {categoryTotals.map(([cat, total]) => (
                  <div key={cat}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[13px] text-[#333840] dark:text-[#c4c8d0]">{cat}</span>
                      <span className="text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0]">{formatMXNCompact(total)}</span>
                    </div>
                    <div className="h-2 bg-[#f0f2f5] dark:bg-[#252b3b] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-600"
                        style={{
                          width: `${(total / maxCategoryTotal) * 100}%`,
                          backgroundColor: '#aa2d00',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity table */}
          <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] overflow-hidden">
            <p className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0] px-5 pt-5 pb-3">Recent Activity</p>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-[11px] font-semibold uppercase text-[#41454d] dark:text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2 px-5">
                    Description
                  </th>
                  <th className="text-left text-[11px] font-semibold uppercase text-[#41454d] dark:text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2 px-5">
                    Date
                  </th>
                  <th className="text-right text-[11px] font-semibold uppercase text-[#41454d] dark:text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2 px-5">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((item, i) => (
                  <tr key={item.id}>
                    <td className={`py-[11px] px-5 ${i < recentActivity.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>
                      <p className="text-[13px] text-[#181d26] dark:text-[#e8eaf0] truncate max-w-[180px]">{item.description}</p>
                      <p className="text-[11px] text-[#41454d] dark:text-[#9297a0]">{item.sub}</p>
                    </td>
                    <td className={`py-[11px] px-5 text-[13px] text-[#41454d] dark:text-[#9297a0] whitespace-nowrap ${i < recentActivity.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>
                      {formatDate(item.date)}
                    </td>
                    <td className={`py-[11px] px-5 text-right font-medium text-[13px] ${i < recentActivity.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}
                      style={{ color: item.amount >= 0 ? '#1a7a3c' : '#c0392b' }}
                    >
                      {item.amount >= 0 ? '+' : ''}{formatMXNCompact(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 3: Insights */}
      <div>
        <SectionTitle>Insights</SectionTitle>
        <div className="space-y-3">
          <div
            className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[8px] p-4 flex gap-3"
            style={{ borderLeftWidth: 3, borderLeftColor: '#aa2d00' }}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase text-[#181d26]/70 dark:text-[#e8eaf0]/70 tracking-[0.4px] mb-1">Top Spending</p>
              <p className="text-[13px] text-[#333840] dark:text-[#c4c8d0] leading-relaxed">
                {topCategory} accounts for {topCategoryPct}% of your {activeTab === 'month' ? 'monthly' : ''} expenses
                {categoryTotals[0] ? ` (${formatMXNCompact(categoryTotals[0][1])})` : ''}.
              </p>
            </div>
          </div>

          <div
            className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[8px] p-4 flex gap-3"
            style={{ borderLeftWidth: 3, borderLeftColor: '#2e7d65' }}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase text-[#181d26]/70 dark:text-[#e8eaf0]/70 tracking-[0.4px] mb-1">Savings Rate</p>
              <p className="text-[13px] text-[#333840] dark:text-[#c4c8d0] leading-relaxed">
                You're retaining {savingsRateRaw.toFixed(1)}% of income this month
                {savingsRateRaw >= 20 ? ' — above the 20% target.' : ' — below the 20% target.'}
              </p>
            </div>
          </div>

          <div
            className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[8px] p-4 flex gap-3"
            style={{ borderLeftWidth: 3, borderLeftColor: '#c8912a' }}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase text-[#181d26]/70 dark:text-[#e8eaf0]/70 tracking-[0.4px] mb-1">Debt Load</p>
              <p className="text-[13px] text-[#333840] dark:text-[#c4c8d0] leading-relaxed">
                Debt payments represent {debtToIncomeRaw.toFixed(1)}% of income this month
                {debtToIncomeRaw > 36 ? ' — above the recommended 36% threshold.' : '.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
