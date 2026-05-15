import { useState, useMemo } from 'react'
import { addMonths, parseISO } from 'date-fns'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store'
import { filterByPeriod, sortByDateDesc, type PeriodMode, type PeriodValue } from '../lib/filters'
import { formatMoneyCompact, formatShortMonth, formatDate } from '../lib/formatters'
import { PERIOD_SCALE } from '../lib/constants'
import StackedBarChart from '../components/charts/StackedBarChart'

function currentMonth(): PeriodValue {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

function last7Months(): PeriodValue[] {
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
      {values.map((v, i) => (
        <div
          key={i}
          className="w-3 rounded-sm flex-shrink-0"
          style={{
            height: `${Math.max((v / max) * 100, 4)}%`,
            backgroundColor: color,
            opacity: i === values.length - 1 ? 1 : 0.33,
          }}
        />
      ))}
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

const TAB_MODES: { key: 'monthly' | 'quarterly' | 'yearly'; mode: PeriodMode }[] = [
  { key: 'monthly', mode: 'month' },
  { key: 'quarterly', mode: 'quarter' },
  { key: 'yearly', mode: 'year' },
]

const FREQ_MONTHS: Record<string, number> = { monthly: 1, bimonthly: 2, annual: 12 }

const CARD = 'bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px]'

export default function Dashboard() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<PeriodMode>('month')
  const [periodValue, setPeriodValue] = useState<PeriodValue>(currentMonth)

  const language = useStore((s) => s.settings.language)
  const currency = useStore((s) => s.settings.currencyDisplay)
  const expenses = useStore((s) => s.expenses)
  const paychecks = useStore((s) => s.paychecks)
  const transfers = useStore((s) => s.transfers)
  const debtPayments = useStore((s) => s.debtPayments)
  const portfolios = useStore((s) => s.portfolios)
  const investmentMovements = useStore((s) => s.investmentMovements)
  const mortgagePayments = useStore((s) => s.mortgagePayments)
  const mortgageConfig = useStore((s) => s.mortgageConfig)
  const expenseCategories = useStore((s) => s.settings.expenseCategories)
  const recurringExpenses = useStore((s) => s.recurringExpenses)

  const categoryNameById = useMemo(
    () => Object.fromEntries(expenseCategories.map((c) => [c.id, c.name])),
    [expenseCategories]
  )
  const categoryColorByName = useMemo(
    () => Object.fromEntries(expenseCategories.map((c) => [c.name, c.color])),
    [expenseCategories]
  )

  function handleTabChange(mode: PeriodMode) {
    setActiveTab(mode)
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    if (mode === 'quarter') {
      setPeriodValue({ year, quarter: Math.ceil(month / 3) })
    } else if (mode === 'year') {
      setPeriodValue({ year })
    } else {
      setPeriodValue({ year, month })
    }
  }

  // Period-filtered data
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
  const filteredInvestments = useMemo(
    () => filterByPeriod(investmentMovements, activeTab, periodValue),
    [investmentMovements, activeTab, periodValue]
  )

  const periodIncome =
    filteredPaychecks.reduce((s, p) => s + p.mxnAmount, 0) +
    filteredTransfers.reduce((s, t) => s + t.amount, 0)
  const periodExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0)
  const periodDebt = filteredDebt.reduce((s, d) => s + d.amount, 0)
  const periodInvestDeposits = filteredInvestments
    .filter(m => m.type === 'DEPOSIT')
    .reduce((s, m) => s + m.amount, 0)
  const periodNetFlow = periodIncome - periodExpenses - periodDebt
  const periodSavingsRate =
    periodIncome > 0
      ? Math.min(100, Math.max(0, ((periodIncome - periodDebt - periodInvestDeposits) / periodIncome) * 100))
      : 0

  const totalPortfolioBalance = portfolios.reduce((s, p) => s + p.balance, 0)

  const currentMortgageBalance = useMemo(() => {
    if (mortgagePayments.length === 0) return mortgageConfig.principal
    return sortByDateDesc(mortgagePayments)[0].balanceAfter
  }, [mortgagePayments, mortgageConfig])

  const netWorth = totalPortfolioBalance - currentMortgageBalance
  const debtToIncomeRaw =
    periodIncome > 0 ? (periodDebt / periodIncome) * 100 : 0

  // 7-month sparklines
  const sevenMonths = useMemo(() => last7Months(), [])

  const investmentSparkline = useMemo(
    () =>
      sevenMonths.map(({ year, month }) =>
        filterByPeriod(investmentMovements, 'month', { year, month })
          .filter((m) => m.type === 'GAIN')
          .reduce((s, m) => s + m.amount, 0)
      ),
    [sevenMonths, investmentMovements]
  )

  const debtRatioSparkline = useMemo(
    () =>
      sevenMonths.map(({ year, month }) => {
        const inc =
          filterByPeriod(paychecks, 'month', { year, month }).reduce((s, p) => s + p.mxnAmount, 0) +
          filterByPeriod(transfers, 'month', { year, month }).reduce((s, t) => s + t.amount, 0)
        const debt = filterByPeriod(debtPayments, 'month', { year, month }).reduce(
          (s, d) => s + d.amount,
          0
        )
        return inc > 0 ? (debt / inc) * 100 : 0
      }),
    [sevenMonths, paychecks, transfers, debtPayments]
  )

  const upcomingRecurring = useMemo(() => {
    return recurringExpenses
      .filter((r) => r.status === 'active')
      .map((r) => ({
        name: r.name,
        amount: r.amount,
        nextDate: addMonths(parseISO(r.lastDate), FREQ_MONTHS[r.frequency] ?? 1),
      }))
      .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime())
      .slice(0, 5)
  }, [recurringExpenses])

  // Period-filtered category totals (Spending Breakdown + Insights)
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {}
    filteredExpenses.forEach((e) => {
      const name = categoryNameById[e.category] ?? e.category
      map[name] = (map[name] ?? 0) + e.amount
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
  }, [filteredExpenses, categoryNameById])

  const maxCategoryTotal = categoryTotals[0]?.[1] ?? 1

  // Chart months: window depends on active tab
  const chartMonths = useMemo((): PeriodValue[] => {
    if (activeTab === 'quarter') {
      const q = periodValue.quarter ?? 1
      const year = periodValue.year ?? new Date().getFullYear()
      const startMonth = (q - 1) * 3 + 1
      return [0, 1, 2].map((i) => ({ year, month: startMonth + i }))
    }
    if (activeTab === 'year') {
      const year = periodValue.year ?? new Date().getFullYear()
      return Array.from({ length: 12 }, (_, i) => ({ year, month: i + 1 }))
    }
    // month: last 7 months ending at selected month
    const endYear = periodValue.year ?? new Date().getFullYear()
    const endMonth = periodValue.month ?? new Date().getMonth() + 1
    const months: PeriodValue[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(endYear, endMonth - 1 - i, 1)
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 })
    }
    return months
  }, [activeTab, periodValue])

  const chartTitle = useMemo(() => {
    if (activeTab === 'quarter') {
      return t('dashboard.trends.categoryBreakdownQuarter', { quarter: periodValue.quarter ?? 1, year: periodValue.year })
    }
    if (activeTab === 'year') {
      return t('dashboard.trends.categoryBreakdownYear', { year: periodValue.year })
    }
    return t('dashboard.trends.categoryBreakdownLast7')
  }, [activeTab, periodValue, t])

  // Stacked bar chart: period-aware months × top 7 categories
  const { stackedChartData, chartCategories } = useMemo(() => {
    const totalsMap: Record<string, number> = {}
    chartMonths.forEach(({ year, month }) => {
      filterByPeriod(expenses, 'month', { year, month }).forEach((e) => {
        const name = categoryNameById[e.category] ?? e.category
        totalsMap[name] = (totalsMap[name] ?? 0) + e.amount
      })
    })
    const topCats = Object.entries(totalsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([name]) => name)

    const chartCategories = topCats.map((name) => ({
      name,
      color: categoryColorByName[name] ?? '#aaa',
    }))

    const stackedChartData = chartMonths.map(({ year, month }) => {
      const monthExp = filterByPeriod(expenses, 'month', { year, month })
      const row: Record<string, unknown> = {
        month: formatShortMonth(`${year}-${String(month).padStart(2, '0')}-01`, language),
      }
      topCats.forEach((name) => {
        row[name] = monthExp
          .filter((e) => (categoryNameById[e.category] ?? e.category) === name)
          .reduce((s, e) => s + e.amount, 0)
      })
      return row
    })
    return { stackedChartData, chartCategories }
  }, [chartMonths, expenses, categoryNameById, categoryColorByName, language])

  // Recent activity
  const recentActivity = useMemo(() => {
    const all = [
      ...expenses.map((e) => ({
        id: e.id,
        date: e.date,
        description: e.description,
        amount: -e.amount,
        sub: categoryNameById[e.category] ?? e.category,
      })),
      ...paychecks.map((p) => ({
        id: p.id,
        date: p.date,
        description: t('dashboard.recurring.paycheck'),
        amount: p.mxnAmount,
        sub: t('dashboard.recurring.paycheck'),
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
    return sortByDateDesc(all).slice(0, 6)
  }, [expenses, paychecks, transfers, debtPayments, categoryNameById, t])

  // Budget status (period-filtered)
  const budgetStatus = useMemo(
    () => {
      const scale = PERIOD_SCALE[activeTab] ?? 1
      return expenseCategories
        .filter((cat) => cat.budget && cat.budget > 0)
        .map((cat) => {
          const spent = filteredExpenses
            .filter((e) => e.category === cat.id)
            .reduce((s, e) => s + e.amount, 0)
          const budget = cat.budget! * scale
          const pct = (spent / budget) * 100
          return { id: cat.id, name: cat.name, color: cat.color, spent, budget, pct }
        })
        .filter((item) => item.spent > 0)
        .sort((a, b) => b.pct - a.pct)
    },
    [expenseCategories, filteredExpenses, activeTab]
  )

  // Insights
  const topCategory = categoryTotals[0]?.[0] ?? '—'
  const topCategoryPct =
    categoryTotals[0] ? ((categoryTotals[0][1] / (periodExpenses || 1)) * 100).toFixed(0) : '0'
  const periodLabel = t(`dashboard.periods.${activeTab === 'month' ? 'month' : activeTab === 'quarter' ? 'quarter' : 'year'}`)

  // Savings Rate SVG donut (r=28, circumference ≈ 175.9)
  const RADIUS = 28
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const savingsDash = Math.min(periodSavingsRate / 100, 1) * CIRCUMFERENCE

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[20px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">{t('nav.items.dashboard')}</h1>
        <div className="flex bg-[#f0f2f5] dark:bg-[#252b3b] rounded-full p-0.5">
          {TAB_MODES.map(({ key, mode }) => (
            <button
              key={mode}
              onClick={() => handleTabChange(mode)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                activeTab === mode
                  ? 'bg-white dark:bg-[#1e2330] text-[#181d26] dark:text-[#e8eaf0] shadow-sm'
                  : 'text-[#41454d] dark:text-[#9297a0] hover:text-[#181d26] dark:hover:text-[#e8eaf0]'
              }`}
            >
              {t(`dashboard.tabs.${key}`)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className="flex items-center gap-6 flex-wrap mb-8">
        {[
          { label: t('dashboard.kpis.netFlow'), value: formatMoneyCompact(periodNetFlow, currency), color: periodNetFlow >= 0 ? '#16a34a' : '#dc2626' },
          { label: t('dashboard.kpis.income'), value: formatMoneyCompact(periodIncome, currency), color: undefined },
          { label: t('dashboard.kpis.expenses'), value: formatMoneyCompact(periodExpenses, currency), color: '#dc2626' },
          { label: t('dashboard.kpis.debtPaid'), value: formatMoneyCompact(periodDebt, currency), color: '#ea580c' },
          { label: t('dashboard.kpis.savingsRate'), value: `${periodSavingsRate.toFixed(1)}%`, color: undefined },
        ].map(({ label, value, color }, i, arr) => (
          <div key={label} className="flex items-center gap-6">
            <div>
              <p
                className="text-[26px] font-semibold leading-tight"
                style={{ color: color ?? undefined }}
                // neutral items fall through to inherited text color via className
              >
                <span className={!color ? 'text-[#181d26] dark:text-[#e8eaf0]' : ''}>{value}</span>
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-[#41454d] dark:text-[#9297a0] mt-0.5">
                {label}
              </p>
            </div>
            {i < arr.length - 1 && (
              <div className="w-px h-10 bg-[#e8e8e8] dark:bg-[#2d3347] flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 items-start">
        {/* Left column */}
        <div className="space-y-8 min-w-0">

          {/* Portfolio & Wealth */}
          <div>
            <SectionTitle>{t('dashboard.portfolio.title')}</SectionTitle>
            <div className={`${CARD} grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#e8e8e8] dark:divide-[#2d3347]`}>
              <div className="p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-[#41454d] dark:text-[#9297a0] mb-2">{t('dashboard.portfolio.netWorth')}</p>
                <p className="text-[20px] font-normal text-[#181d26] dark:text-[#e8eaf0] leading-tight">{formatMoneyCompact(netWorth, currency)}</p>
                <p className="text-[12px] text-[#41454d] dark:text-[#9297a0] mt-1">{t('dashboard.portfolio.netWorthHint')}</p>
                <Sparkline values={investmentSparkline} color="#2e7d65" />
              </div>
              <div className="p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-[#41454d] dark:text-[#9297a0] mb-2">{t('dashboard.portfolio.investments')}</p>
                <p className="text-[20px] font-normal text-[#181d26] dark:text-[#e8eaf0] leading-tight">{formatMoneyCompact(totalPortfolioBalance, currency)}</p>
                <p className="text-[12px] text-[#41454d] dark:text-[#9297a0] mt-1">{t('dashboard.portfolio.investmentsHint')}</p>
                <Sparkline values={investmentSparkline} color="#2e7d65" />
              </div>
              <div className="p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-[#41454d] dark:text-[#9297a0] mb-2">{t('dashboard.portfolio.debtRatio')}</p>
                <p className="text-[20px] font-normal text-[#181d26] dark:text-[#e8eaf0] leading-tight">{debtToIncomeRaw.toFixed(1)}%</p>
                <p className="text-[12px] text-[#41454d] dark:text-[#9297a0] mt-1">{t('dashboard.portfolio.debtRatioHint')}</p>
                <Sparkline values={debtRatioSparkline} color="#aa2d00" />
              </div>
            </div>
          </div>

          {/* Spending Trends */}
          <div>
            <SectionTitle>{t('dashboard.trends.title')}</SectionTitle>
            <div className={`${CARD} p-5`}>
              <p className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0] mb-4">
                {chartTitle}
              </p>
              {chartCategories.length === 0 ? (
                <p className="text-[13px] text-[#41454d] dark:text-[#9297a0]">{t('dashboard.trends.empty')}</p>
              ) : (
                <StackedBarChart
                  data={stackedChartData}
                  categories={chartCategories}
                  xKey="month"
                  height={260}
                />
              )}
            </div>
          </div>

          {/* Spending Breakdown */}
          <div>
            <SectionTitle>{t('dashboard.breakdown.title')}</SectionTitle>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* By Category */}
              <div className={`${CARD} p-5`}>
                <p className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0] mb-4">
                  {t('dashboard.breakdown.byCategory')}
                </p>
                {categoryTotals.length === 0 ? (
                  <p className="text-[13px] text-[#41454d] dark:text-[#9297a0]">
                    {t('dashboard.breakdown.empty')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {categoryTotals.map(([cat, total]) => (
                      <div key={cat}>
                        <div className="flex justify-between mb-1">
                          <span className="text-[13px] text-[#333840] dark:text-[#c4c8d0]">{cat}</span>
                          <span className="text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0]">
                            {formatMoneyCompact(total, currency)}
                          </span>
                        </div>
                        <div className="h-2 bg-[#f0f2f5] dark:bg-[#252b3b] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(total / maxCategoryTotal) * 100}%`,
                              backgroundColor: categoryColorByName[cat] ?? '#aa2d00',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className={`${CARD} overflow-hidden`}>
                <p className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0] px-5 pt-5 pb-3">
                  {t('dashboard.breakdown.recentActivity')}
                </p>
                <table className="w-full">
                  <tbody>
                    {recentActivity.map((item, i) => (
                      <tr key={item.id}>
                        <td
                          className={`py-[10px] px-5 ${
                            i < recentActivity.length - 1
                              ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]'
                              : ''
                          }`}
                        >
                          <p className="text-[13px] text-[#181d26] dark:text-[#e8eaf0] truncate max-w-[140px]">
                            {item.description}
                          </p>
                          <p className="text-[11px] text-[#41454d] dark:text-[#9297a0]">
                            {item.sub} · {formatDate(item.date, language)}
                          </p>
                        </td>
                        <td
                          className={`py-[10px] px-5 text-right font-medium text-[13px] whitespace-nowrap ${
                            i < recentActivity.length - 1
                              ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]'
                              : ''
                          }`}
                          style={{ color: item.amount >= 0 ? '#1a7a3c' : '#c0392b' }}
                        >
                          {item.amount >= 0 ? '+' : ''}
                          {formatMoneyCompact(item.amount, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Budget Status */}
          {budgetStatus.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[14px] font-semibold text-[#181d26] dark:text-[#e8eaf0] whitespace-nowrap">
                  {t('dashboard.budget.title')}
                </span>
                <span className="flex-1 h-px bg-[#e8e8e8] dark:bg-[#2d3347]" />
                <Link
                  to="/budget"
                  className="text-[12px] text-[#41454d] dark:text-[#9297a0] hover:text-[#181d26] dark:hover:text-[#e8eaf0] whitespace-nowrap"
                >
                  {t('dashboard.budget.viewAll')}
                </Link>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {budgetStatus.map((item) => {
                  const isOver = item.spent > item.budget
                  return (
                    <div key={item.id} className={`${CARD} p-4`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0]">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-[12px] text-[#41454d] dark:text-[#9297a0]">
                          {formatMoneyCompact(item.spent, currency)} / {formatMoneyCompact(item.budget, currency)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#f0f2f5] dark:bg-[#252b3b] rounded-full overflow-hidden mb-1.5">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(item.pct, 100)}%`,
                            backgroundColor: isOver ? '#ef4444' : item.color,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#41454d] dark:text-[#9297a0]">
                          {t('dashboard.budget.percentUsed', { pct: Math.min(item.pct, 100).toFixed(0) })}
                        </span>
                        <span
                          className="text-[11px] font-medium"
                          style={{ color: isOver ? '#ef4444' : '#1a7a3c' }}
                        >
                          {isOver
                            ? t('dashboard.budget.over', { amount: formatMoneyCompact(item.spent - item.budget, currency) })
                            : t('dashboard.budget.left', { amount: formatMoneyCompact(item.budget - item.spent, currency) })}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Insights */}
          <div>
            <SectionTitle>{t('dashboard.insights.title')}</SectionTitle>
            <div className="space-y-3">
              <div
                className="rounded-[8px] p-4"
                style={{ borderLeft: '3px solid #c0392b', backgroundColor: '#fff5f5' }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.4px] mb-1" style={{ color: '#c0392b' }}>
                  {t('dashboard.insights.spendingAlertLabel')}
                </p>
                <p className="text-[13px] text-[#333840] leading-relaxed">
                  {t('dashboard.insights.spendingAlertBody', { category: topCategory, pct: topCategoryPct, period: periodLabel })}
                  {categoryTotals[0] ? t('dashboard.insights.spendingAlertAmount', { amount: formatMoneyCompact(categoryTotals[0][1], currency) }) : ''}.
                </p>
              </div>

              <div
                className="rounded-[8px] p-4"
                style={{ borderLeft: '3px solid #2e7d65', backgroundColor: '#f0faf6' }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.4px] mb-1" style={{ color: '#2e7d65' }}>
                  {t('dashboard.insights.savingsAlertLabel')}
                </p>
                <p className="text-[13px] text-[#333840] leading-relaxed">
                  {t('dashboard.insights.savingsAlertBody', { rate: periodSavingsRate.toFixed(1), period: periodLabel })}
                </p>
              </div>

              <div
                className="rounded-[8px] p-4"
                style={{ borderLeft: '3px solid #c8912a', backgroundColor: '#fffbef' }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.4px] mb-1" style={{ color: '#c8912a' }}>
                  {t('dashboard.insights.debtAlertLabel')}
                </p>
                <p className="text-[13px] text-[#333840] leading-relaxed">
                  {t('dashboard.insights.debtAlertBody', { rate: debtToIncomeRaw.toFixed(1) })}
                  {debtToIncomeRaw > 36 ? t('dashboard.insights.debtAlertOver') : '.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4 lg:sticky lg:top-6">
          {/* Financial Snapshot */}
          <div className={`${CARD} p-5`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-[#41454d] dark:text-[#9297a0] mb-4">
              {t('dashboard.snapshot.title')}
            </p>
            <div className="divide-y divide-[#e8e8e8] dark:divide-[#2d3347]">
              {[
                { label: t('dashboard.snapshot.netWorth'), value: formatMoneyCompact(netWorth, currency), color: '#2e7d65' },
                { label: t('dashboard.snapshot.investments'), value: formatMoneyCompact(totalPortfolioBalance, currency), color: '#2e7d65' },
                { label: t('dashboard.snapshot.cash'), value: '—', color: undefined },
                { label: t('dashboard.snapshot.totalDebt'), value: `-${formatMoneyCompact(periodDebt, currency)}`, color: '#c0392b' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <span className="text-[13px] text-[#41454d] dark:text-[#9297a0]">{label}</span>
                  <span
                    className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0]"
                    style={color ? { color } : undefined}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Savings Rate donut */}
          <div className={`${CARD} p-5`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-[#41454d] dark:text-[#9297a0] mb-4">
              {t('dashboard.savings.title')}
            </p>
            <div className="flex flex-col items-center">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r={RADIUS}
                  fill="none"
                  stroke="#f0f2f5"
                  strokeWidth="8"
                  className="dark:stroke-[#252b3b]"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={RADIUS}
                  fill="none"
                  stroke="#2e7d65"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${savingsDash} ${CIRCUMFERENCE}`}
                  transform="rotate(-90 40 40)"
                />
                <text
                  x="40"
                  y="44"
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="600"
                  fill="#181d26"
                >
                  {periodSavingsRate.toFixed(0)}%
                </text>
              </svg>
              <p className="text-[12px] text-[#41454d] dark:text-[#9297a0] mt-2 text-center">
                {t('dashboard.savings.ofIncome')}
              </p>
            </div>
          </div>

          {/* Upcoming Recurring */}
          <div className={`${CARD} p-5`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-[#41454d] dark:text-[#9297a0] mb-4">
              {t('dashboard.recurring.title')}
            </p>
            {upcomingRecurring.length === 0 ? (
              <p className="text-[13px] text-[#9297a0]">{t('dashboard.recurring.empty')}</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingRecurring.map(({ name, amount }) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-[13px] text-[#333840] dark:text-[#c4c8d0]">{name}</span>
                    <span className="text-[13px] font-medium" style={{ color: '#aa2d00' }}>
                      {formatMoneyCompact(amount, currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
